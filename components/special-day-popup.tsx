"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ArrowRight, PartyPopper } from "lucide-react";

// Pop-up do evento Somma Special Day (1 ano do Somma) — leva para o site do evento.
// Identidade festiva própria do Special Day (paleta e energia diferentes da home).
const EVENT_URL = "https://specialday.sommaclub.com.br/";
const STORAGE_KEY = "somma_specialday_popup_v1";
const SNOOZE_DAYS = 5;
const SHOW_DELAY_MS = 2500;

// Paleta oficial do Special Day (não está no tailwind do NOVO → usada inline)
const C = {
  black: "#0A0A0A",
  blue: "#005EFF",
  orange: "#FF4800",
  yellow: "#FDB716",
  pink: "#FD6FDB",
  cream: "#F9F0DC",
};

type State = "hidden" | "card" | "bubble";

function isSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(until) && until > 0 && Date.now() < until;
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

export function SpecialDayPopup() {
  const [state, setState] = useState<State>("hidden");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (isSnoozed()) return;
    const t = setTimeout(() => setState("card"), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:justify-end sm:px-0">
      <AnimatePresence mode="wait">
        {state === "card" && (
          <motion.aside
            key="card"
            role="dialog"
            aria-label="Somma Special Day — 1 ano do Somma"
            initial={{ opacity: 0, y: 56, scale: 0.88, rotate: -2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl"
            style={{ background: C.black, boxShadow: `6px 6px 0 ${C.yellow}, 0 20px 50px rgba(0,0,0,.5)` }}
          >
            <button
              onClick={closeCard}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Banner com foto real do evento */}
            <div className="relative h-32 w-full overflow-hidden">
              <Image
                src="/special-day/evento.jpg"
                alt="Somma Special Day"
                fill
                sizes="384px"
                className="object-cover object-center"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${C.black} 8%, transparent 70%)` }}
              />
              {/* tag 1 ano */}
              <span
                className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black"
                style={{ background: C.yellow }}
              >
                <PartyPopper className="h-3.5 w-3.5" /> 1 ano do Somma
              </span>
              {/* corredor flutuante */}
              {!reduce && (
                <motion.img
                  src="/special-day/corredor.svg"
                  alt=""
                  aria-hidden
                  className="absolute -bottom-1 right-3 h-16 w-16 drop-shadow-lg"
                  animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>

            {/* Conteúdo */}
            <div className="relative px-5 pb-5 pt-1">
              <h3
                className="text-[26px] font-black uppercase leading-[0.95] tracking-tight text-white"
                style={{ textShadow: `2px 2px 0 ${C.orange}` }}
              >
                Somma<br />Special Day
              </h3>

              <p className="mt-2 text-sm font-medium text-white/70">
                A gente vai comemorar do jeito Somma: <span style={{ color: C.yellow }}>correndo junto</span> 🏃‍♂️💨
              </p>

              {/* chips do evento */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { t: "18 JUL 2026", c: C.blue },
                  { t: "4KM & 8KM", c: C.pink },
                  { t: "400 vagas", c: C.orange },
                ].map((chip) => (
                  <span
                    key={chip.t}
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                    style={{ background: chip.c }}
                  >
                    {chip.t}
                  </span>
                ))}
              </div>

              <p className="mt-2.5 text-xs text-white/45">samba • Red Bull • percurso novo • muita festa 🎉</p>

              <a
                href={EVENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => snooze()}
                className="group mt-4 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black uppercase tracking-wide text-white transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: C.orange }}
              >
                Garantir minha vaga
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <p className="mt-2 text-center text-[11px] text-white/30">
                specialday.sommaclub.com.br · vagas limitadas
              </p>
            </div>
          </motion.aside>
        )}

        {state === "bubble" && (
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            onClick={() => setState("card")}
            aria-label="Abrir o Somma Special Day"
            className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center self-end rounded-full text-black shadow-2xl"
            style={{ background: C.yellow, boxShadow: `4px 4px 0 ${C.orange}` }}
          >
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: C.yellow }}
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <PartyPopper className="relative h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
