"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Camada de rolagem interativa (GSAP ScrollTrigger). Convive com o Framer
 * Motion (que cuida das UIs) e cuida do movimento ligado ao scroll:
 *  - parallax scrub nas imagens marcadas com [data-parallax]
 *  - parallax leve do conteúdo do hero ([data-hero-content])
 * Respeita prefers-reduced-motion.
 */
export default function GsapEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Parallax das imagens: sobem/descem devagar conforme atravessam a tela.
      // O scale entra no próprio tween (o GSAP controla o transform) para dar
      // folga e nunca revelar as bordas durante o movimento.
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((img) => {
        const depth = Number(img.dataset.parallax || "6");
        gsap.fromTo(
          img,
          { yPercent: -depth, scale: 1.14 },
          {
            yPercent: depth,
            scale: 1.14,
            ease: "none",
            scrollTrigger: {
              trigger: img.parentElement || img,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      // Conteúdo do hero desliza e some suavemente ao rolar para fora.
      const heroContent = document.querySelector<HTMLElement>("[data-hero-content]");
      if (heroContent) {
        gsap.to(heroContent, {
          yPercent: 16,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: { trigger: "#capa", start: "top top", end: "bottom top", scrub: true },
        });
      }
    });

    // Recalcula posições depois que imagens/layout assentam.
    const refresh = () => ScrollTrigger.refresh();
    const t = setTimeout(refresh, 300);
    window.addEventListener("load", refresh);

    return () => {
      clearTimeout(t);
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return null;
}
