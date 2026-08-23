"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, gsap } from "../_motion";

/**
 * As cinco luzes da manhã.
 * dawn  → alvorada creme, antes da largada
 * run   → o asfalto esquentando, laranja SOMMA sobre oliva profundo
 * night → o digital: preto, vidro e o dourado do universo Hype
 * noon  → o céu do brunch, Santa Monica em plena luz
 * flare → laranja pleno: a conversão
 */
export type Luz = "dawn" | "run" | "night" | "noon" | "flare";

export const LUZES: readonly Luz[] = ["dawn", "run", "night", "noon", "flare"];

/** Cor da barra do navegador em cada luz — o app muda de pele junto com a página. */
const THEME_COLOR: Record<Luz, string> = {
  dawn: "#fdfaf4",
  run: "#180d07",
  night: "#06060a",
  noon: "#ceeefe",
  flare: "#ff2c04",
};

export interface AncoraDeLuz {
  /** id da `<section>` que comanda a troca. */
  id: string;
  luz: Luz;
}

/**
 * O palco de luz.
 *
 * A página inteira é transparente: o fundo vive aqui, em cinco camadas fixas
 * empilhadas. Cada seção acende a sua e apaga as outras num cross-fade de
 * opacidade — composição pura de GPU, sem repintar layout, sem seção com
 * "background chapado". É o que faz a cor contar a jornada em vez de dividir a
 * página em faixas.
 */
export function LightStage({ mapa }: { mapa: readonly AncoraDeLuz[] }) {
  const palco = useRef<HTMLDivElement>(null);
  const atual = useRef<Luz>("dawn");

  useEffect(() => {
    const root = palco.current;
    if (!root) return;

    const camadas = new Map<Luz, HTMLElement>();
    for (const luz of LUZES) {
      const el = root.querySelector<HTMLElement>(`[data-luz="${luz}"]`);
      if (el) camadas.set(luz, el);
    }

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const corOriginal = meta?.content ?? null;

    const acender = (luz: Luz) => {
      if (atual.current === luz) return;
      atual.current = luz;

      // A luz vigente vira atributo no <html>: header, CTA fixo e qualquer
      // elemento flutuante ajustam o próprio tom por CSS, sem duplicar a
      // lógica de scroll.
      document.documentElement.dataset.risLuz = luz;

      for (const [chave, el] of camadas) {
        gsap.to(el, {
          opacity: chave === luz ? 1 : 0,
          duration: 0.9,
          ease: "power2.inOut",
          overwrite: true,
        });
      }
      if (meta) meta.content = THEME_COLOR[luz];
    };

    const ctx = gsap.context(() => {
      for (const ancora of mapa) {
        const secao = document.getElementById(ancora.id);
        if (!secao) continue;

        ScrollTrigger.create({
          trigger: secao,
          // A luz vira quando a seção domina a metade da tela, subindo ou descendo.
          start: "top 58%",
          end: "bottom 42%",
          onToggle: (self) => {
            if (self.isActive) acender(ancora.luz);
          },
        });
      }
    }, root);

    return () => {
      ctx.revert();
      delete document.documentElement.dataset.risLuz;
      if (meta && corOriginal) meta.content = corOriginal;
    };
  }, [mapa]);

  return (
    <div ref={palco} className="ris-stage" aria-hidden>
      {LUZES.map((luz) => (
        <div key={luz} className="ris-layer" data-luz={luz} />
      ))}
    </div>
  );
}
