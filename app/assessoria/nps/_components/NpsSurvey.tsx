"use client";

import { SurveyFlow } from "./SurveyFlow";
import { SurveyShell } from "./ui/SurveyShell";
import { StatusScreen } from "./screens/StatusScreen";
import type { EstadoInicial } from "./types";

/** Porta de entrada client: pesquisa aberta, encerrada ou indisponível. */
export function NpsSurvey({ inicial }: { inicial: EstadoInicial }) {
  if (inicial.tipo === "aberta") {
    return <SurveyFlow campanha={inicial.campanha} convite={inicial.convite} />;
  }
  return (
    <SurveyShell>
      <StatusScreen variante={inicial.tipo} nome={null} focar={false} />
    </SurveyShell>
  );
}
