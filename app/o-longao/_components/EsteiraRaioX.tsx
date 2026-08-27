"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ESTEIRA } from "@/lib/o-longao/config";
import { STAR_TRAC } from "@/lib/o-longao/copy";
import { prefersReducedMotion } from "../_motion";

/**
 * A FreeRunner por dentro: vista explodida em loop, ao lado dos argumentos.
 *
 * É a prova visual do que os três argumentos afirmam: as camadas do deck, os
 * blocos hexagonais do HexDeck e o motor aparecem separados no ar. Por isso o
 * painel mora nesta posição e não na faixa cinematográfica: aqui ele ilustra,
 * lá a máquina é protagonista.
 *
 * O vídeo só recebe `src` quando o painel se aproxima da tela: são 5 MB que
 * quem não chega até aqui não deveria baixar. Com `saveData` ligado entra a
 * foto lateral no lugar; com reduced-motion o primeiro frame fica parado.
 *
 * Diferente da faixa, este vídeo fica dentro de um painel opaco: o fundo dele
 * é um estúdio cinza com luz, não preto sólido, então o blend de tela que
 * apaga o fundo do outro deixaria este esbranquiçado.
 */
export function EsteiraRaioX() {
  const video = useRef<HTMLVideoElement>(null);
  const [semVideo, setSemVideo] = useState(false);

  useEffect(() => {
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conexao?.saveData) {
      setSemVideo(true);
      return;
    }
    const v = video.current;
    if (!v) return;

    const io = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        if (!v.getAttribute("src")) {
          v.src = ESTEIRA.videoRaioX;
          if (!prefersReducedMotion()) v.play().catch(() => {});
        }
        io.disconnect();
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="lgo-panel relative flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--line)] px-4 py-3">
        <span className="lgo-label flex items-center gap-2 text-[color:var(--sinal)]">
          <span aria-hidden className="block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--sinal)]" />
          {STAR_TRAC.raioX.kicker}
        </span>
        <span className="lgo-label text-[color:rgba(242,240,236,0.4)]">{ESTEIRA.modelo}</span>
      </div>

      <div className="relative aspect-[1178/786] w-full bg-black">
        {semVideo ? (
          <Image
            src={ESTEIRA.imagens.lateralEsq}
            alt={`${ESTEIRA.nomeCompleto} vista pela lateral`}
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-contain p-4"
          />
        ) : (
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="none"
            poster={ESTEIRA.posterRaioX}
            tabIndex={-1}
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      <figcaption className="px-4 py-4 text-[0.85rem] leading-relaxed text-[color:rgba(242,240,236,0.65)] sm:px-5">
        {STAR_TRAC.raioX.legenda}
      </figcaption>
    </figure>
  );
}
