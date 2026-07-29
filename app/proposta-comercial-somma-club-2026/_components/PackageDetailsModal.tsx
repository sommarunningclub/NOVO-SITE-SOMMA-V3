"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ArrowRight, GitCompareArrows, Check } from "lucide-react";
import { getOpportunity } from "../_data/commercialPackages";
import { useCommercial } from "./CommercialContext";

export default function PackageDetailsModal() {
  const { openId, closeModal, toggleCompare, isComparing } = useCommercial();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const opp = openId ? getOpportunity(openId) : undefined;

  /* Escape fecha; trava o scroll do body enquanto aberto. */
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openId, closeModal]);

  const selected = opp ? isComparing(opp.id) : false;

  return (
    <AnimatePresence>
      {opp && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Fechar detalhes"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pcs-modal-title"
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { y: "6%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "6%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pcs-no-scrollbar relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[var(--somma-surface)] p-6 outline-none sm:max-h-[86vh] sm:max-w-2xl sm:rounded-3xl sm:p-8"
          >
            {/* alça do bottom-sheet no mobile */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" aria-hidden />

            <button
              onClick={closeModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/60">
              {opp.tipo}
            </span>
            <h2 id="pcs-modal-title" className="mt-3 pr-10 text-2xl font-black leading-tight text-white">
              {opp.nome}
            </h2>
            <p className="mt-2 text-lg font-bold text-[var(--somma-primary)]">{opp.investimentoLabel}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
              <span>Duração: {opp.duracao}</span>
              {opp.publicoPotencial && <span>Público: {opp.publicoPotencial}</span>}
            </div>

            <Field label="Descrição">{opp.descricao}</Field>
            <Field label="Objetivo">{opp.objetivo}</Field>
            <Field label="Indicação de uso">{opp.indicacao}</Field>

            <ListField label="Entregas possíveis" items={opp.entregas} tone="check" />
            {opp.naoIncluido && opp.naoIncluido.length > 0 && (
              <ListField label="O que não está incluído automaticamente" items={opp.naoIncluido} tone="x" />
            )}

            <div className="mt-6 rounded-2xl border border-[var(--somma-primary)]/30 bg-[var(--somma-highlight)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Investimento inicial</p>
              <p className="mt-1 text-xl font-black text-white">{opp.investimentoLabel}</p>
            </div>

            {opp.observacoes && (
              <p className="mt-4 text-xs leading-relaxed text-white/45">
                <span className="font-semibold text-white/60">Observações comerciais: </span>
                {opp.observacoes}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a
                href="#contato"
                onClick={closeModal}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--somma-primary)] px-5 py-3 text-sm font-bold text-white"
              >
                Solicitar proposta
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={() => toggleCompare(opp.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors ${
                  selected
                    ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
                    : "border-white/25 text-white hover:bg-white/10"
                }`}
              >
                {selected ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
                {selected ? "No comparador" : "Comparar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-white/75">{children}</p>
    </div>
  );
}

function ListField({ label, items, tone }: { label: string; items: string[]; tone: "check" | "x" }) {
  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">{label}</p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm leading-snug text-white/75">
            {tone === "check" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--somma-primary)]" aria-hidden />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden />
            )}
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
