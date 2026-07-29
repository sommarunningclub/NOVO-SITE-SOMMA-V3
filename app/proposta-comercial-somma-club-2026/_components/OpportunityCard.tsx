"use client";

import { ArrowRight, GitCompareArrows, Check } from "lucide-react";
import type { Opportunity } from "../_types/commercial";
import { useCommercial } from "./CommercialContext";

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const { openOpportunity, toggleCompare, isComparing, compareFull } = useCommercial();
  const selected = isComparing(opp.id);
  const disabledCompare = !selected && compareFull;

  return (
    <div
      className={`flex h-full flex-col rounded-3xl border p-6 transition-colors ${
        opp.destaque
          ? "border-[var(--somma-primary)]/40 bg-[var(--somma-highlight)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/60">
          {opp.tipo}
        </span>
        <button
          onClick={() => toggleCompare(opp.id)}
          disabled={disabledCompare}
          aria-pressed={selected}
          aria-label={selected ? `Remover ${opp.nome} do comparador` : `Adicionar ${opp.nome} ao comparador`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            selected
              ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
              : disabledCompare
                ? "border-white/10 text-white/25"
                : "border-white/20 text-white/60 hover:bg-white/10"
          }`}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
          {selected ? "Comparando" : "Comparar"}
        </button>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug text-white">{opp.nome}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{opp.descricao}</p>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/40">Investimento</p>
          <p className="text-base font-bold text-[var(--somma-primary)]">{opp.investimentoLabel}</p>
          <p className="mt-0.5 text-xs text-white/45">{opp.duracao}</p>
        </div>
        <button
          onClick={() => openOpportunity(opp.id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
        >
          Detalhes
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
