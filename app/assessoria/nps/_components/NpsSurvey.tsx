"use client";

import { SurveyFlow } from "./SurveyFlow";
import { SurveyShell } from "./ui/SurveyShell";
import { StatusScreen } from "./screens/StatusScreen";
import type { EstadoInicial } from "./types";

/** Porta de entrada client: pesquisa aberta ou a tela que explica por que não está. */
export function NpsSurvey({ inicial }: { inicial: EstadoInicial }) {
  if (inicial.tipo === "aberta") {
    return <SurveyFlow campanha={inicial.campanha} rotulo={inicial.rotulo} convite={inicial.convite} />;
  }
  return (
    <SurveyShell>
      <StatusScreen
        variante={inicial.tipo}
        nome={null}
        focar={false}
        rotulo={"rotulo" in inicial ? inicial.rotulo : null}
        abreEm={inicial.tipo === "agendada" ? inicial.abreEm : null}
      />
    </SurveyShell>
  );
}
