"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSlide } from "./ui";

/**
 * Geometria do símbolo SOMMA, medida no arquivo oficial
 * "Nova Marca Somma Club 2026/SÍMBOLO". Grade 5×5 com espaçamento 1;
 * cada item é [x, y, raio]. O logo completo (palavra + símbolo) usa sempre o
 * SVG do repositório; esta geometria só serve à animação de montagem.
 */
export const SIMBOLO: [number, number, number][] = [
  [-1, -2, 0.212], [0, -2, 0.372], [1, -2, 0.212],
  [-2, -1, 0.212], [-1, -1, 0.438], [0, -1, 0.515], [1, -1, 0.438], [2, -1, 0.212],
  [-2, 0, 0.372], [-1, 0, 0.515], [0, 0, 0.567], [1, 0, 0.515], [2, 0, 0.372],
  [-2, 1, 0.212], [-1, 1, 0.438], [0, 1, 0.515], [1, 1, 0.438], [2, 1, 0.212],
  [-1, 2, 0.212], [0, 2, 0.372], [1, 2, 0.212],
];

/** Pseudoaleatório determinístico (mesmo desenho no servidor e no cliente). */
function semente(n: number) {
  let s = n >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * O símbolo se montando a partir de pontos soltos: pessoas que chegam e
 * formam a comunidade.
 */
export function SimboloMontagem({
  cor = "var(--laranja)",
  className,
  style,
  atraso = 0.2,
}: {
  cor?: string;
  className?: string;
  style?: React.CSSProperties;
  atraso?: number;
}) {
  const { ativo } = useSlide();
  const reduzir = useReducedMotion();
  const origens = useMemo(() => {
    const r = semente(7);
    return SIMBOLO.map((_, i) => {
      const ang = i * 2.399 + r() * 0.6;
      const dist = 3.2 + r() * 2.6;
      return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist * 0.75 };
    });
  }, []);
  return (
    <svg viewBox="-2.75 -2.75 5.5 5.5" className={className} style={style} aria-hidden="true" overflow="visible">
      {SIMBOLO.map(([x, y, r], i) => {
        const montado = ativo || reduzir;
        return (
          <motion.circle
            key={i}
            fill={cor}
            initial={{ cx: origens[i].x, cy: origens[i].y, r: 0.07, opacity: 0 }}
            animate={
              montado
                ? { cx: x, cy: y, r, opacity: 1 }
                : { cx: origens[i].x, cy: origens[i].y, r: 0.07, opacity: 0 }
            }
            transition={{
              duration: reduzir ? 0 : 1.5,
              delay: reduzir ? 0 : atraso + i * 0.045,
              ease: [0.16, 0.84, 0.24, 1],
            }}
          />
        );
      })}
    </svg>
  );
}

/**
 * Campo de pessoas em canvas: um ponto por pessoa. `destaque` pontos ficam
 * laranja (sorteados de forma fixa). Acende aos poucos quando o slide entra.
 */
export function CampoPessoas({
  total,
  destaque,
  className,
  rotulo,
}: {
  total: number;
  destaque: number;
  className?: string;
  rotulo: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { ativo } = useSlide();
  const reduzir = useReducedMotion();

  const { ordem, laranja } = useMemo(() => {
    const r = semente(2026);
    const idx = Array.from({ length: total }, (_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    // Os `destaque` primeiros da ordem embaralhada ficam laranja.
    const lar = new Uint8Array(total);
    for (let k = 0; k < destaque; k++) lar[idx[k]] = 1;
    // Ordem de acender: outra permutação.
    const acende = Array.from({ length: total }, (_, i) => i);
    for (let i = acende.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [acende[i], acende[j]] = [acende[j], acende[i]];
    }
    return { ordem: acende, laranja: lar };
  }, [total, destaque]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let inicio = 0;
    const DUR = 2200;

    function desenhar(progresso: number) {
      if (!cv || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const estilo = getComputedStyle(cv);
      const corNeutra = estilo.getPropertyValue("--ponto-neutro").trim() || "#333";
      const corLaranja = estilo.getPropertyValue("--laranja").trim() || "#ff2c03";
      const cols = Math.ceil(Math.sqrt((total * w) / h));
      const rows = Math.ceil(total / cols);
      const passo = Math.min(w / cols, h / rows);
      const raio = Math.max(0.6, passo * 0.34);
      const ox = (w - cols * passo) / 2 + passo / 2;
      const oy = (h - rows * passo) / 2 + passo / 2;
      const acesos = Math.floor(total * progresso);
      for (const cor of [corNeutra, corLaranja]) {
        ctx.fillStyle = cor;
        ctx.beginPath();
        for (let k = 0; k < acesos; k++) {
          const i = ordem[k];
          if ((laranja[i] === 1) !== (cor === corLaranja)) continue;
          const x = ox + (i % cols) * passo;
          const y = oy + Math.floor(i / cols) * passo;
          ctx.moveTo(x + raio, y);
          ctx.arc(x, y, raio, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    function quadro(t: number) {
      if (!inicio) inicio = t;
      const p = Math.min(1, (t - inicio) / DUR);
      const suave = 1 - Math.pow(1 - p, 3);
      desenhar(suave);
      if (p < 1) raf = requestAnimationFrame(quadro);
    }

    if (!ativo) desenhar(0);
    else if (reduzir) desenhar(1);
    else raf = requestAnimationFrame(quadro);

    const ro = new ResizeObserver(() => {
      if (ativo) desenhar(1);
    });
    ro.observe(cv);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ativo, reduzir, ordem, laranja, total]);

  return <canvas ref={ref} className={className} role="img" aria-label={rotulo} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export interface CategoriaWaffle {
  id: string;
  rotulo: string;
  pontos: number; // de 100
  cor: string;
}

/**
 * Waffle de 100 pontos: cada ponto é 1%. Passar o mouse numa categoria
 * acende só os pontos dela.
 */
export function Waffle({
  categorias,
  foco,
  aoFocar,
  rotulo,
  className,
  colunas = 10,
}: {
  categorias: CategoriaWaffle[];
  foco: string | null;
  aoFocar: (id: string | null) => void;
  rotulo: string;
  className?: string;
  colunas?: number;
}) {
  const { ativo } = useSlide();
  const reduzir = useReducedMotion();
  const pontos: { cat: CategoriaWaffle; i: number }[] = [];
  for (const c of categorias) for (let k = 0; k < c.pontos; k++) pontos.push({ cat: c, i: pontos.length });
  const linhas = Math.ceil(pontos.length / colunas);
  return (
    <svg
      viewBox={`0 0 ${colunas} ${linhas}`}
      className={className}
      role="img"
      aria-label={rotulo}
      onMouseLeave={() => aoFocar(null)}
      data-interativo
    >
      {pontos.map(({ cat, i }) => {
        const apagado = foco != null && foco !== cat.id;
        return (
          <motion.circle
            key={i}
            cx={(i % colunas) + 0.5}
            cy={Math.floor(i / colunas) + 0.5}
            fill={cat.cor}
            initial={{ r: 0 }}
            animate={{ r: ativo ? 0.4 : 0, opacity: apagado ? 0.18 : 1 }}
            transition={{
              r: { duration: reduzir ? 0 : 0.5, delay: reduzir ? 0 : 0.25 + i * 0.012, ease: [0.2, 0.7, 0.2, 1] },
              opacity: { duration: 0.25 },
            }}
            onMouseEnter={() => aoFocar(cat.id)}
            style={{ cursor: "default" }}
          />
        );
      })}
    </svg>
  );
}
