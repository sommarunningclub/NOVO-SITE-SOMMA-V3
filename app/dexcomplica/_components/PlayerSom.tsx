"use client";

import { useEffect } from "react";
import { alternar, iniciarSomAmbiente, useSom } from "@/lib/dexcomplica-love-run/som";

/**
 * O player do som: equalizador que dança enquanto toca, toque para pausar
 * ou ligar. `iniciar` liga o som ambiente (uma vez por visita).
 */
export default function PlayerSom({ iniciar = true, className = "" }: { iniciar?: boolean; className?: string }) {
  const estado = useSom();
  const tocando = estado === "tocando";

  useEffect(() => {
    if (iniciar) iniciarSomAmbiente();
  }, [iniciar]);

  return (
    <button
      type="button"
      data-som
      className={`lr-som ${className}`}
      data-estado={estado}
      aria-pressed={tocando}
      aria-label={tocando ? "Pausar o som da Dexcomplica" : "Tocar o som da Dexcomplica"}
      onClick={() => alternar()}
    >
      <span className="lr-som__eq" aria-hidden="true">
        <span /><span /><span /><span />
      </span>
      <span className="lr-som__rotulo" aria-hidden="true">
        {tocando ? "Pausar" : estado === "aguardando" ? "Toque para ouvir" : "Som"}
      </span>
    </button>
  );
}
