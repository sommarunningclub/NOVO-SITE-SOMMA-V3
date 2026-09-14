import { NpsSurvey } from "./_components/NpsSurvey";
import { carregarEstadoInicial } from "./_lib/estado-inicial";

/** Link geral: abre a rodada que está no ar. Metadata e estilos vêm do layout. */
export const dynamic = "force-dynamic";

export default async function AssessoriaNpsPage() {
  return <NpsSurvey inicial={await carregarEstadoInicial()} />;
}
