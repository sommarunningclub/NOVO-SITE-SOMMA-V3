/**
 * Analytics da pesquisa NPS da Assessoria.
 *
 * O GTM e o GA4 já vivem no layout raiz; aqui só empurramos para o `dataLayer`
 * e chamamos `gtag` quando existe.
 *
 * Regra que não se negocia: NENHUM conteúdo de resposta sai daqui. Nem nome,
 * nem nota, nem texto aberto, nem categoria de NPS. Só o fato de a pessoa ter
 * aberto, começado, passado de seção, enviado ou esbarrado num erro. O Meta
 * Pixel fica de fora de propósito.
 */

import { SURVEY_VERSION, type SectionId } from "./survey";

export type NpsEvento =
  | "nps_survey_opened"
  | "nps_survey_started"
  | "nps_step_completed"
  | "nps_survey_submitted"
  | "nps_survey_error";

export type MotivoErro = "rede" | "servidor" | "validacao" | "limite" | "encerrada" | "versao";

type Params = {
  step_id?: SectionId;
  step_index?: number;
  steps_total?: number;
  resumed?: boolean;
  invited?: boolean;
  error_type?: MotivoErro;
  duration_bucket?: string;
};

type JanelaComAnalytics = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function track(evento: NpsEvento, params: Params = {}): void {
  if (typeof window === "undefined") return;
  const payload = { ...params, survey_version: SURVEY_VERSION };
  try {
    const w = window as JanelaComAnalytics;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: evento, ...payload });
    w.gtag?.("event", evento, payload);
  } catch {
    // analytics nunca pode derrubar a pesquisa
  }
}

/** Faixa de duração: dá para ver a distribuição sem mandar o tempo exato. */
export function faixaDeDuracao(ms: number): string {
  const min = ms / 60000;
  if (min < 2) return "<2min";
  if (min < 5) return "2-5min";
  if (min < 10) return "5-10min";
  if (min < 30) return "10-30min";
  return "30min+";
}

// ─── Origem do acesso ───────────────────────────────────────────────────────
export interface Origem {
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const CHAVE_ORIGEM = "somma:assessoria-nps:origem";

/**
 * Lê `?origem=` e UTMs na primeira visita e guarda na sessão, para o envio
 * saber de onde a pessoa veio mesmo depois de navegar entre as perguntas.
 */
export function capturarOrigem(): Origem {
  if (typeof window === "undefined") return {};
  let salva: Origem = {};
  try {
    salva = JSON.parse(window.sessionStorage.getItem(CHAVE_ORIGEM) || "{}") as Origem;
  } catch {
    salva = {};
  }

  const params = new URLSearchParams(window.location.search);
  const nova: Origem = {};
  const origem = params.get("origem") || params.get("source");
  if (origem) nova.source = origem.slice(0, 80);
  for (const k of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const v = params.get(k);
    if (v) nova[k] = v.slice(0, 160);
  }

  const final = { ...salva, ...nova };
  try {
    window.sessionStorage.setItem(CHAVE_ORIGEM, JSON.stringify(final));
  } catch {
    /* storage bloqueado */
  }
  return final;
}
