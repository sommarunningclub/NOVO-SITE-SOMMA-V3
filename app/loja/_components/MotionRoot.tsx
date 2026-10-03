"use client";

import { usePathname } from "next/navigation";
import {
  MEDIA,
  ScrollTrigger,
  gsap,
  markRevealed,
  parallax,
  revealImage,
  revealLines,
  revealSplit,
  revealUp,
  useGSAP,
} from "../_motion";

/**
 * Único ponto que liga o movimento da loja.
 *
 * As seções são Server Components e só DECLARAM o movimento no HTML:
 *   data-reveal="lines" | "split" | "image" | "up"   (+ data-delay="0.2")
 *   data-parallax="8"
 * Este componente lê os atributos e registra as animações. Assim nenhuma seção
 * vira Client Component por causa de animação, e sem JS (ou com movimento
 * reduzido) o conteúdo simplesmente aparece.
 */
const REVEALS = {
  lines: revealLines,
  split: revealSplit,
  image: revealImage,
  up: revealUp,
} as const;

export function MotionRoot() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MEDIA.reduced, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(markRevealed);
      });

      mm.add(MEDIA.motion, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          const kind = el.dataset.reveal as keyof typeof REVEALS;
          const run = REVEALS[kind] ?? revealUp;
          const delay = Number(el.dataset.delay ?? 0);
          // primeira dobra: entra na abertura, mesmo que esteja colada no pé da tela
          if (el.closest("[data-hero]")) {
            run(el, { delay });
            return;
          }
          // `once`: entra uma vez e o trigger morre; nada fica escutando o scroll à toa
          ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => run(el, { delay }) });
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          parallax(el, Number(el.dataset.parallax) || 8);
        });
      });

      // Fontes e imagens mudam a altura da página depois do primeiro layout:
      // um refresh só, quando as fontes assentam (nada de refresh contínuo).
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
