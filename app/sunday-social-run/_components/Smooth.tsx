"use client";

import { useEffect } from "react";
import { ScrollTrigger, gsap, prefersReducedMotion } from "../_motion";

/**
 * Rolagem suave — desktop apenas.
 *
 * No touch, o scroll nativo do iOS e do Android já é melhor do que qualquer
 * emulação: tem inércia certa, respeita o gesto de voltar e não briga com a
 * barra do navegador. O Lenis entra só onde há roda de mouse, e mesmo ali é
 * sincronizado com o ScrollTrigger para não dessincronizar as cenas.
 */
export function Smooth() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch) return;

    let ativo = true;
    let destruir: (() => void) | null = null;

    // Import dinâmico: no mobile o pacote nunca é baixado.
    import("lenis").then(({ default: Lenis }) => {
      if (!ativo) return;

      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      const raf = (time: number) => lenis.raf(time * 1000);

      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      destruir = () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    });

    return () => {
      ativo = false;
      destruir?.();
    };
  }, []);

  return null;
}
