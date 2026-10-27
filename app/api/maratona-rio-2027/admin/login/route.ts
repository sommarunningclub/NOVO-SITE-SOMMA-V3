import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, COOKIE_OPTS, ENV_SENHA, acessoConfigurado, senhaCorreta, tokenDeAcesso } from "@/lib/maratona-rio-2027/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Atraso fixo por tentativa: encarece a força bruta sem punir quem acerta. */
const ATRASO_MS = 500;

export async function POST(req: NextRequest) {
  const limite = await rateLimit(`rio27:login:${clientIp(req)}`, 10, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  await new Promise((r) => setTimeout(r, ATRASO_MS));

  if (!acessoConfigurado()) {
    return NextResponse.json({ error: `Acesso ainda não configurado: falta ${ENV_SENHA} na Vercel.` }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const senha = typeof body?.senha === "string" ? body.senha : "";
  if (!senhaCorreta(senha)) return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, tokenDeAcesso(), COOKIE_OPTS);
  return res;
}

/** Sair: derruba o cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
