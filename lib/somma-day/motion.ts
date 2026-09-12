"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Registro único do GSAP para a rota do SOMMA DAY.
 *
 * Registrar plugin é idempotente, mas centralizar garante que nenhum
 * componente esqueça o registro e que os defaults de easing venham de um lugar
 * só — quem chama gsap.to() sem `ease` herda o sotaque certo.
 */
let registrado = false;

export function garantirGsap() {
  if (registrado || typeof window === "undefined") return { gsap, ScrollTrigger };
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });

  // No iOS a barra de endereço recolhe durante o scroll e dispara resize a
  // cada rolagem — sem isto, o ScrollTrigger entra em refresh contínuo e a
  // página engasga. Ignorar mudança só de altura em tela de toque resolve sem
  // perder a resposta a rotação (que muda a largura).
  ScrollTrigger.config({ ignoreMobileResize: true });

  registrado = true;
  return { gsap, ScrollTrigger };
}

/** Quem pediu menos movimento recebe a página inteira, parada. */
export function movimentoReduzido(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Rotina<T extends Element> = (ctx: { gsap: typeof gsap; root: T }) => void | (() => void);

/**
 * Roda uma rotina GSAP dentro de `gsap.context`, com escopo no elemento e
 * cleanup automático.
 *
 * Sem o contexto, cada remount do Strict Mode deixa tweens e ScrollTriggers
 * órfãos apontando para nós que já saíram do DOM. `ctx.revert()` também desfaz
 * as propriedades inline que o GSAP escreveu, devolvendo o elemento ao CSS.
 *
 * useLayoutEffect (não useEffect) para o estado inicial ser aplicado antes do
 * primeiro paint — senão o conteúdo pisca posicionado e depois salta.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  rotina: Rotina<T>,
  deps: readonly unknown[] = []
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    garantirGsap();
    const ctx = gsap.context(() => rotina({ gsap, root }), root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export { gsap, ScrollTrigger };
