"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/**
 * Curvas do evento. `out` para entradas (sai rápido, assenta devagar),
 * `drive` para movimento contínuo de esteira, scrub usa "none".
 */
export const EASE = {
  out: "expo.out",
  soft: "power3.out",
  drive: "power2.inOut",
} as const;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Aparelho fraco ou tela pequena: cortamos parallax, pin pesado e blur. */
export function isLowPower(): boolean {
  if (typeof window === "undefined") return true;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return window.innerWidth < 768 || (typeof mem === "number" && mem <= 4);
}

/**
 * Escopo GSAP por seção.
 *
 * Todo motion vive dentro de um `gsap.context()` amarrado ao elemento; o
 * cleanup mata timelines e ScrollTriggers da seção sem vazar entre navegações.
 * Com `prefers-reduced-motion` nada é registrado — o CSS deixa o conteúdo
 * visível por padrão.
 */
export function useScope<T extends HTMLElement = HTMLDivElement>(
  build: (ctx: { root: T; mm: gsap.MatchMedia; reduced: boolean }) => void
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = prefersReducedMotion();
    if (reduced) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      build({ root, mm, reduced });
    }, root);

    return () => ctx.revert();
    // as seções são estáticas: o build roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/**
 * Sobe o conteúdo de dentro das janelas `.lgo-mask`.
 *
 * `fromTo` de propósito: o GSAP é dono dos dois extremos, então a revelação
 * não depende da ordem em que atributos chegam ao DOM.
 */
export function maskReveal(
  target: gsap.DOMTarget,
  vars: { trigger?: Element; delay?: number; stagger?: number; start?: string; duration?: number } = {}
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(nodes, { yPercent: 105 }, {
    yPercent: 0,
    duration: vars.duration ?? 1.1,
    ease: EASE.out,
    delay: vars.delay ?? 0,
    stagger: vars.stagger ?? 0.07,
    scrollTrigger: vars.trigger
      ? { trigger: vars.trigger, start: vars.start ?? "top 80%", once: true }
      : undefined,
  });
}

/** Entrada padrão de bloco. */
export function riseIn(
  target: gsap.DOMTarget,
  vars: { trigger?: Element; delay?: number; stagger?: number; y?: number; start?: string } = {}
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(
    nodes,
    { y: vars.y ?? 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: EASE.soft,
      delay: vars.delay ?? 0,
      stagger: vars.stagger ?? 0.08,
      scrollTrigger: vars.trigger
        ? { trigger: vars.trigger, start: vars.start ?? "top 78%", once: true }
        : undefined,
    }
  );
}

/** Entrada lateral. */
export function slideIn(
  target: gsap.DOMTarget,
  from: "left" | "right",
  vars: { trigger?: Element; stagger?: number; distance?: number } = {}
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  const d = vars.distance ?? 64;
  return gsap.fromTo(
    nodes,
    { x: from === "left" ? -d : d, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 1.05,
      ease: EASE.out,
      stagger: vars.stagger ?? 0.1,
      scrollTrigger: vars.trigger ? { trigger: vars.trigger, start: "top 80%", once: true } : undefined,
    }
  );
}

/** Revelação de imagem por máscara vertical (clip-path). */
export function imageMask(target: gsap.DOMTarget, trigger?: Element) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(
    nodes,
    { clipPath: "inset(100% 0% 0% 0%)", scale: 1.14 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      scale: 1,
      duration: 1.5,
      ease: "power4.inOut",
      scrollTrigger: trigger ? { trigger, start: "top 82%", once: true } : undefined,
    }
  );
}

/** Contador que sobe uma vez quando entra em cena. */
export function countUp(
  el: HTMLElement,
  to: number,
  opts: { decimals?: number; trigger?: Element; suffix?: string; duration?: number } = {}
) {
  const obj = { v: 0 };
  const d = opts.decimals ?? 0;
  const fmt = (n: number) =>
    `${n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })}${opts.suffix ?? ""}`;

  el.textContent = fmt(0);
  return gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 1.8,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = fmt(obj.v);
    },
    scrollTrigger: { trigger: opts.trigger ?? el, start: "top 85%", once: true },
  });
}

/** Parallax por scroll. `depth` positivo desce, negativo sobe. */
export function parallax(target: gsap.DOMTarget, depth: number, trigger: Element) {
  return gsap.to(target, {
    yPercent: depth,
    ease: "none",
    scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: 0.6 },
  });
}

/** Desenha um traço SVG conforme o scroll. */
export function drawLine(
  path: SVGPathElement | SVGLineElement,
  trigger: Element,
  vars: { start?: string; end?: string; scrub?: boolean } = {}
) {
  const length =
    "getTotalLength" in path ? (path as SVGPathElement).getTotalLength() : 1000;
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  return gsap.to(path, {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: {
      trigger,
      start: vars.start ?? "top 78%",
      end: vars.end ?? "bottom 60%",
      scrub: vars.scrub === false ? false : 0.5,
    },
  });
}

/**
 * Seção fixada com timeline em scrub — o coração das sequências
 * "20/30/42 → 24 HORAS" e da linha das 24 horas.
 *
 * Fixa `root` enquanto o usuário rola `distance` pixels e devolve uma
 * timeline cujo progresso acompanha o scroll. Quem chama popula a timeline.
 * Em aparelho fraco NÃO use pin: monte um fallback com reveals comuns.
 */
export function pinnedTimeline(
  root: HTMLElement,
  vars: { distance?: number; scrub?: number; start?: string } = {}
) {
  return gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: vars.start ?? "top top",
      end: `+=${vars.distance ?? 2200}`,
      pin: true,
      scrub: vars.scrub ?? 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

/**
 * Relógio que conta para baixo a partir de 24:00:00 em loop visual lento.
 * Puro texto: quem chama passa o elemento e recebe o cleanup.
 * É atmosfera, não cronômetro real — a data da prova ainda nem existe.
 */
export function clockDrift(el: HTMLElement, opts: { fromSeconds?: number } = {}): () => void {
  let total = opts.fromSeconds ?? 24 * 3600;
  const render = () => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    el.textContent = [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  };
  render();
  if (prefersReducedMotion()) return () => {};
  const id = window.setInterval(() => {
    total = total <= 0 ? 24 * 3600 : total - 1;
    render();
  }, 1000);
  return () => window.clearInterval(id);
}
