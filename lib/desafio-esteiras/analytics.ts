"use client";

import { EVENT_SLUG } from "./event.config";

/**
 * Camada central de analytics do evento.
 *
 * Todo evento de tracking da LP passa por aqui — nada de `gtag`/`dataLayer`
 * solto no meio dos componentes. O GTM e o GA4 já vivem no layout raiz do site;
 * esta camada só empurra para o `dataLayer` (GTM) e chama `gtag` quando existe.
 * Meta Pixel é disparado apenas se a página já tiver `fbq` carregado.
 */
export type EventName =
  | "view_event"
  | "select_unit"
  | "begin_registration"
  | "registration_step"
  | "complete_registration"
  | "view_ticket"
  | "share_ticket"
  | "open_directions";

type Params = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** Mapeia nossos eventos para eventos padrão do Meta Pixel, quando faz sentido. */
const META_MAP: Partial<Record<EventName, string>> = {
  begin_registration: "InitiateCheckout",
  complete_registration: "CompleteRegistration",
  view_event: "ViewContent",
};

export function track(name: EventName, params: Params = {}): void {
  if (typeof window === "undefined") return;

  const payload = {
    ...params,
    evento_slug: EVENT_SLUG,
  };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...payload });
    window.gtag?.("event", name, payload);

    const metaEvent = META_MAP[name];
    if (metaEvent) window.fbq?.("track", metaEvent, payload);
  } catch {
    // analytics nunca pode derrubar a experiência
  }
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  referral?: string;
};

const STORAGE_KEY = "dst_attrib";

/**
 * Captura UTMs/referral na primeira visita e persiste em sessionStorage, para
 * que a inscrição (que acontece em outra rota) ainda saiba de onde a pessoa veio.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  const stored = readAttribution();
  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) fresh[key] = value.slice(0, 160);
  }

  const ref = params.get("ref") || params.get("referral");
  if (ref) fresh.referral = ref.slice(0, 200);
  else if (!stored.referral && document.referrer && !document.referrer.includes(window.location.host)) {
    fresh.referral = document.referrer.slice(0, 200);
  }

  // UTMs novas sobrescrevem as antigas; o que não vier na URL preserva o valor anterior
  const merged = { ...stored, ...fresh };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* modo privado / storage bloqueado */
  }
  return merged;
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}
