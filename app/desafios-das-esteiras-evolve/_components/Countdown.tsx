"use client";

import { useEffect, useMemo, useState } from "react";
import { EVENT } from "@/lib/desafio-esteiras/event.config";

type Restante = { d: number; h: number; m: number; s: number; acabou: boolean };

function calcular(alvo: number): Restante {
  const diff = alvo - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, acabou: true };
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    acabou: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Cronômetro até 19/08/2026 19h (America/Sao_Paulo).
 *
 * Renderiza `--` no servidor e no primeiro paint: a data do cliente só é
 * confiável depois da hidratação, e um valor divergente causaria mismatch.
 */
export function Countdown({ compacto = false }: { compacto?: boolean }) {
  const alvo = useMemo(() => new Date(EVENT.inicioISO).getTime(), []);
  const [restante, setRestante] = useState<Restante | null>(null);

  useEffect(() => {
    setRestante(calcular(alvo));
    const id = setInterval(() => setRestante(calcular(alvo)), 1000);
    return () => clearInterval(id);
  }, [alvo]);

  const unidades: { valor: string; rotulo: string }[] = [
    { valor: restante ? String(restante.d) : "--", rotulo: "dias" },
    { valor: restante ? pad(restante.h) : "--", rotulo: "horas" },
    { valor: restante ? pad(restante.m) : "--", rotulo: "min" },
    { valor: restante ? pad(restante.s) : "--", rotulo: "seg" },
  ];

  if (restante?.acabou) {
    return (
      <p className="dst-label text-[color:var(--somma)]" role="status">
        O desafio começou
      </p>
    );
  }

  return (
    <div
      className={`dst-panel flex items-stretch ${compacto ? "gap-0" : "gap-0"}`}
      role="timer"
      aria-live="off"
      aria-label={`Faltam ${restante?.d ?? 0} dias para o Desafio das Esteiras`}
    >
      {unidades.map((u, i) => (
        <div
          key={u.rotulo}
          className={`relative flex-1 px-3 py-3 text-center md:px-5 md:py-4 ${
            i > 0 ? "border-l border-[color:var(--line)]" : ""
          }`}
        >
          <span
            className={`dst-num block font-bold leading-none text-[color:var(--paper)] ${
              compacto ? "text-[1.35rem] md:text-[1.6rem]" : "text-[clamp(1.6rem,5.5vw,2.6rem)]"
            }`}
          >
            {u.valor}
          </span>
          <span className="dst-label mt-1.5 block text-[0.55rem] text-[color:rgba(242,240,236,0.45)]">
            {u.rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}
