"use client";

import type { CSSProperties, ReactNode } from "react";
import s from "./deck.module.css";

export { s };

export const cx = (...v: (string | false | undefined | null)[]) => v.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ headline */

/**
 * Headline com máscara por palavra.
 *
 * O split acontece no render (e não via SplitText no cliente), então o HTML já
 * sai do servidor com a estrutura final: sem reflow, sem flash e legível se o
 * JS não carregar.
 */
export function Headline({
  children,
  as: Tag = "h2",
  level = "h2",
  className,
  style,
  id,
  solo,
}: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  level?: "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** a seção cuida do timing desta headline; fica de fora do reveal automático */
  solo?: boolean;
}) {
  const lines = children.split("\n");
  return (
    <Tag id={id} data-solo={solo ? "" : undefined} className={cx(s[level], "js-head", className)} style={style}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((w, wi) => (
            <span key={wi} className={s.rw}>
              <span className={cx(s.rwIn, "js-word")}>{w}</span>
              {wi < line.split(" ").length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------------ etiquetas */

export function Eyebrow({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: "hot" | "cyan";
}) {
  return (
    <p
      className={cx(s.eyebrow, className)}
      style={tone ? { color: tone === "hot" ? "var(--somma)" : "var(--cyan)" } : undefined}
    >
      {children}
    </p>
  );
}

/** Índice da seção. Funciona como número de peito ao longo do deck. */
export function Chapter({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-4 md:mb-12">
      <span className={cx(s.mono, "text-[0.6875rem] tracking-[0.28em]")} style={{ color: "var(--somma)" }}>
        {n}
      </span>
      <span className={cx(s.mono, "text-[0.6875rem] uppercase tracking-[0.28em]")} style={{ color: "var(--dim-2)" }}>
        {label}
      </span>
      <span className={cx(s.rule, "js-rule ml-2 flex-1")} />
    </div>
  );
}

/* ------------------------------------------------------------------ seção */

export function Section({
  id,
  stage,
  children,
  className,
  style,
}: {
  id: string;
  /** estágio da jornada usado pelo indicador global */
  stage: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section id={id} data-stage={stage} className={cx(s.section, "js-section", className)} style={style}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ átomos */

export function Rule({ className }: { className?: string }) {
  return <div className={cx(s.rule, "js-rule", className)} />;
}

/** Marcador de quilômetro reaproveitado como bullet técnico. */
export function KmTick({ km, className }: { km: string; className?: string }) {
  return (
    <span className={cx(s.bib, "inline-flex items-center gap-2", className)}>
      <span className="h-[1px] w-4" style={{ background: "var(--cyan)" }} />
      {km}
    </span>
  );
}

export function Pill({ children, tone = "line" }: { children: ReactNode; tone?: "line" | "hot" | "cyan" }) {
  const map = {
    line: { border: "1px solid var(--hair)", color: "var(--dim)", background: "transparent" },
    hot: { border: "1px solid rgba(255,44,4,.42)", color: "var(--somma)", background: "rgba(255,44,4,.07)" },
    cyan: { border: "1px solid rgba(85,218,255,.32)", color: "var(--cyan)", background: "rgba(85,218,255,.06)" },
  } as const;
  return (
    <span
      className={cx(s.mono, "inline-block rounded-full px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em]")}
      style={map[tone]}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ logos */

export function Lockup({
  size = "md",
  className,
  stacked = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  stacked?: boolean;
}) {
  // as duas marcas têm proporções muito diferentes: a Sunset Run é empilhada e a
  // Somma é uma palavra só, então o equilíbrio aqui é óptico, não matemático
  const h = { sm: "h-6 md:h-7", md: "h-8 md:h-11", lg: "h-11 md:h-16" }[size];
  const hs = { sm: "h-3 md:h-3.5", md: "h-4 md:h-[1.35rem]", lg: "h-[1.4rem] md:h-8" }[size];
  return (
    <div
      className={cx(
        "flex items-center justify-center",
        stacked ? "flex-col gap-4" : "gap-4 md:gap-6",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sbt/kit/sunset-run-logo.png" alt="SBT Sunset Run" className={cx(h, "w-auto")} />
      <span aria-hidden className="text-lg font-extralight leading-none" style={{ color: "var(--dim-2)" }}>
        ×
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-somma.svg" alt="Somma Club" className={cx(hs, "w-auto")} />
    </div>
  );
}

/* ------------------------------------------------------------------ atmosfera */

export function Atmosphere({
  sun = true,
  grain = true,
  className,
}: {
  sun?: boolean;
  grain?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {sun ? <div className={s.sunGlow} /> : null}
      {grain ? <div className={s.grain} /> : null}
    </div>
  );
}

/** Linhas de velocidade: o padrão gráfico da camiseta virando textura de fundo. */
export function PaceLines({ count = 7, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cx(s.paceLines, "js-pace", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cx(s.paceLine, "js-pace-line")}
          style={{
            top: `${9 + ((i * 83) % 82)}%`,
            width: `${22 + ((i * 37) % 38)}%`,
            opacity: 0.16 + ((i * 13) % 22) / 100,
          }}
        />
      ))}
    </div>
  );
}
