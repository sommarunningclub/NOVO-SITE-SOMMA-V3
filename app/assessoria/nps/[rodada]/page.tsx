import { NpsSurvey } from "../_components/NpsSurvey";
import { carregarEstadoInicial } from "../_lib/estado-inicial";

/**
 * Link de uma rodada: /assessoria/nps/2026-set-out. O código vem do painel.
 * `convite` não cai aqui: a rota estática convite/[token] tem precedência, e o
 * banco reserva o slug.
 */
export const dynamic = "force-dynamic";

export default async function RodadaNpsPage({ params }: { params: Promise<{ rodada: string }> }) {
  const { rodada } = await params;
  let slug: string;
  try {
    slug = decodeURIComponent(rodada).trim().toLowerCase();
  } catch {
    slug = "";
  }
  return <NpsSurvey inicial={await carregarEstadoInicial(slug)} />;
}
