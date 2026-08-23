"use client";

import { EVENT_SLUG } from "./event.config";

/**
 * Camada de analytics da experiência.
 *
 * Nenhuma plataforma nova é instalada: o GTM e o GA4 já vivem no layout raiz do
 * site. Aqui só empurramos para o `dataLayer` e chamamos `gtag`/`fbq` quando
 * existirem. Se nada estiver carregado, as chamadas viram no-op silencioso —
 * medição jamais derruba a página.
 */
export type EventName =
  | "hero_cta_click"
  | "ticket_cta_click"
  | "timeline_view"
  | "pace_match_view"
  | "hype_section_view"
  | "after_pace_view"
  | "ticket_section_view"
  | "outbound_hype_click"
  | "view_experience";

type Params = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** Mapeia para eventos padrão do Meta Pixel quando o disparo tem equivalente. */
const META_MAP: Partial<Record<EventName, string>> = {
  view_experience: "ViewContent",
  outbound_hype_click: "InitiateCheckout",
};

export function track(name: EventName, params: Params = {}): void {
  if (typeof window === "undefined") return;

  const payload = { ...params, evento_slug: EVENT_SLUG };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...payload });
    window.gtag?.("event", name, payload);

    const metaEvent = META_MAP[name];
    if (metaEvent) window.fbq?.("track", metaEvent, payload);
  } catch {
    // analytics é opcional por definição
  }
}

/**
 * Dispara um evento de visualização de seção uma única vez, quando ela entra na
 * tela. Devolve o cleanup para o `useEffect` do componente.
 */
export function observeSection(
  el: Element | null,
  name: EventName,
  params: Params = {}
): () => void {
  if (!el || typeof IntersectionObserver === "undefined") return () => {};

  let disparado = false;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || disparado) continue;
        disparado = true;
        track(name, params);
        io.disconnect();
      }
    },
    { threshold: 0.35 }
  );

  io.observe(el);
  return () => io.disconnect();
}
