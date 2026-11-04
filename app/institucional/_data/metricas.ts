/**
 * Metadados comuns a todo número exibido na apresentação.
 * Todo número aparece com fonte e período; nenhum entra sem os dois.
 */
export type StatusVerificacao = "verificado" | "dados-internos" | "historico" | "demonstrativo";

export interface MetaMetrica {
  fonte: string;
  periodo: string;
  atualizadoEm: string; // ISO (AAAA-MM-DD)
  status: StatusVerificacao;
  definicao?: string;
}

export const ROTULO_STATUS: Record<StatusVerificacao, string> = {
  verificado: "Verificado",
  "dados-internos": "Dados internos",
  historico: "Histórico, a validar",
  demonstrativo: "Dados demonstrativos",
};
