"use client";

import { useEffect, useState } from "react";

/** Contagem até a largada. Antes de hidratar mostra traços, para o HTML do servidor bater com o do navegador. */
export function Contagem({ alvo }: { alvo: string }) {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const fim = new Date(alvo).getTime();
  const resta = agora === null ? null : Math.max(0, fim - agora);
  if (resta === 0) {
    return <p className="font-bora text-3xl font-black uppercase italic text-bora sm:text-5xl">É hoje. BORA!</p>;
  }

  const partes =
    resta === null
      ? null
      : [
          Math.floor(resta / 86_400_000),
          Math.floor(resta / 3_600_000) % 24,
          Math.floor(resta / 60_000) % 60,
          Math.floor(resta / 1000) % 60,
        ];
  const rotulos = ["dias", "horas", "min", "seg"];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" aria-label="Contagem regressiva para o corre">
      {rotulos.map((r, i) => (
        <div key={r} className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 text-center sm:py-6">
          <span className="block font-bora text-4xl font-black italic tabular-nums leading-none text-white sm:text-6xl">
            {partes ? String(partes[i]).padStart(2, "0") : "--"}
          </span>
          <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">{r}</span>
        </div>
      ))}
    </div>
  );
}
