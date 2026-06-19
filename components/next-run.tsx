"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";
import { nextSaturday7am } from "@/lib/utils";

function useCountdown(target: Date) {
  const [left, setLeft] = useState<number>(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const clamped = Math.max(0, left);
  return {
    dias: Math.floor(clamped / 86400000),
    horas: Math.floor((clamped / 3600000) % 24),
    min: Math.floor((clamped / 60000) % 60),
    seg: Math.floor((clamped / 1000) % 60),
  };
}

export function NextRun() {
  // Evita mismatch de hidratação calculando o alvo só no cliente.
  const [target, setTarget] = useState<Date | null>(null);
  useEffect(() => setTarget(nextSaturday7am()), []);
  const c = useCountdown(target ?? new Date());

  const units = [
    { v: c.dias, l: "dias" },
    { v: c.horas, l: "horas" },
    { v: c.min, l: "min" },
    { v: c.seg, l: "seg" },
  ];

  return (
    <section id="proximo-treino" className="bg-ink py-20 text-white md:py-28">
      <div className="container-somma">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-dark-card p-8 text-center md:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Próximo encontro Somma
          </p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Bora correr no sábado?</h2>

          {/* Countdown */}
          <div className="mt-8 flex justify-center gap-3 md:gap-5" suppressHydrationWarning>
            {units.map((u) => (
              <div
                key={u.l}
                className="flex min-w-[64px] flex-col rounded-2xl bg-white/5 px-3 py-4 md:min-w-[88px]"
              >
                <span className="text-3xl font-bold tabular-nums md:text-5xl">
                  {target ? String(u.v).padStart(2, "0") : "--"}
                </span>
                <span className="mt-1 text-xs uppercase tracking-wide text-white/60">{u.l}</span>
              </div>
            ))}
          </div>

          <ul className="mt-8 flex flex-col items-center gap-3 text-white/80 sm:flex-row sm:justify-center sm:gap-6">
            <li className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> {SOMMA.encontro.dia}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> {SOMMA.encontro.hora}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> {SOMMA.encontro.local}, {SOMMA.encontro.ponto}
            </li>
          </ul>

          <p className="mt-4 text-sm text-white/60">
            Ritmos para iniciantes, intermediários e avançados.
          </p>

          <a
            href={SOMMA.links.inscricao}
            className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Confirmar presença
          </a>
        </div>
      </div>
    </section>
  );
}
