import type { ProfessorId } from "@/lib/assessoria-nps/survey";

/** O que a página (server) entrega para a pesquisa (client). */
export interface ConviteInicial {
  firstName: string;
  lastName: string;
  jaRespondeu: boolean;
  /** Professor do cadastro, quando é um dos que a pesquisa conhece. Com ele, não se pergunta. */
  professor: ProfessorId | null;
}

export type EstadoInicial =
  | { tipo: "aberta"; campanha: string; rotulo: string | null; convite: ConviteInicial | null }
  | { tipo: "agendada"; abreEm: string | null; rotulo: string | null }
  | { tipo: "encerrada"; rotulo: string | null }
  | { tipo: "nao-encontrada" }
  | { tipo: "indisponivel" };

/** O botão do rodapé fica fora do <form>; o atributo `form` liga os dois. */
export const FORM_ID = "nps-assessoria-form";
