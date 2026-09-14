import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section, SectionId } from "@/lib/assessoria-nps/survey";

interface SectionRailProps {
  secoes: readonly Section[];
  atual: SectionId | null;
}

/** Trilho de etapas do desktop. No celular, o ProgressIndicator faz esse papel. */
export function SectionRail({ secoes, atual }: SectionRailProps) {
  const idxAtual = atual ? secoes.findIndex((s) => s.id === atual) : -1;

  return (
    <nav aria-label="Etapas da pesquisa">
      <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#ff2c04]">Assessoria Somma</p>
      <p className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em]">Pesquisa de experiência</p>

      <ol className="mt-10 space-y-0.5">
        {secoes.map((s, i) => {
          const estado = i === idxAtual ? "atual" : i < idxAtual ? "feita" : "pendente";
          return (
            <li
              key={s.id}
              aria-current={estado === "atual" ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 py-2 text-[15px] transition-colors duration-300",
                estado === "atual" && "font-medium text-[#f5f5f4]",
                estado === "feita" && "text-white/65",
                estado === "pendente" && "text-white/50"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "nps-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-300",
                  estado === "atual" && "bg-[#ff2c04] text-[#0b0b0c]",
                  estado === "feita" && "bg-white/[0.12] text-[#f5f5f4]",
                  estado === "pendente" && "bg-white/[0.05]"
                )}
              >
                {estado === "feita" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              {s.title}
              {estado === "feita" && <span className="sr-only">, concluída</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
