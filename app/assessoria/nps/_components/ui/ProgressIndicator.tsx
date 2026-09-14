"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ProgressIndicatorProps {
  titulo: string;
  indice: number;
  total: number;
  /** 0 a 1. */
  fracao: number;
}

/** Discreto de propósito: nome da etapa, "4 de 10" e um fio de progresso. */
export function ProgressIndicator({ titulo, indice, total, fracao }: ProgressIndicatorProps) {
  const reduzir = useReducedMotion();
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-[13px]">
        <span className="truncate font-medium text-[#f5f5f4]">{titulo}</span>
        <span className="nps-num shrink-0 text-white/60">
          <span className="sr-only">Etapa </span>
          {indice} de {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso da pesquisa"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/10"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-[#ff2c04]"
          initial={false}
          animate={{ scaleX: Math.max(0.015, pct / 100) }}
          transition={reduzir ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 26 }}
        />
      </div>
    </div>
  );
}
