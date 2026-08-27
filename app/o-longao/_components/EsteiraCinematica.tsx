"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ESTEIRA } from "@/lib/o-longao/config";
import { STAR_TRAC } from "@/lib/o-longao/copy";
import { EASE, gsap, isLowPower, prefersReducedMotion, useScope } from "../_motion";

/**
 * A FreeRunner em movimento, comandada pelo scroll.
 *
 * Dois regimes, um DOM só:
 *
 * Desktop com folga de GPU: a faixa fixa na tela por um trecho de scroll e o
 * progresso da rolagem vira `currentTime` do vídeo. O quadro cresce de 72%
 * até a largura toda enquanto isso, e a legenda sai de cena para deixar a
 * máquina sozinha no fim. Ao sair da faixa (para baixo ou para cima), o loop
 * retoma: a máquina nunca fica congelada num frame.
 *
 * Celular, aparelho fraco ou reduced-motion: sem pin e sem scrub. O vídeo
 * roda em loop e o quadro só entra por reveal. Com `saveData` ligado o vídeo
 * nem existe: entra a foto principal no lugar.
 *
 * O scrub escreve `currentTime` num proxy e não no elemento direto porque a
 * duração só é conhecida depois de `loadedmetadata`, e o build do useScope
 * roda antes disso. Multiplicar na hora do update resolve sem timing.
 */
