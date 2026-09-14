import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  CONVITE_COOKIE,
  CONVITE_MAX_AGE,
  TOKEN_RE,
  buscarConvite,
  buscarRodadaPorId,
  registrarAberturaDoConvite,
} from "@/lib/assessoria-nps/db";

export const dynamic = "force-dynamic";

/**
 * Link pessoal da pesquisa: /assessoria/nps/convite/<token>.
 *
 * Troca o token por um cookie httpOnly e redireciona para o link da rodada do
 * convite ANTES de qualquer HTML carregar. Assim o token não fica na barra de
 * endereço da pesquisa, não entra no page_view do GA e não é lido por nenhum
 * script.
 *
 * Token inválido não dá erro: a pessoa cai na pesquisa que está no ar e
 * responde com o próprio nome. Rodada ainda em rascunho também não abre.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const redirecionar = (caminho: string, comCookie: boolean) => {
    const destino = new URL(caminho, request.url);
    for (const chave of ["origem", "utm_source", "utm_medium", "utm_campaign"]) {
      const valor = request.nextUrl.searchParams.get(chave);
      if (valor) destino.searchParams.set(chave, valor.slice(0, 160));
    }
    const resposta = NextResponse.redirect(destino, 303);
    resposta.headers.set("Cache-Control", "no-store");
    resposta.headers.set("Referrer-Policy", "no-referrer");
    if (comCookie) {
      resposta.cookies.set(CONVITE_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: CONVITE_MAX_AGE,
      });
    }
    return resposta;
  };

  const limite = await rateLimit(`nps-assessoria:convite:${clientIp(request)}`, 30, 600);
  if (!limite.ok || !TOKEN_RE.test(token)) return redirecionar("/assessoria/nps", false);

  const sb = getServiceSupabase();
  if (!sb) return redirecionar("/assessoria/nps", false);

  const convite = await buscarConvite(sb, token);
  if (!convite) return redirecionar("/assessoria/nps", false);

  const rodada = await buscarRodadaPorId(sb, convite.campaign_id);
  if (!rodada || rodada.status === "draft") return redirecionar("/assessoria/nps", false);

  await registrarAberturaDoConvite(sb, convite);
  return redirecionar(`/assessoria/nps/${rodada.slug}`, true);
}
