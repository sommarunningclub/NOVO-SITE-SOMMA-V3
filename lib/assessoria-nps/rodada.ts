/**
 * Rodadas do NPS da Assessoria: o que o público vê de cada uma.
 *
 * As rodadas são criadas no painel (admin.sommaclub.com.br › NPS Assessoria),
 * uma a cada dois meses. Cada uma tem link próprio pelo slug
 * (/assessoria/nps/2026-set-out) e uma janela `opens_at`/`closes_at`.
 *
 * Módulo puro: roda no cliente, no servidor e nos testes.
 */

export interface Campanha {
  id: string;
  slug: string;
  title: string;
  survey_version: string;
  reference_period: string;
  status: "draft" | "active" | "closed";
  opens_at: string | null;
  closes_at: string | null;
}

export type BuscaCampanha =
  | { status: "ok"; campanha: Campanha }
  | { status: "agendada"; campanha: Campanha }
  | { status: "encerrada"; campanha: Campanha | null }
  | { status: "nao_encontrada" }
  | { status: "indisponivel" };

/** Mesmo formato do CHECK da tabela. "convite" é reservado pelo banco. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const BIMESTRES = ["jan–fev", "mar–abr", "mai–jun", "jul–ago", "set–out", "nov–dez"] as const;

/** `2026-B5` → "set–out 2026". Período fora do padrão bimestral não ganha rótulo. */
export function rotuloDoPeriodo(referencia: string | null | undefined): string | null {
  const m = /^(\d{4})-B([1-6])$/.exec(referencia ?? "");
  if (!m) return null;
  return `${BIMESTRES[Number(m[2]) - 1]} ${m[1]}`;
}

/**
 * Situação de uma rodada num instante. Rascunho não existe para o público:
 * um link vazado antes da publicação responde como link inválido.
 */
export function situacaoDaRodada(campanha: Campanha, agora: Date = new Date()): BuscaCampanha {
  if (campanha.status === "draft") return { status: "nao_encontrada" };
  if (campanha.status === "closed") return { status: "encerrada", campanha };
  if (campanha.opens_at && new Date(campanha.opens_at) > agora) return { status: "agendada", campanha };
  if (campanha.closes_at && new Date(campanha.closes_at) <= agora) return { status: "encerrada", campanha };
  return { status: "ok", campanha };
}
