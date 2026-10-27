"use client";

import { useEffect, useRef, useState } from "react";
import { movimentoReduzido } from "@/lib/dexcomplica-love-run/motion";

/**
 * Trecho de 4 s do vídeo oficial da Dexcomplica, sem som, em loop.
 *
 * Só baixa quando chega perto da tela (preload="none" + IntersectionObserver)
 * e pausa ao sair. Com reduced-motion fica no pôster, com um botão para
 * tocar se a pessoa quiser.
 */
export default function VideoFesta() {
  const ref = useRef<HTMLVideoElement>(null);
  const [parado, setParado] = useState(false);
  // Pausado pela pessoa fica pausado: rolar de volta não religa.
  const pausouAMao = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (movimentoReduzido()) {
      setParado(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!pausouAMao.current) v.play().catch(() => setParado(true));
        }
        else v.pause();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const alternarVideo = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      pausouAMao.current = false;
      v.play().then(() => setParado(false)).catch(() => {});
    } else {
      pausouAMao.current = true;
      v.pause();
      setParado(true);
    }
  };

  return (
    <figure className="lr-video" data-tilt="6">
      <video
        onClick={alternarVideo}
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster="/dexcomplica-love-run/video/dex-festa-poster.jpg"
        aria-label="Trecho da festa Dexcomplica: convidados no painel de corações e o letreiro do mascote"
      >
        <source src="/dexcomplica-love-run/video/dex-festa.mp4" type="video/mp4" />
      </video>
      {parado ? (
        <button type="button" className="lr-video__play" onClick={alternarVideo}>
          Tocar vídeo
        </button>
      ) : null}
    </figure>
  );
}
