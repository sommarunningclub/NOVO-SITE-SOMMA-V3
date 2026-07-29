"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ArrowRight, Info } from "lucide-react";
import { OPPORTUNITIES, SIMULATOR_ACTIVATIONS, getOpportunity } from "../_data/commercialPackages";
import { brl } from "../_data/config";
import type { SimulatorState } from "../_types/commercial";

const ADDONS: { key: keyof Pick<SimulatorState, "midiaAdicional" | "agenda" | "popupSite" | "popupCheckin">; oppId: string; label: string }[] = [
  { key: "midiaAdicional", oppId: "instagram-completo", label: "Mídias adicionais (Instagram completo)" },
  { key: "agenda", oppId: "agenda-somma", label: "Agenda Somma Club" },
  { key: "popupSite", oppId: "popup-site", label: "Pop-up no site" },
  { key: "popupCheckin", oppId: "popup-checkin", label: "Pop-up no check-in" },
];

const activationOptions = SIMULATOR_ACTIVATIONS.map((id) => getOpportunity(id)).filter(Boolean) as typeof OPPORTUNITIES;

export default function Simulator() {
  const [state, setState] = useState<SimulatorState>({
    ativacaoId: activationOptions[0]?.id ?? "",
    meses: 1,
    midiaAdicional: false,
    agenda: false,
    popupSite: false,
    popupCheckin: false,
  });

  const set = <K extends keyof SimulatorState>(k: K, v: SimulatorState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const { base, addonsMensal, mensal, total } = useMemo(() => {
    const base = getOpportunity(state.ativacaoId)?.investimento ?? 0;
    const addonsMensal = ADDONS.reduce(
      (sum, a) => (state[a.key] ? sum + (getOpportunity(a.oppId)?.investimento ?? 0) : sum),
      0,
    );
    const mensal = base + addonsMensal;
    return { base, addonsMensal, mensal, total: mensal * state.meses };
  }, [state]);

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Controles */}
      <div className="space-y-6">
        <div>
          <label htmlFor="sim-ativacao" className="text-xs font-semibold uppercase tracking-wide text-white/45">
            Tipo de ativação
          </label>
          <select
            id="sim-ativacao"
            value={state.ativacaoId}
            onChange={(e) => set("ativacaoId", e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-[var(--somma-surface-2)] px-4 py-3 text-sm text-white outline-none focus:border-[var(--somma-primary)]"
          >
            {activationOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} — {o.investimentoLabel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Quantidade de meses</span>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => set("meses", Math.max(1, state.meses - 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white hover:bg-white/10 disabled:opacity-40"
              aria-label="Menos um mês"
              disabled={state.meses <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-black text-white">{state.meses}</span>
              <span className="ml-1 text-sm text-white/50">{state.meses === 1 ? "mês" : "meses"}</span>
            </div>
            <button
              onClick={() => set("meses", Math.min(12, state.meses + 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white hover:bg-white/10 disabled:opacity-40"
              aria-label="Mais um mês"
              disabled={state.meses >= 12}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            value={state.meses}
            onChange={(e) => set("meses", Number(e.target.value))}
            className="mt-3 w-full accent-[var(--somma-primary)]"
            aria-label="Quantidade de meses"
          />
        </div>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-white/45">Adicionais (por mês)</legend>
          <div className="mt-2 space-y-2">
            {ADDONS.map((a) => {
              const price = getOpportunity(a.oppId)?.investimento ?? 0;
              return (
                <label
                  key={a.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm has-[:checked]:border-[var(--somma-primary)]/50 has-[:checked]:bg-[var(--somma-highlight)]"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={state[a.key]}
                      onChange={(e) => set(a.key, e.target.checked)}
                      className="h-4 w-4 accent-[var(--somma-primary)]"
                    />
                    <span className="text-white/80">{a.label}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-white/50">{brl(price)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Estimativa */}
      <div className="flex flex-col rounded-2xl border border-[var(--somma-primary)]/30 bg-[var(--somma-highlight)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Estimativa comercial inicial</p>
        <p className="mt-2 text-4xl font-black leading-none text-white sm:text-5xl">{brl(total)}</p>
        <p className="mt-1 text-sm text-white/55">
          {brl(mensal)}/mês × {state.meses} {state.meses === 1 ? "mês" : "meses"}
        </p>

        <dl className="mt-5 space-y-1.5 border-t border-white/15 pt-4 text-sm">
          <div className="flex justify-between text-white/70">
            <dt>Ativação base</dt>
            <dd>{brl(base)}/mês</dd>
          </div>
          {addonsMensal > 0 && (
            <div className="flex justify-between text-white/70">
              <dt>Adicionais</dt>
              <dd>{brl(addonsMensal)}/mês</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto space-y-2 pt-5">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-white/50">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Estimativa inicial baseada nos valores mínimos. O orçamento final depende do escopo. Custos de estrutura e
            produção podem ser adicionados. Não é uma proposta definitiva.
          </p>
          <a
            href="#contato"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--somma-primary)] px-5 py-3 text-sm font-bold text-white"
          >
            Solicitar proposta personalizada
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
