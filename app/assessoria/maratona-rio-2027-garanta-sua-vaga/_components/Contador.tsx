"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PRAZO_INSCRICAO, PRAZO_LEGIVEL, PARCEIRA } from "@/lib/maratona-rio-2027/inscricao";

/**
 * Contagem regressiva até o fim do prazo da Go Dream. Começa em branco e só
 * conta depois de montar no navegador: a hora do servidor e a do aparelho
 * nunca batem no mesmo segundo, e isso quebraria a hidratação. Ao zerar,
 * recarrega a página, que passa a mostrar as inscrições encerradas.
 */
export function Contador() {
  const router = useRouter();
  const [falta, setFalta] = useState<number | null>(null);

  useEffect(() => {
    const atualizar = () => setFalta(PRAZO_INSCRICAO.getTime() - Date.now());
    atualizar();
    const t = setInterval(atualizar, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (falta !== null && falta <= 0) router.refresh();
  }, [falta !== null && falta <= 0, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = Math.max(0, Math.floor((falta ?? 0) / 1000));
  const partes = [
    { n: Math.floor(s / 86400), rotulo: "dias" },
    { n: Math.floor((s % 86400) / 3600), rotulo: "horas" },
    { n: Math.floor((s % 3600) / 60), rotulo: "min" },
    { n: s % 60, rotulo: "seg" },
  ];
  const urgente = falta !== null && falta < 6 * 3600 * 1000;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
        {falta !== null && falta <= 0 ? "Prazo encerrado" : "As inscrições fecham em"}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {partes.map((p) => (
          <div key={p.rotulo} className="rounded-xl bg-black/50 py-3 text-center">
            <p
              className={
                urgente
                  ? "font-bora text-3xl font-black italic tabular-nums text-red-400 sm:text-4xl"
                  : "font-bora text-3xl font-black italic tabular-nums text-bora sm:text-4xl"
              }
            >
              {falta === null ? "--" : String(p.n).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-white/50">{p.rotulo}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-white/60">
        Prazo da {PARCEIRA} para estas condições: <strong className="text-white">{PRAZO_LEGIVEL}</strong> (horário de
        Brasília).
      </p>
    </div>
  );
}
