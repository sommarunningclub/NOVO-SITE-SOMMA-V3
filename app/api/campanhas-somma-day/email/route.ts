import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import {
  VARIANTES,
  renderSommaDayCampanhaEmail,
  sommaDaySubject,
  type VarianteSommaDay,
} from "@/lib/emails/somma-day-campanha";

export const dynamic = "force-dynamic";

/**
 * O e-mail de uma variante, renderizado como vai sair, para o operador ler antes
 * de disparar. Nome de exemplo e link de descadastro falso: nada aqui toca a base.
 */
export async function GET(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const variante = new URL(request.url).searchParams.get("variante") as VarianteSommaDay;
  if (!VARIANTES.includes(variante)) {
    return NextResponse.json({ error: `Variante inválida. Use ${VARIANTES.join(" | ")}.` }, { status: 400 });
  }

  const html = renderSommaDayCampanhaEmail({
    variante,
    nome: "Maria Exemplo",
    descadastroUrl: "https://sommaclub.com.br/#descadastro-de-exemplo",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Assunto": encodeURIComponent(sommaDaySubject(variante)),
      "Cache-Control": "no-store",
    },
  });
}
