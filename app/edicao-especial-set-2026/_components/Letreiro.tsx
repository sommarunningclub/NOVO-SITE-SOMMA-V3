"use client";

import { MARQUEE } from "@/lib/somma-day/event.config";
import { useGsap, movimentoReduzido } from "@/lib/somma-day/motion";

/**
 * Letreiro.
 *
 * Ele anda sozinho, devagar, em loop infinito — e o scroll empurra: rolar a
 * página desloca a faixa um pouco além do seu ritmo. É um movimento pequeno,
 * mas é o que faz a página parecer viva em vez de animada por cima.
 */
export default function Letreiro({ cor, texto }: { cor: string; texto: string }) {
  const ref = useGsap(({ gsap, root }) => {
    if (movimentoReduzido()) return;
    const faixa = root.querySelector<HTMLElement>("[data-faixa]");
    if (!faixa) return;

    // O loop base: metade do conteúdo (são duas cópias) em 26s.
    gsap.to(faixa, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });

    // E o empurrão do scroll, somado por cima do loop.
    gsap.fromTo(
      faixa,
      { x: 0 },
      {
        x: -220,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  }, []);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden border-y-[3px] border-[var(--sd-tinta)] py-3"
      style={{ background: cor, color: texto }}
    >
      <div data-faixa className="flex w-max">
        {[0, 1].map((bloco) => (
          <div key={bloco} className="flex" aria-hidden={bloco === 1}>
            {MARQUEE.map((f) => (
              <span key={f} className="sd-display px-6 text-[clamp(1.5rem,3.6vw,2.4rem)] whitespace-nowrap">
                {f}
                <span className="px-6 opacity-50">✱</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
