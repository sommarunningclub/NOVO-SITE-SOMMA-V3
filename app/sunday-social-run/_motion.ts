"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/**
 * Curvas da experiência.
 * `out` para entradas (chega rápido, assenta devagar), `soft` para blocos,
 * `snap` para o momento em que duas coisas se encontram.
 */
export const EASE = {
  out: "expo.out",
  soft: "power3.out",
  snap: "back.out(1.7)",
  inOut: "power4.inOut",
} as const;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Aparelho modesto ou tela pequena: cortamos parallax, blur pesado e pin longo.
 * O mobile é a maior parte do tráfego — é ele que dita o teto de custo.
 */
export function isLowPower(): boolean {
  if (typeof window === "undefined") return true;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return window.innerWidth < 768 || (typeof mem === "number" && mem <= 4);
}

/**
 * Escopo GSAP por seção.
 *
 * Todo motion vive dentro de um `gsap.context()` amarrado ao elemento: o
 * cleanup mata timelines e ScrollTriggers da seção sem vazar entre navegações.
 * Com `prefers-reduced-motion` nada é registrado — o CSS já entrega tudo
 * visível, então a página funciona inteira sem uma única animação.
 */
export function useScope<T extends HTMLElement = HTMLDivElement>(
  build: (ctx: { root: T; mm: gsap.MatchMedia; low: boolean }) => void
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      build({ root, mm, low: isLowPower() });
    }, root);

    return () => ctx.revert();
    // as seções são estáticas: o build roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEXT SPLITTING PRÓPRIO
   O SplitText do GSAP é plugin pago; aqui a divisão é feita à mão e só onde
   rende. Palavras viram `span` com máscara — o texto original continua no DOM
   para leitores de tela via `aria-label` do elemento pai.
   ═══════════════════════════════════════════════════════════════════════════ */

export function splitWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.split === "done") {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-word] > span"));
  }

  const texto = el.textContent ?? "";
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];

  el.setAttribute("aria-label", texto.trim());
  el.textContent = "";

  const alvos: HTMLElement[] = [];
  for (const palavra of palavras) {
    const janela = document.createElement("span");
    janela.dataset.word = "";
    janela.setAttribute("aria-hidden", "true");
    janela.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:0.06em;";

    const interno = document.createElement("span");
    interno.style.cssText = "display:inline-block;will-change:transform;";
    interno.textContent = palavra;

    janela.appendChild(interno);
    el.appendChild(janela);
    el.appendChild(document.createTextNode(" "));
    alvos.push(interno);
  }

  el.dataset.split = "done";
  return alvos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVAS DE ENTRADA
   `fromTo` sempre: o GSAP é dono dos dois extremos, então a animação não
   depende de o CSS ter aplicado o estado escondido antes.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Sobe o conteúdo de dentro das janelas `.ris-mask`. */
export function maskReveal(
  target: gsap.DOMTarget,
  vars: { trigger?: Element; delay?: number; stagger?: number; start?: string; duration?: number } = {}
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(
    nodes,
    { yPercent: 108 },
    {
      yPercent: 0,
      duration: vars.duration ?? 1.15,
      ease: EASE.out,
      delay: vars.delay ?? 0,
      stagger: vars.stagger ?? 0.08,
      scrollTrigger: vars.trigger
        ? { trigger: vars.trigger, start: vars.start ?? "top 82%", once: true }
        : undefined,
    }
  );
}

/** Entrada padrão de bloco. */
export function riseIn(
  target: gsap.DOMTarget,
  vars: { trigger?: Element; delay?: number; stagger?: number; y?: number; start?: string } = {}
) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(
    nodes,
    { y: vars.y ?? 28, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: EASE.soft,
      delay: vars.delay ?? 0,
      stagger: vars.stagger ?? 0.08,
      scrollTrigger: vars.trigger
        ? { trigger: vars.trigger, start: vars.start ?? "top 80%", once: true }
        : undefined,
    }
  );
}

/** Revelação de imagem por máscara + leve zoom-out. */
export function imageMask(target: gsap.DOMTarget, trigger?: Element, start = "top 84%") {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.fromTo(
    nodes,
    { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      scale: 1,
      duration: 1.5,
      ease: EASE.inOut,
      scrollTrigger: trigger ? { trigger, start, once: true } : undefined,
    }
  );
}

/** Parallax por scroll. `depth` positivo desce, negativo sobe. */
export function parallax(target: gsap.DOMTarget, depth: number, trigger: Element) {
  const nodes = gsap.utils.toArray<HTMLElement>(target);
  if (!nodes.length) return;
  return gsap.to(nodes, {
    yPercent: depth,
    ease: "none",
    scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: 0.6 },
  });
}

/** Contador que acompanha a leitura. */
export function countUp(
  el: HTMLElement,
  to: number,
  opts: { trigger?: Element; duration?: number; suffix?: string; prefix?: string } = {}
) {
  const obj = { v: 0 };
  const fmt = (n: number) =>
    `${opts.prefix ?? ""}${Math.round(n).toLocaleString("pt-BR")}${opts.suffix ?? ""}`;

  el.textContent = fmt(0);
  return gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 2,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = fmt(obj.v);
    },
    scrollTrigger: { trigger: opts.trigger ?? el, start: "top 85%", once: true },
  });
}

