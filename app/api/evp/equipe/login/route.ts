import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, COOKIE_OPTS, ENV_SENHA_MESTRA, lerSessao, senhaMestraConfigurada, senhaMestraCorreta, tokenDaSessao } from "@/lib/evp/auth";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { conferirSenha } from "@/lib/evp/senha";
import type { Papel } from "@/lib/evp/tipos";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Atraso fixo por tentativa: encarece a força bruta sem punir quem acerta. */
const ATRASO_MS = 500;

type Conta = { id: string; nome: string; papel: Papel; senha_hash: string | null; ativo: boolean };

export async function GET() {
  const sessao = await lerSessao();
  return NextResponse.json({ sessao }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const limite = await rateLimit(`evp:login:${clientIp(req)}`, 10, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }
  await new Promise((r) => setTimeout(r, ATRASO_MS));

  const corpo = await req.json().catch(() => ({}));
  const email = typeof corpo?.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const senha = typeof corpo?.senha === "string" ? corpo.senha : "";
  if (!senha) return NextResponse.json({ error: "Informe o código de acesso." }, { status: 422 });

  try {
    let staffId: string | null = null;
    let papel: Papel | null = null;
    let nome = "";

    if (!email) {
      // Sem e-mail: tentativa com a senha mestra.
      if (!senhaMestraConfigurada()) {
        return NextResponse.json(
          { error: `Informe o e-mail da sua conta. A senha mestra não está configurada (${ENV_SENHA_MESTRA}).` },
          { status: 401 }
        );
      }
      if (!senhaMestraCorreta(senha)) return NextResponse.json({ error: "Código de acesso incorreto." }, { status: 401 });
      const m = await rpc<{ id: string; nome: string; papel: Papel } | null>("evp_staff_mestre", { p_slug: SLUG });
      if (!m) return NextResponse.json({ error: "Evento não encontrado. A migration já foi aplicada?" }, { status: 503 });
      staffId = m.id;
      papel = m.papel;
      nome = m.nome;
    } else {
      const conta = await rpc<Conta | null>("evp_staff_login", { p_slug: SLUG, p_email: email });
      const confere = await conferirSenha(senha, conta?.senha_hash);
      if (!conta || !conta.ativo || !conta.senha_hash || !confere) {
        return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      }
      await rpc("evp_staff_marcar_acesso", { p_staff: conta.id });
      staffId = conta.id;
      papel = conta.papel;
      nome = conta.nome;
    }

    const res = NextResponse.json({ ok: true, sessao: { nome, papel } });
    res.cookies.set(COOKIE, tokenDaSessao(staffId), COOKIE_OPTS);
    return res;
  } catch (erro) {
    console.error("[evp] Erro no login:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Não foi possível entrar agora. Tente de novo." }, { status: 503 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