export function EsteiraCinematica() {
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
    /*
      Só o desktop com scrub precisa do arquivo inteiro antes da hora: sem ele
      buferizado, arrastar o scroll para o meio do vídeo trava esperando rede.
      No celular o loop começa a tocar com o que já chegou, e 4 MB a mais de
      pré-carga num plano de dados não se justificam.
    */
    const scrubPossivel = window.matchMedia("(min-width: 1024px)").matches && !isLowPower();
    v.preload = scrubPossivel ? "auto" : "metadata";
    // Reduced-motion: primeiro frame parado, sem loop.
    if (prefersReducedMotion()) return;
    v.play().catch(() => {});
  }, []);

  const root = useScope<HTMLElement>(({ root, mm }) => {
    const quadro = root.querySelector<HTMLElement>(".ecv-quadro");
    const barra = root.querySelector<HTMLElement>(".ecv-barra");
    const legenda = root.querySelectorAll<HTMLElement>(".ecv-legenda");
    const dica = root.querySelector<HTMLElement>(".ecv-dica");
    if (!quadro) return;

    mm.add(
      { desktop: "(min-width: 1024px)", mobile: "(max-width: 1023.98px)" },
      (ctx) => {
        const scrub = ctx.conditions?.desktop === true && !isLowPower();

        if (!scrub) {
          gsap.fromTo(
            quadro,
            { clipPath: "inset(10% 4% 10% 4%)", opacity: 0.5 },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              opacity: 1,
              duration: 1.3,
              ease: EASE.out,
              scrollTrigger: { trigger: root, start: "top 78%", once: true },
            }
          );
          gsap.fromTo(
            legenda,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              stagger: 0.08,
              ease: EASE.soft,
              scrollTrigger: { trigger: root, start: "top 70%", once: true },
            }
          );
          return;
        }

        const v = video.current;
        const progresso = { t: 0 };
        let scrubAtivo = false;

        const entrar = () => {
          scrubAtivo = true;
          v?.pause();
        };
        const sair = () => {
          scrubAtivo = false;
          if (v && !prefersReducedMotion()) v.play().catch(() => {});
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=2000",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: entrar,
            onEnterBack: entrar,
            onLeave: sair,
            onLeaveBack: sair,
          },
        });

        // O quadro cresce até tomar a tela; a legenda vai embora no primeiro terço.
        tl.fromTo(quadro, { scale: 0.72 }, { scale: 1, ease: "none", duration: 1 }, 0)
          .to(legenda, { opacity: 0, y: -40, ease: "none", duration: 0.35 }, 0)
          .to(dica, { opacity: 0, ease: "none", duration: 0.15 }, 0);

        if (barra) tl.fromTo(barra, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);

        // O scroll vira tempo de vídeo.
        tl.to(
          progresso,
          {
            t: 1,
            ease: "none",
            duration: 1,
            onUpdate: () => {
              if (!scrubAtivo || !v || !Number.isFinite(v.duration)) return;
              // um pelo menos: no fim exato o Safari pula para o primeiro frame do loop
              v.currentTime = Math.min(progresso.t * v.duration, v.duration - 0.05);
            },
          },
          0
        );
      }
    );
  });

  return (
    <section
      ref={root}
      className="relative flex h-[68svh] min-h-[420px] items-center justify-center overflow-hidden lg:h-[100svh]"
      aria-label={`${ESTEIRA.nomeCompleto} em movimento`}
    >
      {/* Luz de stand: é isto que aparece "atrás" da máquina quando o preto do vídeo some. */}
      <div
        aria-hidden
        className="lgo-glow left-1/2 top-[58%] h-[55%] w-[60%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "var(--sinal)", opacity: 0.14 }}
      />
      <div
        aria-hidden
        className="lgo-glow left-[30%] top-[40%] h-[40%] w-[30%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "var(--somma)", opacity: 0.08 }}
      />

      {/*
        O quadro: proporção do vídeo, escala sob o scrub. `max-h` segura em
        tela baixa (1440×900 daria 961px de altura); o `object-cover` absorve
        a diferença cortando um pouco em cima e embaixo.

        Sem fundo nem borda de painel de propósito: o vídeo vem em ProRes 422,
        que não tem canal alfa, então o "sem fundo" dele é preto sólido gravado.
        Com `mix-blend-mode: screen` o preto vira transparente de fato e a
        máquina flutua sobre o halo âmbar da seção. Um painel opaco atrás
        mataria exatamente esse efeito.
      */}
      <div className="ecv-quadro relative aspect-[1178/786] max-h-[86svh] w-full max-w-[1440px] origin-center">
        {semVideo ? (
          <Image
            src={ESTEIRA.imagens.principal}
            alt={ESTEIRA.nomeCompleto}
            fill
            sizes="100vw"
            className="object-contain p-8"
          />
        ) : (
          <video
            ref={video}
            src={ESTEIRA.video}
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ mixBlendMode: "screen" }}
          />
        )}

        {/* Legenda sobre o vídeo, no canto inferior esquerdo. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(5,5,8,0)_0%,rgba(5,5,8,0.85)_100%)] p-5 sm:p-7 md:p-9">
          <p className="ecv-legenda lgo-label text-[color:var(--sinal)]">{STAR_TRAC.video.kicker}</p>
          <p className="ecv-legenda lgo-display lgo-display-condensed mt-2 text-[clamp(1.6rem,5vw,3.4rem)]">
            {ESTEIRA.modelo}
          </p>
          <p className="ecv-legenda lgo-mono mt-2 max-w-[48ch] text-[0.8rem] uppercase leading-[1.6] tracking-[0.12em] text-[color:rgba(242,240,236,0.6)]">
            {STAR_TRAC.video.legenda}
          </p>
        </div>

        {/* Dica de scroll (só faz sentido onde o scroll comanda). */}
        <p className="ecv-dica lgo-label absolute right-5 top-5 hidden items-center gap-2 text-[color:rgba(242,240,236,0.5)] lg:flex sm:right-7 sm:top-7">
          {STAR_TRAC.video.dica}
          <span aria-hidden className="block h-3 w-px animate-pulse bg-[color:var(--sinal)]" />
        </p>

        {/* Régua de progresso: o scroll enchendo a barra é o vídeo avançando. */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden">
          <div aria-hidden className="ecv-barra h-full w-full origin-left" style={{ background: "var(--timing)" }} />
        </div>
      </div>
    </section>
  );
}
