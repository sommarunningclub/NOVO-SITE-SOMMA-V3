"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo em loop, sem áudio, que só roda enquanto está na tela. Os clipes são
 * registros públicos de outros espaços (referências), exibidos como mostra de
 * que o movimento já existe.
 */
export function VideoLoop({
  src,
  poster,
  className = "",
  ratio = "aspect-[9/16]",
}: {
  src: string;
  poster?: string;
  className?: string;
  ratio?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`relative overflow-hidden bg-[#111] ${ratio} ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