/** Desenha um traço SVG conforme o scroll. */
export function drawLine(
  path: SVGPathElement,
  trigger: Element,
  vars: { start?: string; end?: string; scrub?: number | boolean } = {}
) {
  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  return gsap.to(path, {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: {
      trigger,
      start: vars.start ?? "top 80%",
      end: vars.end ?? "bottom 62%",
      scrub: vars.scrub ?? 0.5,
    },
  });
}

/**
 * Embaralha o texto até assentar na palavra final.
 * Usado com parcimônia, só nos elementos da Hype — é o ruído do digital.
 */
export function scramble(el: HTMLElement, alvo: string, opts: { duration?: number; delay?: number } = {}) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#$%";
  const estado = { p: 0 };
  const final = alvo;

  return gsap.to(estado, {
    p: 1,
    duration: opts.duration ?? 1.1,
    delay: opts.delay ?? 0,
    ease: "power2.inOut",
    onUpdate: () => {
      const revelados = Math.floor(final.length * estado.p);
      let saida = final.slice(0, revelados);
      for (let i = revelados; i < final.length; i++) {
        const c = final[i];
        // pontuação e espaço não embaralham: são a âncora que mantém a palavra
        // reconhecível enquanto o resto ainda é ruído
        saida += /[A-Za-z0-9]/.test(c) ? chars[(Math.random() * chars.length) | 0] : c;
      }
      el.textContent = saida;
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   A LINHA
   Um único traço atravessa a página mudando de significado: rota de corrida,
   gráfico de pace, conexão entre dois perfis, waveform do DJ.

   Todos os estados são gerados com a MESMA quantidade de pontos — é isso que
   permite interpolar um no outro sem plugin de morph: fazemos lerp nas
   coordenadas e reconstruímos o `d`. Curva de Catmull-Rom convertida em Bézier
   para o traço sair suave em qualquer estado.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Ponto = [number, number];
export type LineVariant = "route" | "pace" | "connect" | "wave" | "flat";

/** Quantidade de pontos de todos os estados. Ímpar para haver centro exato. */
export const LINE_POINTS = 41;

const VIEW = { w: 1000, h: 200 };

export function lineShape(variant: LineVariant, n = LINE_POINTS): Ponto[] {
  const pts: Ponto[] = [];
  const meio = VIEW.h / 2;

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = t * VIEW.w;
    let y = meio;

    switch (variant) {
      // Rota: curvas largas e assimétricas, como um traçado de rua.
      case "route":
        y = meio - Math.sin(t * Math.PI * 1.6) * 52 - Math.sin(t * Math.PI * 4.2) * 12;
        break;
      // Pace: degraus de esforço, com o pico onde a corrida aperta.
      case "pace": {
        const dente = Math.abs(((t * 7) % 2) - 1);
        y = meio - (dente * 58 - 28) - Math.sin(t * Math.PI) * 22;
        break;
      }
      // Conexão: duas linhas que vêm de pontas opostas e se encontram no centro.
      case "connect": {
        const d = Math.abs(t - 0.5) * 2; // 1 nas pontas, 0 no meio
        y = meio + (t < 0.5 ? -1 : 1) * d * d * 62;
        break;
      }
      // Waveform: o som do set. Amplitude modulada, como um envelope de áudio.
      case "wave": {
        const env = Math.sin(t * Math.PI);
        y = meio - Math.sin(t * Math.PI * 18) * 62 * env;
        break;
      }
      case "flat":
      default:
        y = meio;
    }

    pts.push([x, y]);
  }

  return pts;
}

/** Catmull-Rom → path Bézier cúbico. */
export function pathFromPoints(points: Ponto[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }

  return d;
}

/** Estado intermediário entre duas formas. `t` de 0 a 1. */
export function lerpShapes(a: Ponto[], b: Ponto[], t: number): Ponto[] {
  return a.map(([ax, ay], i) => {
    const [bx, by] = b[i] ?? [ax, ay];
    return [ax + (bx - ax) * t, ay + (by - ay) * t] as Ponto;
  });
}

/**
 * Transforma a linha de um estado no outro, dirigido por scroll.
 * Devolve a timeline para quem chamou compor com o resto da cena.
 */
export function morphLine(
  path: SVGPathElement,
  de: LineVariant,
  para: LineVariant,
  scrollVars: ScrollTrigger.Vars
) {
  const a = lineShape(de);
  const b = lineShape(para);
  const estado = { t: 0 };

  path.setAttribute("d", pathFromPoints(a));

  return gsap.to(estado, {
    t: 1,
    ease: "none",
    scrollTrigger: scrollVars,
    onUpdate: () => {
      path.setAttribute("d", pathFromPoints(lerpShapes(a, b, estado.t)));
    },
  });
}

export const LINE_VIEWBOX = `0 0 ${VIEW.w} ${VIEW.h}`;
