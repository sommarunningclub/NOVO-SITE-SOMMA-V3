"use client";

import { useEffect, useState } from "react";

const PLAYLIST = "1WcGzf4bGvcyfo2znZTyxl";
/** Compacto (152) + autoplay: o player oficial do Spotify. */
const EMBED =
  `https://open.spotify.com/embed/playlist/${PLAYLIST}` +
  `?utm_source=generator&theme=0&autoplay=1`;

/**
 * Mini player flutuante. O iframe fica montado o tempo todo para a música
 * continuar mesmo com o painel recolhido; o gesto do login ajuda o autoplay.
 */
export default function PlayerSom() {
  const [aberto, setAberto] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setPronto(true);
  }, []);

  return (
    <aside className={`cr-som${aberto ? " is-aberto" : ""}`} aria-label="Trilha sonora">
      <button
        type="button"
        className="cr-som__pill"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="cr-som-caixa"
      >
        <span className="cr-som__eq" aria-hidden="true"><i /><i /><i /></span>
        {aberto ? "Fechar" : "Trilha"}
      </button>

      <div className="cr-som__caixa" id="cr-som-caixa" aria-hidden={!aberto}>
        {pronto ? (
          <iframe
            data-testid="embed-iframe"
            title="Playlist da comunidade"
            src={EMBED}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            loading="eager"
            tabIndex={aberto ? 0 : -1}
          />
        ) : null}
      </div>
    </aside>
  );
}
