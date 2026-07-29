"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Minus, GitCompareArrows, ArrowRight } from "lucide-react";
import { getOpportunity } from "../_data/commercialPackages";
import type { Opportunity, OpportunityAttributes } from "../_types/commercial";
import { useCommercial } from "./CommercialContext";

const ROWS: { label: string; get: (o: Opportunity) => string | keyof OpportunityAttributes | number }[] = [
  { label: "Investimento", get: (o) => o.investimentoLabel },
  { label: "Duração", get: (o) => o.duracao },
];

const ATTR_ROWS: { label: string; key: keyof OpportunityAttributes }[] = [
  { label: "Presença física", key: "presencaFisica" },
  { label: "Mídia digital", key: "midiaDigital" },
  { label: "Comunicação com a base", key: "comunicacaoBase" },
  { label: "Tecnologia", key: "tecnologia" },
  { label: "Exclusividade", key: "exclusividade" },
  { label: "Personalização", key: "personalizacao" },
  { label: "Relatórios", key: "relatorios" },
];

function Level({ v }: { v: 0 | 1 | 2 }) {
  if (v === 2) return <Check className="mx-auto h-4 w-4 text-[var(--somma-primary)]" aria-label="Incluído" />;
  if (v === 1)
    return (
      <span className="mx-auto block text-[11px] font-semibold text-white/60" aria-label="Parcial ou opcional">
        Parcial
      </span>
    );
  return <Minus className="mx-auto h-4 w-4 text-white/25" aria-label="Não incluído" />;
}

export default function PackageComparison() {
  const { compare, clearCompare, toggleCompare, maxCompare } = useCommercial();
  const [open, setOpen] = useState(false);
  const opps = compare.map((id) => getOpportunity(id)).filter(Boolean) as Opportunity[];

  return (
    <>
      {/* Barra flutuante */}
      <AnimatePresence>
        {opps.length > 0 && !open && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-4 z-[55] mx-auto flex w-[calc(100%-2rem)] max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-[var(--somma-surface)]/95 p-3 shadow-2xl backdrop-blur-md sm:bottom-6"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <span className="shrink-0 text-xs font-semibold text-white/50">
                {opps.length}/{maxCompare}
              </span>
              <div className="pcs-no-scrollbar flex gap-1.5 overflow-x-auto">
                {opps.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => toggleCompare(o.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/20"
                    aria-label={`Remover ${o.nome}`}
                  >
                    {o.nome.length > 22 ? o.nome.slice(0, 22) + "…" : o.nome}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--somma-primary)] px-4 py-2 text-xs font-bold text-white"
            >
              <GitCompareArrows className="h-4 w-4" /> Comparar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de comparação */}
      <AnimatePresence>
        {open && opps.length > 0 && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Fechar comparador" tabIndex={-1} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Comparador de cotas"
              initial={{ y: "5%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "5%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pcs-no-scrollbar relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[var(--somma-surface)] p-5 sm:max-h-[88vh] sm:max-w-3xl sm:rounded-3xl sm:p-7"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">Comparador de cotas</h2>
                <button onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 overflow-x-auto pcs-no-scrollbar">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="w-[34%] p-2 text-left align-bottom" />
                      {opps.map((o) => (
                        <th key={o.id} className="p-2 align-bottom text-left">
                          <span className="block text-[13px] font-bold leading-tight text-white">{o.nome}</span>
                          <span className="mt-1 block text-xs font-semibold text-[var(--somma-primary)]">
                            {o.investimentoLabel}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr key={r.label} className="border-t border-white/10">
                        <td className="p-2 text-xs font-semibold uppercase tracking-wide text-white/45">{r.label}</td>
                        {opps.map((o) => (
                          <td key={o.id} className="p-2 text-[13px] text-white/80">
                            {String(r.get(o))}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {ATTR_ROWS.map((r) => (
                      <tr key={r.key} className="border-t border-white/10">
                        <td className="p-2 text-xs font-semibold uppercase tracking-wide text-white/45">{r.label}</td>
                        {opps.map((o) => (
                          <td key={o.id} className="p-2 text-center">
                            <Level v={o.atributos[r.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={clearCompare} className="text-sm font-semibold text-white/50 hover:text-white">
                  Limpar seleção
                </button>
                <a
                  href="#contato"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--somma-primary)] px-6 py-3 text-sm font-bold text-white"
                >
                  Solicitar proposta com essas cotas
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
