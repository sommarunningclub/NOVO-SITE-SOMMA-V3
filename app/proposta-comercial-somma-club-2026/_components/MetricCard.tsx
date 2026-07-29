"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import type { Metric } from "../_types/commercial";
import { Reveal } from "./ui";

/** Conta de 0 até o alvo quando entra na tela (respeita reduced-motion). */
export function CountUp({
  target,
  format = (n) => Math.round(n).toLocaleString("pt-BR"),
  duration = 1600,
}: {
  target: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      // ease-out
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}

/** Big number: usa o rótulo pronto (`valor`) para preservar formatos como "14,2 mil". */
export function MetricCard({ metric, delay = 0 }: { metric: Metric; delay?: number }) {
  return (
    <Reveal delay={delay} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      {metric.kicker && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {metric.kicker}
        </p>
      )}
      <p className="mt-3 text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">
        {metric.prefixo}
        {metric.valor}
        {metric.sufixo && <span className="text-[var(--somma-primary)]">{metric.sufixo}</span>}
      </p>
      <p className="mt-3 text-sm leading-snug text-white/65 sm:text-base">{metric.label}</p>
    </Reveal>
  );
}
