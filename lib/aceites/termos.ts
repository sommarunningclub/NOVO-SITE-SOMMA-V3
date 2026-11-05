/**
 * Termos que a pessoa aceita nos formulários. Pode ser importado no cliente.
 *
 * MUDOU O TEXTO DE UM TERMO em /politica-de-privacidade? Mude a versão aqui:
 * é ela que diz, em `aceites_termos`, qual texto cada pessoa aceitou. O valor é
 * a data do texto; o conteúdo de cada versão fica no histórico do git.
 */
export const TERMO_IMAGEM_URL = "/politica-de-privacidade#uso-de-imagem";
export const TERMO_LGPD_URL = "/politica-de-privacidade";

export const VERSAO_TERMO = {
  uso_imagem: "2026-06-19",
  lgpd: "2026-06-19",
} as const;

export type TipoTermo = keyof typeof VERSAO_TERMO;
