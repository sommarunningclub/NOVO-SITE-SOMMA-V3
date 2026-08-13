"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** Curvas do deck. Entradas saem rápido e assentam devagar; scrub é linear. */
export const EASE = {
  out: "expo.out",
  soft: "power3.out",
  inOut: "power2.inOut",
} as const;

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Dedo em vez de roda: muda quem controla o tempo da animação. */
export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/**
 * Valor de `scrub` por tipo de entrada.
 *
 * No desktop um scrub numérico suaviza os saltos da roda do mouse, que chega em
 * degraus grandes. No toque não existe degrau: o dedo já é contínuo e o mesmo
 * atraso vira descolamento, com a animação chegando depois do gesto. Ali o
 * scrub precisa ser 1:1 com a posição real da rolagem.
 */
export const scrub = (desktop: number): number | true => (isTouch() ? true : desktop);

/**
 * Escopo GSAP por seção.
 *
 * Todo o motion vive dentro de um gsap.context() amarrado ao elemento, então
 * o cleanup mata timelines e ScrollTriggers da seção sem vazar entre rotas.
 * Com `prefers-reduced-motion` nada é registrado e o conteúdo já nasce visível.
 */
export function useScope<T extends HTMLElement = HTMLDivElement>(
  build: (ctx: { root: T; mm: gsap.MatchMedia }) => void,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduced()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      build({ root, mm });
    }, root);

    return () => ctx.revert();
    // as seções são estáticas: o build roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Sobe as palavras marcadas com `.rwIn` dentro do alvo, em stagger. */
export function revealWords(
  target: gsap.DOMTarget,
  vars: { trigger?: gsap.DOMTarget; delay?: number; stagger?: number; start?: string } = {},
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.to(nodes, {
    yPercent: 0,
    duration: 1.05,
    ease: EASE.out,
    delay: vars.delay ?? 0,
    stagger: vars.stagger ?? 0.055,
    scrollTrigger: vars.trigger
      ? { trigger: vars.trigger, start: vars.start ?? "top 78%", once: true }
      : undefined,
  });
}

/** Entrada padrão de bloco: sobe 28px e revela. */
export function riseIn(
  target: gsap.DOMTarget,
  vars: { trigger?: gsap.DOMTarget; delay?: number; stagger?: number; y?: number; start?: string } = {},
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(
    nodes,
    { y: vars.y ?? 28, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: EASE.soft,
      delay: vars.delay ?? 0,
      stagger: vars.stagger ?? 0.08,
      scrollTrigger: vars.trigger
        ? { trigger: vars.trigger, start: vars.start ?? "top 76%", once: true }
        : undefined,
    },
  );
}

/** Contador com scrub: o número acompanha a leitura em vez de disparar sozinho. */
export function countUp(
  el: HTMLElement,
  to: number,
  opts: { decimals?: number; trigger?: Element; suffix?: string; prefix?: string } = {},
) {
  const obj = { v: 0 };
  const d = opts.decimals ?? 0;
  const fmt = (n: number) =>
    `${opts.prefix ?? ""}${n.toLocaleString("pt-BR", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })}${opts.suffix ?? ""}`;

  el.textContent = fmt(0);
  return gsap.to(obj, {
    v: to,
    duration: 1.6,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = fmt(obj.v);
    },
    scrollTrigger: { trigger: opts.trigger ?? el, start: "top 82%", once: true },
  });
}

/** Parallax leve por scroll. `depth` positivo desce, negativo sobe. */
export function parallax(target: gsap.DOMTarget, depth: number, trigger: Element) {
  return gsap.to(target, {
    yPercent: depth,
    ease: "none",
    scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true },
  });
}
