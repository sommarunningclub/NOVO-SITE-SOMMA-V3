import { NextRequest, NextResponse } from "next/server";
import {
  CLEAR_COOKIE,
  authConfigured,
  resolveRole,
  resolveUnitLogin,
  sessionCookie,
} from "@/lib/desafio-esteiras/auth";
import { clientIp, rateLimit } from "@/lib/desafio-esteiras/rate-limit";

export const dynamic = "force-dynamic";

/** Atraso fixo por tentativa — encarece força bruta sem punir quem acerta. */
const ATRASO_MS = 500;

export async function POST(request: NextRequest) {
  const inicio = Date.now();

  const ip = clientIp(request);
  const limit = await rateLimit(`dst:login:${ip}`, 10, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  if (!authConfigured()) {
    return NextResponse.json(
      { error: "Acesso ainda não configurado. Defina as senhas nas variáveis de ambiente." },
      { status: 503 }
    );
  }

  let senha = "";
  let unidade: string | null = null;
  try {
    const body = (await request.json()) as { senha?: unknown; unidade?: unknown };
    senha = typeof body.senha === "string" ? body.senha : "";
    unidade = typeof body.unidade === "string" ? body.unidade : null;
  } catch {
    senha = "";
  }

  /* Com `unidade`, o login veio da página daquela Evolve: quem diz a unidade é
     a URL, e a senha só autentica. Sem ela, é o login geral, em que a própria
     senha define o papel. */
  const session = unidade ? resolveUnitLogin(unidade, senha) : resolveRole(senha);

  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));

  if (!session) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role: session.role, unitId: session.unitId, nome: session.nome });
  const cookie = sessionCookie(session);
  res.cookies.set(cookie.name, cookie.value, cookie.opts);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLEAR_COOKIE.name, CLEAR_COOKIE.value, CLEAR_COOKIE.opts);
  return res;
}
