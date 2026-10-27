"use client";

import { useLayoutEffect } from "react";
import { garantirGsap, movimentoReduzido } from "@/lib/dexcomplica-love-run/motion";

/**
 * Entradas por scroll da página inteira, em um lugar só.
 *
 * - `[data-revelar]`: sobe e aparece quando entra na tela (em lote, por seção).
 * - `[data-parallax="n"]`: desloca n% enquanto a seção passa.
 * - `[data-parallax-img]`: a foto se move dentro da moldura.
 * - `[data-flutua]`: flutua devagar.
 *
 * O estado inicial só é aplicado aqui, no cliente. Sem JS, com falha do GSAP
 * ou com reduced-motion, tudo fica visível e parado.
 */
export default function Revelar() {
  useLayoutEffect(() => {
    if (movimentoReduzido()) return;
    const { gsap, ScrollTrigger } = garantirGsap();
    const ctx = gsap.context(() => {
      // Só esconde o que está abaixo da dobra: quem já está na tela ao carregar
      // (âncora, recarga no meio da página) não pisca.
      const abaixo = gsap.utils
        .toArray<HTMLElement>("main [data-revelar]")
        .filter((el) => el.getBoundingClientRect().top > window.innerHeight);
      gsap.set(abaixo, { y: 34, opacity: 0 });
      ScrollTrigger.batch(abaixo, {
        start: "top 90%",
        once: true,
        onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, stagger: 0.07, duration: 0.85, overwrite: true }),
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const n = Number(el.dataset.parallax) || 0;
        gsap.fromTo(el, { yPercent: -n }, {
          yPercent: n,
          ease: "none",
          scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax-img]").forEach((el) => {
        gsap.fromTo(el, { yPercent: -6, scale: 1.12 }, {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-flutua]").forEach((el, i) => {
        gsap.to(el, { y: -14, rotate: 6, duration: 2.6 + i * 0.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      });

      gsap.utils.toArray<SVGPathElement>(".lr-insc__pulso [data-pulso]").forEach((p) => {
        const total = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: total, strokeDashoffset: total }, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: p.closest("section") ?? p, start: "top 85%", end: "top 25%", scrub: true },
        });
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}
