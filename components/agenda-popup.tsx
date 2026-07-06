"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, X, ArrowRight, Sparkles } from "lucide-react";

// Pop-up flutuante e divertido para divulgar a Agenda Oficial do Somma.
// Aparece na home depois de um tempinho, some por 7 dias quando fechado
// (localStorage), e pode ser reaberto pela bolinha no cantinho.
const AGENDA_URL = "https://agenda.sommaclub.com.br";
const STORAGE_KEY = "somma_agenda_popup_v1";
const SNOOZE_DAYS = 7;
const SHOW_DELAY_MS = 3500;

type State = "hidden" | "card" | "bubble";

function isSnoozed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + SNOOZE_DAYS * 864e5));
  } catch {
    /* ignore */
  }
}

export function AgendaPopup() {
  const [state, setState] = useState<State>("hidden");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (isSnoozed()) return;
    const t = setTimeout(() => setState("card"), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Esc fecha o card (colapsa para a bolinha)
  useEffect(() => {
    if (state !== "card") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState("bubble");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  const closeCard = () => {
    snooze();
    setState("bubble");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:justify-end sm:px-0">
      <AnimatePresence mode="wait">
        {state === "card" && (
          <motion.aside
            key="card"
            role="dialog"
            aria-label="Conheça a Agenda Oficial do Somma"
            initial={{ opacity: 0, y: 48, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E0E]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            {/* brilho decorativo no topo */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />

            {/* sparkles divertidas */}
            {!reduce && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute right-14 top-4 text-primary"
                  animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.4, 1, 0.4], rotate: [0, 20, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                <motion.span
                  aria-hidden
                  className="absolute right-24 top-9 text-white/40"
                  animate={{ scale: [0.5, 1, 0.5], opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                >
                  <Sparkles className="h-3 w-3" />
                </motion.span>
              </>
            )}

            <button
              onClick={closeCard}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative flex items-start gap-3">
              <motion.span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
                animate={reduce ? undefined : { rotate: [0, -8, 8, -4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
              >
                <CalendarDays className="h-6 w-6" />
              </motion.span>
              <div className="min-w-0 pr-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  Novidade
                </span>
                <h3 className="mt-2 text-lg font-bold leading-tight text-white">
                  Não perde nenhum rolê! 🏃‍♂️💨
                </h3>
              </div>
            </div>

            <p className="relative mt-3 text-sm leading-relaxed text-white/70">
              Treinos, corridas e ativações do Somma numa agenda só. Adiciona no
              seu calendário e <span className="text-white">nunca mais perca a hora</span>. 🗓️
            </p>

            <div className="relative mt-4 flex items-center gap-2">
              <a
                href={AGENDA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => snooze()}
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Conhecer a agenda
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <button
                onClick={closeCard}
                className="rounded-full px-3 py-3 text-xs font-medium text-white/40 transition-colors hover:text-white/70"
              >
                Agora não
              </button>
            </div>

            <p className="relative mt-2.5 text-center text-[11px] text-white/25">
              agenda.sommaclub.com.br
            </p>
          </motion.aside>
        )}

        {state === "bubble" && (
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            onClick={() => setState("card")}
            aria-label="Abrir a Agenda do Somma"
            className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center self-end rounded-full bg-primary text-white shadow-2xl shadow-primary/30 transition-colors hover:bg-primary-hover"
          >
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <CalendarDays className="relative h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
