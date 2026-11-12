"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** Curvas da página: entrada rápida que assenta devagar, e uma mais seca para trocas. */
export const EASE = { out: "expo.out", soft: "power3.out", inOut: "power3.inOut" } as const;

export function semMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tela pequena ou aparelho modesto: sem parallax. O celular dita o teto de custo. */
export function aparelhoModesto(): boolean {
  if (typeof window === "undefined") return true;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return window.innerWidth < 768 || (typeof mem === "number" && mem <= 4);
}

/**
 * Escopo GSAP de uma seção.
 *
 * Tudo o que é animado nasce dentro de um `gsap.context()` preso ao elemento, e
 * o retorno do efeito reverte o contexto: timelines, ScrollTriggers e estilos
 * inline somem junto com o componente. Com `prefers-reduced-motion` nada é
 * registrado, e a página aparece inteira pelo CSS, sem depender de animação.
 */
export function useEscopo<T extends HTMLElement = HTMLDivElement>(
  montar: (c: { raiz: T; modesto: boolean }) => void,
  deps: unknown[] = []
): RefObject<T | null> {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || semMovimento()) return;
    const ctx = gsap.context(() => montar({ raiz, modesto: aparelhoModesto() }), raiz);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/**
 * Entradas padrão de uma seção, ligadas por atributo:
 *   data-sobe            bloco que sobe e aparece ao entrar na tela
 *   data-linha           linha de título, dentro de uma máscara (.mt-mascara)
 *   data-parallax="12"   imagem com deslocamento leve atrelado ao scroll
 */
export function entradasDaSecao(raiz: HTMLElement, modesto: boolean) {
  const linhas = gsap.utils.toArray<HTMLElement>("[data-linha]", raiz);
  if (linhas.length) {
    gsap.from(linhas, {
      yPercent: 105,
      duration: 0.9,
      ease: EASE.out,
      stagger: 0.08,
      scrollTrigger: { trigger: linhas[0], start: "top 88%", once: true },
    });
  }
  ScrollTrigger.batch(gsap.utils.toArray<HTMLElement>("[data-sobe]", raiz), {
    start: "top 90%",
    once: true,
    onEnter: (alvos) =>
      gsap.from(alvos, { y: 28, autoAlpha: 0, duration: 0.8, ease: EASE.soft, stagger: 0.07, clearProps: "transform,opacity,visibility" }),
  });
  if (!modesto) {
    gsap.utils.toArray<HTMLElement>("[data-parallax]", raiz).forEach((el) => {
      const forca = Number(el.dataset.parallax) || 10;
      gsap.fromTo(
        el,
        { yPercent: -forca / 2 },
        { yPercent: forca / 2, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.6 } }
      );
    });
  }
}
