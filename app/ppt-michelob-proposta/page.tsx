import { MichelobDeck } from "../ppt-michelob/_deck";
import { Gate } from "./_gate";
import { temAcesso } from "./auth";

// Lê cookie, então a rota é sempre renderizada sob demanda.
export const dynamic = "force-dynamic";

export default async function PptMichelobPropostaPage() {
  // Sem cookie válido o deck nem chega a ser renderizado, então os slides não
  // trafegam para quem não tem o código.
  if (!(await temAcesso())) return <Gate />;
  // Mesmo deck do /ppt-michelob, agora com o capítulo Proposta Financeira.
  return <MichelobDeck financial />;
}
