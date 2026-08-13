"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { COPY, EVENT, EVENT_PATH, EVENT_LABELS, inscricoesAbertas } from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { EASE, gsap, isLowPower, useScope } from "../_motion";
import { Countdown } from "./Countdown";
import { FitLines } from "./FitLines";

/**
 * Primeira dobra.
 *
 * Duas composições de verdade, não um desktop encolhido:
 * - mobile  → o vídeo da esteira é o próprio fundo da tela, tipografia empilhada;
 * - desktop → foto full-bleed, headline ocupando a largura inteira e um painel
 *             de telemetria com o vídeo encaixado, como o display de uma esteira.
 *
 * Em ambos o poster do vídeo é quem entra no LCP: o vídeo só começa a baixar
 * depois, e nunca em conexão econômica.
 */
export function Hero() {
  const videoMobile = useRef<HTMLVideoElement>(null);
  const videoDesktop = useRef<HTMLVideoElement>(null);

  const root = useScope<HTMLElement>(({ root }) => {
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });

    tl.fromTo(
      root.querySelectorAll<HTMLElement>(".hero-mask > *"),
      { yPercent: 105 },
      { yPercent: 0, duration: 1.25, stagger: 0.09 }
    )
      .fromTo(
        root.querySelectorAll<HTMLElement>(".hero-fade"),
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 },
        "-=0.75"
      )
      .fromTo(
        root.querySelector(".hero-panel"),
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut" },
        "-=1.1"
      );

    // Parallax do fundo — só no desktop, onde há folga de GPU.
    if (!isLowPower()) {
      gsap.to(root.querySelector(".hero-bg"), {
        yPercent: 10,
        scale: 1.05,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }
  });

  /**
   * O vídeo é decoração: se o autoplay for barrado, se a pessoa pediu menos
   * movimento ou se o navegador sinaliza economia de dados, o poster já conta a
   * história e nenhum byte de vídeo é baixado.
   */
  useEffect(() => {
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conexao?.saveData) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    for (const ref of [videoMobile, videoDesktop]) {
      const v = ref.current;
      if (!v || v.offsetParent === null) continue; // escondido no breakpoint atual
      v.src = "/desafio-esteiras-evolve/hero.mp4";
      v.play().catch(() => {});
    }
  }, []);

  const abertas = inscricoesAbertas();
  const videoProps = {
    muted: true,
    loop: true,
    playsInline: true,
    preload: "none" as const,
    poster: "/desafio-esteiras-evolve/hero-poster.jpg",
    "aria-hidden": true,
    tabIndex: -1,
  };

  return (
    <section
      ref={root}
      className="dst-grain relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-10 pt-20 md:justify-center md:pb-16 md:pt-24"
      aria-labelledby="hero-titulo"
    >
      {/* Fundo — vídeo no mobile, fotografia no desktop */}
      <div className="hero-bg absolute inset-0 -z-10">
        <video
          ref={videoMobile}
          {...videoProps}
          className="absolute inset-0 h-full w-full object-cover object-[58%_center] md:hidden"
        />
        <Image
          src="/desafio-esteiras-evolve/img/hero-esteira.jpg"
          alt=""
          fill
          priority
          quality={75}
          sizes="100vw"
          className="hidden object-cover object-center md:block"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.86)_0%,rgba(8,8,10,0.42)_34%,rgba(8,8,10,0.94)_100%)]" />
        <div
          className="dst-glow left-[-12%] top-[6%] h-[42vh] w-[42vh]"
          style={{ background: "var(--evolve)", opacity: 0.32 }}
        />
        <div
          className="dst-glow bottom-[-6%] right-[-8%] h-[36vh] w-[36vh]"
          style={{ background: "var(--somma)", opacity: 0.2 }}
        />
      </div>

      <div className="dst-lanes -z-10 hidden md:block" />

      <div className="dst-wrap relative">
        <p className="hero-fade dst-label mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[color:rgba(242,240,236,0.75)] md:mb-5">
          <span className="inline-flex items-center gap-2 bg-[color:var(--evolve)] px-2.5 py-1.5 text-[color:var(--white)]">
            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
            {EVENT_LABELS[EVENT.status]}
          </span>
          <span>Evolve + SOMMA Club</span>
        </p>

        {/* Headline em largura total: cada linha se dimensiona pelo próprio comprimento */}
        <h1 id="hero-titulo">
          <FitLines linhas={COPY.headline} maskClass="hero-mask" max="15rem" min="2rem" />
        </h1>

        <p className="hero-fade dst-display dst-display-condensed mt-5 text-[clamp(1.05rem,4vw,2rem)] text-[color:var(--somma)]">
          {COPY.sub}
        </p>

        <div className="mt-7 grid gap-8 md:mt-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7 lg:col-span-6">
            {/* Faixa de dados — o "painel" do evento */}
            <dl className="hero-fade flex items-stretch border-y border-[color:var(--line)]">
              {[
                { k: "Data", v: EVENT.dataLabel },
                { k: "Início", v: EVENT.horaLabel },
                { k: "Unidades", v: "04" },
              ].map((c, i) => (
                <div
                  key={c.k}
                  className={`min-w-0 flex-1 py-3.5 md:py-4 ${
                    i === 0 ? "pr-4" : "px-4"
                  } ${i < 2 ? "border-r border-[color:var(--line)]" : ""}`}
                >
                  <dt className="dst-label mb-2 truncate text-[color:rgba(242,240,236,0.45)]">{c.k}</dt>
                  <dd className="dst-num text-[clamp(1.2rem,4.5vw,1.9rem)] font-bold leading-none">
                    {c.v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="hero-fade mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {abertas ? (
                <>
                  <Link
                    href={`${EVENT_PATH}/inscricao`}
                    onClick={() => track("begin_registration", { origem: "hero" })}
                    className="dst-btn dst-pulse sm:flex-1"
                  >
                    {COPY.ctaPrimario}
                  </Link>
                  <a href="#unidades" className="dst-btn dst-btn--ghost sm:flex-1">
                    {COPY.ctaSecundario}
                  </a>
                </>
              ) : (
                <a href="#unidades" className="dst-btn dst-btn--ghost">
                  Conhecer o desafio
                </a>
              )}
            </div>

            <p className="hero-fade dst-label mt-4 flex items-start gap-2 leading-relaxed text-[color:rgba(242,240,236,0.55)]">
              <span className="mt-[0.35em] block h-1 w-1 shrink-0 animate-pulse rounded-full bg-[color:var(--somma)]" />
              <span style={{ color: "var(--somma)" }}>{COPY.vagasAviso}</span>
            </p>

            <div className="hero-fade mt-7 max-w-[460px]">
              <p className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">
                Contagem para a largada
              </p>
              <Countdown />
            </div>
          </div>

          {/* Painel de telemetria com o vídeo — desktop */}
          <div className="hidden md:col-span-5 md:block lg:col-span-6">
            <div className="hero-panel dst-panel ml-auto max-w-[320px]">
              <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-2.5">
                <span className="dst-label text-[color:var(--somma)]">● LIVE FEED</span>
                <span className="dst-label text-[color:rgba(242,240,236,0.4)]">EVOLVE</span>
              </div>
              <div className="relative aspect-[9/13] overflow-hidden">
                <video
                  ref={videoDesktop}
                  {...videoProps}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(8,8,10,0.85)_100%)]" />
              </div>
              <div className="grid grid-cols-3 divide-x divide-[color:var(--line)] border-t border-[color:var(--line)]">
                {[
                  { k: "Unidades", v: "04" },
                  { k: "Data", v: EVENT.dataLabel },
                  { k: "Largada", v: EVENT.horaLabel },
                ].map((c) => (
                  <div key={c.k} className="px-2 py-3 text-center">
                    <span className="dst-num block text-base font-bold leading-none">{c.v}</span>
                    <span className="dst-label mt-1.5 block text-[0.48rem] text-[color:rgba(242,240,236,0.4)]">
                      {c.k}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
