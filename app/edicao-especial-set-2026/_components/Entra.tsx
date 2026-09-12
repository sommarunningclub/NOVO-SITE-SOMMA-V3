"use client";

import { useGsap, movimentoReduzido } from "@/lib/somma-day/motion";

/**
 * Entrada de conteúdo no scroll.
 *
 * O filho sobe e aparece quando a seção chega à tela. `stagger` anima os filhos
 * diretos em cascata — é o que dá ritmo a uma grade de cards sem precisar de um
 * componente por item.
 *
 * O GUARDA no fim não é zelo excessivo: `gsap.from` com autoAlpha esconde o
 * elemento NA HORA e só o devolve quando o ScrollTrigger dispara. Se o trigger
 * não disparar — start calculado antes de a seção ganhar altura, refresh
 * perdido num resize, uma imagem que só carregou depois — o conteúdo fica
 * invisível para sempre. Por isso: se o bloco está na tela e a animação não
 * começou em 1,2s, ela é levada direto ao estado final. Em operação normal ele
 * nunca dispara; no dia em que disparar, a página perde uma animação em vez de
 * perder uma seção inteira.
 */
export default function Entra({
  children,
  stagger = false,
  y = 34,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  stagger?: boolean;
  y?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useGsap(({ gsap, root }) => {
    if (movimentoReduzido()) return;
    const alvos = stagger ? Array.from(root.children) : [root];
    if (alvos.length === 0) return;

    const tween = gsap.from(alvos, {
      y,
      autoAlpha: 0,
      duration: 0.9,
      delay,
      stagger: stagger ? 0.09 : 0,
      scrollTrigger: { trigger: root, start: "top 86%", once: true },
    });

    let timer = 0;
    const guarda = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            if (tween.progress() === 0) tween.progress(1);
            guarda.disconnect();
          }, 1200);
        }
      },
      { threshold: 0.05 }
    );
    guarda.observe(root);

    // O gsap.context não conhece o observer: o cleanup é nosso.
    return () => {
      window.clearTimeout(timer);
      guarda.disconnect();
    };
  }, [stagger, y, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
