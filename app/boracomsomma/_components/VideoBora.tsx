"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

/**
 * Vídeo vertical da BORA. Começa mudo quando entra na tela (sem baixar nada
 * antes disso) e o toque liga o som.
 */
export function VideoBora({ src, poster, titulo }: { src: string; poster: string; titulo: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mudo, setMudo] = useState(true);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.4 },
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  function alternarSom() {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMudo(v.muted);
    if (v.paused) v.play().catch(() => {});
  }

  return (
    <figure className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        className="aspect-[9/16] w-full object-cover"
        aria-label={titulo}
      />
      <button
        type="button"
        onClick={alternarSom}
        className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 text-left"
        aria-label={mudo ? `Ligar o som: ${titulo}` : `Desligar o som: ${titulo}`}
      >
        <figcaption className="font-bora text-lg font-black uppercase italic leading-tight">{titulo}</figcaption>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bora text-black">
          {!tocando ? <Play className="h-5 w-5" /> : mudo ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </span>
      </button>
    </figure>
  );
}
