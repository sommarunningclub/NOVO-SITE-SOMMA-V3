"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/**
 * Gramática de movimento da loja. Os mesmos tempos e a mesma curva vivem em
 * loja.css (`--lj-t-*`, `--lj-ease`); mudar aqui pede mudar lá.
 * Regra: movimento curto e com função. Nada de fade em tudo.
 */
export const DUR = { fast: 0.16, base: 0.32, slow: 0.64, reveal: 0.9 } as const;
export const EASE = { out: "expo.out", soft: "power3.out", inOut: "power3.inOut" } as const;

export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 60rem)",
} as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MEDIA.reduced).matches;
}

/** Libera o `visibility` que o CSS segura em `[data-reveal]` até o JS assumir. */
export function markRevealed(el: Element): void {
  el.setAttribute("data-revealed", "");
}

type RevealVars = { delay?: number };

/** Tipo 01: headline sobe por linha de dentro da máscara `.lj-line`. */
export function revealLines(el: HTMLElement, { delay = 0 }: RevealVars = {}) {
  const lines = el.querySelectorAll<HTMLElement>(".lj-line > span");
  markRevealed(el);
  if (!lines.length) return;
  return gsap.from(lines, { yPercent: 110, duration: DUR.reveal, ease: EASE.out, stagger: 0.07, delay });
}

/**
 * Tipo 01 para título de uma string só: o SplitText acha as linhas reais na
 * largura da tela e refaz o corte quando a fonte carrega ou a janela muda.
 * Ele mesmo cuida do aria-label, então leitor de tela lê a frase inteira.
 */
export function revealSplit(el: HTMLElement, { delay = 0 }: RevealVars = {}) {
  markRevealed(el);
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: DUR.reveal, ease: EASE.out, stagger: 0.07, delay }),
  });
}

/** Tipo 02: imagem abre por recorte, de baixo para cima. Sem fade. */
export function revealImage(el: HTMLElement, { delay = 0 }: RevealVars = {}) {
  markRevealed(el);
  const img = el.querySelector("img");
  const tl = gsap.timeline({ delay });
  tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: EASE.inOut, clearProps: "clipPath" });
  if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.3, ease: EASE.soft, clearProps: "transform" }, 0);
  return tl;
}

/** Entrada discreta de bloco: sobe poucos pixels. */
export function revealUp(el: HTMLElement, { delay = 0 }: RevealVars = {}) {
  markRevealed(el);
  return gsap.from(el, { y: 20, autoAlpha: 0, duration: DUR.slow, ease: EASE.soft, delay, clearProps: "transform,opacity,visibility" });
}

/** Tipo 03: parallax editorial. A foto anda poucos pontos dentro da moldura. */
export function parallax(el: HTMLElement, amount = 8) {
  const img = el.querySelector("img");
  if (!img) return;
  return gsap.fromTo(
    img,
    { yPercent: -amount / 2, scale: 1 + amount / 100 },
    { yPercent: amount / 2, scale: 1 + amount / 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
  );
}
