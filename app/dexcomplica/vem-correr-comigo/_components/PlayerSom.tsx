"use client";

import { useEffect, useState } from "react";
import { armarTrilhaNoGesto, trilhaArmada } from "./trilha";

/**
 * Mini player. O áudio mora no host `#cr-trilha-host` (criado no gesto do login);
 * aqui só controlamos o painel visual.
 */
export default function PlayerSom() {
  const [aberto, setAberto] = useState(false);
  const [viva, setViva] = useState(false);

  useEffect(() => {
    if (trilhaArmada()) {
      setViva(true);
      return;
    }
    // Sessão já logada: o 1º toque na página arma o autoplay.
    const armar = () => {
      armarTrilhaNoGesto();
      setViva(true);
      window.removeEventListener("pointerdown", armar, true);
    };
    window.addEventListener("pointerdown", armar, true);
    return () => window.removeEventListener("pointerdown", armar, true);
  }, []);

  return (
    <aside className={`cr-som${aberto ? " is-aberto" : ""}`} aria-label="Trilha sonora">
      <button
        type="button"
        className="cr-som__pill"
        onClick={() => {
          armarTrilhaNoGesto();
          setViva(true);
          setAberto((v) => !v);
        }}
        aria-expanded={aberto}
        aria-controls="cr-trilha-host"
      >
        <span className="cr-som__eq" aria-hidden="true"><i /><i /><i /></span>
        {aberto ? "Fechar" : viva ? "Trilha" : "Tocar"}
      </button>
      {aberto ? (
        <p className="cr-som__nota">Controles do Spotify</p>
      ) : null}
    </aside>
  );
}
