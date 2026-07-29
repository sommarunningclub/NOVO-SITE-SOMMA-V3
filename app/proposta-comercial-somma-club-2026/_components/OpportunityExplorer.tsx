"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GitCompareArrows, Check, ArrowRight, SlidersHorizontal } from "lucide-react";
import { OPPORTUNITIES } from "../_data/commercialPackages";
import { OPPORTUNITY_FILTERS, type OpportunityFilter } from "../_types/commercial";
import { useCommercial } from "./CommercialContext";

export default function OpportunityExplorer() {
  const [filters, setFilters] = useState<OpportunityFilter[]>([]);
  const { openOpportunity, toggleCompare, isComparing, compareFull } = useCommercial();

  const filtered = useMemo(
    () =>
      filters.length === 0
        ? OPPORTUNITIES
        : OPPORTUNITIES.filter((o) => o.filtros.some((f) => filters.includes(f))),
    [filters],
  );

  const toggleFilter = (f: OpportunityFilter) =>
    setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtrar
        </span>
        <button
          onClick={() => setFilters([])}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filters.length === 0
              ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
              : "border-white/20 text-white/60 hover:bg-white/10"
          }`}
        >
          Todas
        </button>
        {OPPORTUNITY_FILTERS.map((f) => {
          const on = filters.includes(f);
          return (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              aria-pressed={on}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                on
                  ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
                  : "border-white/20 text-white/60 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-white/40">
        {filtered.length} {filtered.length === 1 ? "oportunidade" : "oportunidades"}
        {filters.length > 0 ? " no filtro" : " no total"}.
      </p>

      {/* Desktop: tabela */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="w-[34%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Oportunidade</th>
              <th className="w-[22%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Investimento inicial</th>
              <th className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Tipo</th>
              <th className="w-[16%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Duração</th>
              <th className="w-[12%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-white/40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const selected = isComparing(o.id);
              return (
                <tr key={o.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <button onClick={() => openOpportunity(o.id)} className="text-left font-semibold text-white hover:text-[var(--somma-primary)]">
                      {o.nome}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--somma-primary)]">{o.investimentoLabel}</td>
                  <td className="px-4 py-3 text-white/60">{o.tipo}</td>
                  <td className="px-4 py-3 text-white/60">{o.duracao}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => toggleCompare(o.id)}
                        disabled={!selected && compareFull}
                        aria-label={selected ? `Remover ${o.nome} do comparador` : `Comparar ${o.nome}`}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          selected
                            ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
                            : "border-white/15 text-white/60 hover:bg-white/10 disabled:opacity-30"
                        }`}
                      >
                        {selected ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openOpportunity(o.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20"
                      >
                        Detalhes
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: acordeão */}
      <div className="mt-6 space-y-3 md:hidden">
        {filtered.map((o) => (
          <MobileCard key={o.id} id={o.id} />
        ))}
      </div>
    </div>
  );
}

function MobileCard({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const { openOpportunity, toggleCompare, isComparing, compareFull } = useCommercial();
  const o = OPPORTUNITIES.find((x) => x.id === id)!;
  const selected = isComparing(o.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-bold text-white">{o.nome}</span>
          <span className="mt-0.5 block text-sm font-semibold text-[var(--somma-primary)]">{o.investimentoLabel}</span>
          <span className="mt-0.5 block text-xs text-white/45">{o.tipo} · {o.duracao}</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 py-4">
              <p className="text-sm leading-relaxed text-white/70">{o.descricao}</p>
              <ul className="mt-3 space-y-1.5">
                {o.entregas.slice(0, 4).map((e) => (
                  <li key={e} className="flex items-start gap-2 text-[13px] text-white/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--somma-primary)]" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
              {o.observacoes && <p className="mt-3 text-xs leading-relaxed text-white/40">{o.observacoes}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openOpportunity(o.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20"
                >
                  Ver tudo <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleCompare(o.id)}
                  disabled={!selected && compareFull}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-bold transition-colors ${
                    selected
                      ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
                      : "border-white/20 text-white/70 disabled:opacity-40"
                  }`}
                >
                  {selected ? <Check className="h-3.5 w-3.5" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
                  {selected ? "Comparando" : "Comparar"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
