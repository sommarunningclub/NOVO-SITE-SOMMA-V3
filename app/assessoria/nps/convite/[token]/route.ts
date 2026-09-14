import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  CONVITE_COOKIE,
  CONVITE_MAX_AGE,
  TOKEN_RE,
  buscarCampanhaAtiva,
  buscarConvite,
  registrarAberturaDoConvite,
} from "@/lib/assessoria-nps/db";

export const dynamic = "force-dynamic";

/**
 * Link pessoal da pesquisa: /assessoria/nps/convite/<token>.
 *
 * Troca o token por um cookie httpOnly e redireciona para a URL limpa ANTES de
 * qualquer HTML carregar. Assim o token não fica na barra de endereço da
 * pesquisa, não entra no page_view do GA e não é lido por nenhum script.
 *
 * Token inválido, vencido ou de outra rodada não dá erro: a pessoa cai na
 * pesquisa normal e responde com o próprio nome.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const destino = new URL("/assessoria/nps", request.url);
  for (const chave of ["origem", "utm_source", "utm_medium", "utm_campaign"]) {
    const valor = request.nextUrl.searchParams.get(chave);
    if (valor) destino.searchParams.set(chave, valor.slice(0, 160));
  }

  const resposta = NextResponse.redirect(destino, 303);
  resposta.headers.set("Cache-Control", "no-store");
  resposta.headers.set("Referrer-Policy", "no-referrer");

  const limite = await rateLimit(`nps-assessoria:convite:${clientIp(request)}`, 30, 600);
  if (!limite.ok || !TOKEN_RE.test(token)) return resposta;

  const sb = getServiceSupabase();
  if (!sb) return resposta;

  const busca = await buscarCampanhaAtiva(sb);
  if (busca.status !== "ok") return resposta;

  const convite = await buscarConvite(sb, token, busca.campanha.id);
  if (!convite) return resposta;

  resposta.cookies.set(CONVITE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CONVITE_MAX_AGE,
  });
  await registrarAberturaDoConvite(sb, convite);

  return resposta;
}
