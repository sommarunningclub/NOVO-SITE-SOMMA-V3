"use client";

/**
 * Medição da landing page.
 *
 * Dois destinos: o GA4 do site (via gtag, já carregado no layout raiz) e o
 * contador próprio do evento (visitas e inícios de formulário por origem, sem
 * dado pessoal), que alimenta a conversão do painel.
 *
 * Regra fixa: nenhum evento carrega CPF, e-mail, telefone ou nome. Os
 * parâmetros aceitos estão tipados abaixo, e a função descarta o resto.
 */

export type EventoGA =
  | "evp_view_page"
  | "evp_cta_click"
  | "evp_form_start"
  | "evp_select_distance"
  | "evp_form_step"
  | "evp_form_error"
  | "evp_sign_up"
  | "evp_waitlist_join"
  | "evp_add_to_calendar";

type Parametros = Partial<{
  local: string;
  distancia: string;
  etapa: number;
  campo: string;
  origem: string;
  destino: string;
}>;

const PERMITIDOS = new Set(["local", "distancia", "etapa", "campo", "origem", "destino"]);
const enviados = new Set<string>();

/**
 * `unico` evita duplicidade: o mesmo evento com a mesma chave sai uma vez por
 * carregamento de página (React em modo estrito roda efeitos duas vezes).
 */
export function medir(evento: EventoGA, params: Parametros = {}, unico?: string) {
  if (typeof window === "undefined") return;
  if (unico) {
    const chave = `${evento}:${unico}`;
    if (enviados.has(chave)) return;
    enviados.add(chave);
  }
  const limpo: Record<string, string | number> = { evento_slug: "maratonamonumental2026" };
  for (const [k, v] of Object.entries(params)) {
    if (PERMITIDOS.has(k) && (typeof v === "string" || typeof v === "number")) limpo[k] = v;
  }
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };
  try {
    if (typeof w.gtag === "function") w.gtag("event", evento, limpo);
    else if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: evento, ...limpo });
  } catch {
    /* medição nunca derruba a página */
  }
}

export type Origem = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term" | "referrer", string>>;

const CHAVE = "evp_origem";
const UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * Origem da sessão: UTMs da URL de entrada e o site de onde a pessoa veio. Fica
 * no sessionStorage para sobreviver à navegação até o formulário.
 */
export function lerOrigem(): Origem {
  if (typeof window === "undefined") return {};
  try {
    const guardada = window.sessionStorage.getItem(CHAVE);
    if (guardada) return JSON.parse(guardada) as Origem;
  } catch {
    /* modo privado: segue sem guardar */
  }
  const origem: Origem = {};
  const q = new URLSearchParams(window.location.search);
  for (const k of UTMS) {
    const v = q.get(k)?.trim().slice(0, 160);
    if (v) origem[k] = v;
  }
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) origem.referrer = host.slice(0, 120);
    }
  } catch {
    /* referrer malformado */
  }
  try {
    window.sessionStorage.setItem(CHAVE, JSON.stringify(origem));
  } catch {
    /* ok */
  }
  return origem;
}

/** Visita da sessão, contada uma vez. */
export function contarVisita() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem("evp_visita")) return;
    window.sessionStorage.setItem("evp_visita", "1");
  } catch {
    /* sem sessionStorage a visita conta a cada carregamento */
  }
  const corpo = JSON.stringify({ origem: lerOrigem() });
  try {
    if (navigator.sendBeacon?.("/api/evp/visita", new Blob([corpo], { type: "application/json" }))) return;
  } catch {
    /* cai no fetch */
  }
  fetch("/api/evp/visita", { method: "POST", body: corpo, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}
