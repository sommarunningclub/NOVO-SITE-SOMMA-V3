/**
 * Eventos da LP para o GTM/GA4 do site (app/layout.tsx), com prefixo
 * `love_run_`.
 *
 * Nunca entra CPF, nome, e-mail ou telefone: só comportamento (seção,
 * estado, pelotão escolhido). O filtro abaixo descarta qualquer chave com
 * cara de dado pessoal, para o caso de alguém passar sem querer.
 */
export type EventoLoveRun =
  | "lp_visualizada"
  | "cta_clicado"
  | "formulario_iniciado"
  | "inscricao_concluida"
  | "inscricao_erro"
  | "ja_inscrito"
  | "ingresso_visualizado"
  | "ingresso_salvo"
  | "codigo_copiado"
  | "como_chegar"
  | "festa_saiba_mais"
  | "evento_compartilhado"
  | "calendario_adicionado"
  | "recuperacao_solicitada";

type Props = Record<string, string | number | boolean | null>;

const PROIBIDOS = ["cpf", "email", "e-mail", "telefone", "whatsapp", "nome", "token"];

export function rastrear(nome: EventoLoveRun, props: Props = {}) {
  if (typeof window === "undefined") return;
  const limpo: Props = {};
  for (const [chave, valor] of Object.entries(props)) {
    if (PROIBIDOS.some((p) => chave.toLowerCase().includes(p))) continue;
    limpo[chave] = valor;
  }
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: `love_run_${nome}`, ...limpo });
}
