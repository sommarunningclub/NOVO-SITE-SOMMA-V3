"use client";

import { ArrowRight, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IntroScreenProps {
  nome: string | null;
  temRascunho: boolean;
  onComecar: () => void;
  onRecomecar: () => void;
}

export function IntroScreen({ nome, temRascunho, onComecar, onRecomecar }: IntroScreenProps) {
  return (
    <section
      aria-labelledby="nps-intro-titulo"
      className="relative flex flex-1 flex-col pb-10 pt-8 sm:pt-16 lg:justify-center lg:py-16"
    >
      <div className="max-w-[680px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#ff2c04]">
          {nome ? `Olá, ${nome}` : "Assessoria Somma"}
        </p>
        <h1
          id="nps-intro-titulo"
          className="mt-5 text-[46px] font-semibold leading-[0.98] tracking-[-0.04em] sm:text-[64px] lg:text-[80px]"
        >
          Queremos ouvir você.
        </h1>
        <p className="mt-6 max-w-[36ch] text-[18px] leading-relaxed text-white/70 sm:text-[20px]">
          Essa pesquisa vai nos ajudar a entender o que estamos fazendo bem e onde podemos melhorar a experiência da
          Assessoria Somma.
        </p>
        <p className="mt-6 flex items-center gap-2 text-[14px] text-white/60">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Leva poucos minutos.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
          <button
            type="button"
            onClick={onComecar}
            className="group flex h-14 items-center justify-center gap-2 rounded-full bg-[#ff2c04] px-8 text-[16px] font-semibold text-[#0b0b0c] transition hover:bg-[#ff4a26] active:scale-[0.99] motion-reduce:active:scale-100"
          >
            {temRascunho ? "Continuar de onde parei" : "Começar pesquisa"}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </button>
          {temRascunho && (
            <button
              type="button"
              onClick={onRecomecar}
              className="h-12 rounded-full px-4 text-[15px] font-medium text-white/70 transition hover:text-white"
            >
              Começar do zero
            </button>
          )}
        </div>
      </div>

      <EscalaDecorativa />
    </section>
  );
}

/**
 * Onze barras, de 0 a 10, com as duas últimas na cor da marca: a própria
 * escala do NPS como assinatura visual. Decoração pura, fora da árvore de
 * acessibilidade.
 */
function EscalaDecorativa() {
  const reduzir = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none mt-auto pt-14 lg:absolute lg:bottom-10 lg:right-0 lg:mt-0 lg:pt-0"
    >
      <div className="flex h-20 items-end gap-[5px] sm:h-28 sm:gap-2 lg:h-40 lg:gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <motion.span
            key={i}
            className={cn(
              "block w-[7px] origin-bottom rounded-full sm:w-2.5",
              i >= 9 ? "bg-[#ff2c04]" : i >= 7 ? "bg-white/25" : "bg-white/[0.09]"
            )}
            style={{ height: `${18 + i * 8.2}%` }}
            initial={reduzir ? false : { scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.045, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
    </div>
  );
}
