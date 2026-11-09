"use client";

import { useRef, useState } from "react";

/** Os dois desafios do Yann, um depois do outro, em loop. */
const CLIPES = [
  { src: "/boracomsomma/videos/desafio-estadio.mp4", poster: "/boracomsomma/videos/desafio-estadio.jpg" },
  { src: "/boracomsomma/videos/desafio-hyrox.mp4", poster: "/boracomsomma/videos/desafio-hyrox.jpg" },
] as const;

export function VideoHero({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [atual, setAtual] = useState(0);

  function proximo() {
    const v = ref.current;
    if (!v) return;
    const i = (atual + 1) % CLIPES.length;
    setAtual(i);
    v.src = CLIPES[i].src;
    v.poster = CLIPES[i].poster;
    v.play().catch(() => {});
  }

  return (
    <video
      ref={ref}
      className={className}
      src={CLIPES[0].src}
      poster={CLIPES[0].poster}
      onEnded={proximo}
      autoPlay
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
