/** O que a página (server) entrega para a pesquisa (client). */
export interface ConviteInicial {
  firstName: string;
  lastName: string;
  jaRespondeu: boolean;
}

export type EstadoInicial =
  | { tipo: "aberta"; campanha: string; convite: ConviteInicial | null }
  | { tipo: "encerrada" }
  | { tipo: "indisponivel" };

/** O botão do rodapé fica fora do <form>; o atributo `form` liga os dois. */
export const FORM_ID = "nps-assessoria-form";
