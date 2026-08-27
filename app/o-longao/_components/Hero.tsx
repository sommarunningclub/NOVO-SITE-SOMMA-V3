"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { EVENTO, LINKS } from "@/lib/o-longao/config";
import { HERO, HERO_MAQUINA } from "@/lib/o-longao/copy";
import { track } from "@/lib/o-longao/analytics";
import { clockDrift, EASE, gsap, isLowPower, maskReveal, useScope } from "../_motion";
import { FitLines } from "./FitLines";
import { Logos } from "./Logos";
import { StarTracLogo } from "./StarTracLogo";

/**
 * Primeira dobra: a máquina é o herói.
 *
 * A imponência não vem de escurecer mais o fundo: vem de dar escala física ao
 * equipamento. No desktop as esteiras entram como uma lâmina fotográfica que
 * ocupa a lateral direita inteira do primeiro terço até o pé da dobra, e a
 * ficha técnica fica parafusada na borda esquerda dela. A Star Trac não é uma
 * logo no rodapé da dobra: é o bloco que explica por que uma esteira comum não
 * atravessa 24 horas, e a logo aparece dentro do argumento.
 *
 * As três marcas ganham uma barra de crédito logo abaixo do título, no lugar
 * onde um cartaz de propriedade esportiva coloca o billing: REALIZAÇÃO à
 * esquerda, POWERED BY à direita e, ligando as duas, a régua das 24 horas.
 *
 * Mobile tem composição própria: sem lâmina lateral e sem vídeo. O bloco da
 * máquina vira um dossiê único (foto em cima, ficha embaixo) e o vídeo nem
 * chega a existir no DOM visível, então nenhum byte de mp4 nem de poster
 * disputa banda com a foto, que é o LCP da tela pequena.
 *
 */

/** A mesma foto serve a lâmina do desktop e o dossiê do mobile. */
const MAQUINA_SRC = "/desafio-esteiras-evolve/img/hero-esteira.jpg";
const MAQUINA_ALT =
  "Esteiras Star Trac lado a lado com os painéis acesos, um atleta correndo na unidade Evolve";
/**
 * `sizes` idêntico nos dois <Image>: em qualquer largura os dois resolvem para
 * o MESMO candidato do srcset, então o navegador baixa um arquivo só, mesmo
 * com um dos elementos escondido pelo breakpoint.
 */
const MAQUINA_SIZES = "(min-width: 1024px) 42vw, 92vw";

export function Hero() {
  const video = useRef<HTMLVideoElement>(null);
  const relogio = useRef<HTMLSpanElement>(null);

  const root = useScope<HTMLElement>(({ root, mm }) => {
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });

    const linhas = maskReveal(root.querySelectorAll<HTMLElement>(".js-hero-line > *"), {
      duration: 1.2,
    });
    if (linhas) tl.add(linhas, 0);

    tl.fromTo(
      root.querySelectorAll<HTMLElement>(".js-hero-fade"),
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.07 },
      "-=0.75"
    )
      // As duas hairlines do billing se desenham da esquerda: a barra de
      // crédito "abre" em vez de simplesmente aparecer.
      .fromTo(
        root.querySelectorAll<HTMLElement>(".js-hero-rule"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          ease: "power4.inOut",
          transformOrigin: "left center",
          stagger: 0.08,
        },
        "-=1"
      )
      .fromTo(
        root.querySelector(".js-hero-painel"),
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "power4.inOut" },
        "-=1"
      );

    /**
     * A máquina entra por varredura, na direção em que ela ocupa a tela: da
     * direita para dentro no desktop (é uma lâmina lateral), de cima para
     * baixo no mobile (é uma faixa horizontal).
     */
    mm.add(
      { desktop: "(min-width: 1024px)", mobile: "(max-width: 1023.98px)" },
      (ctx) => {
        const desktop = ctx.conditions?.desktop === true;
        const alvos = root.querySelectorAll<HTMLElement>(".js-hero-maquina");
        if (!alvos.length) return;
        gsap.fromTo(
          alvos,
          { clipPath: desktop ? "inset(0% 0% 0% 100%)" : "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.45,
            ease: "power4.inOut",
            delay: 0.12,
          }
        );
      }
    );

    // Parallax só onde há folga de GPU (isLowPower já corta abaixo de 768px).
    if (!isLowPower()) {
      gsap.to(root.querySelector(".js-hero-bg"), {
        yPercent: 10,
        scale: 1.05,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      gsap.to(root.querySelectorAll<HTMLElement>(".js-hero-maquina-img"), {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }
  });

  // Um mostrador só agora: o relógio deixou de ser o protagonista da dobra e
  // virou o sinal de vida do painel da máquina.
  useEffect(() => {
    const el = relogio.current;
    if (!el) return;
    return clockDrift(el);
  }, []);

  /**
   * O vídeo existe só a partir de `lg`. No mobile o wrapper está em
   * `display:none`, então `offsetParent` é null, nenhum src é atribuído e o
   * poster também não é buscado: a foto da máquina fica sozinha como LCP.
   */
  useEffect(() => {
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conexao?.saveData) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const v = video.current;
    if (!v || v.offsetParent === null) return;
    v.src = "/desafio-esteiras-evolve/hero.mp4";
    v.play().catch(() => {});
  }, []);

  return (
    <section
      ref={root}
      className="lgo-grain relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pb-10 pt-20 lg:pb-12 lg:pt-24"
      aria-labelledby="hero-titulo"
    >
      {/* Atmosfera: no desktop o vídeo da madrugada; em qualquer tela os halos. */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="js-hero-bg absolute inset-0 hidden lg:block">
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="none"
            poster="/desafio-esteiras-evolve/hero-poster.jpg"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover object-[38%_center] opacity-60"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0.92)_0%,rgba(5,5,8,0.62)_38%,rgba(5,5,8,0.96)_100%)]" />
        <div
          className="lgo-glow left-[-14%] top-[6%] h-[46vh] w-[46vh]"
          style={{ background: "var(--somma)", opacity: 0.2 }}
        />
        <div
          className="lgo-glow bottom-[-10%] right-[-4%] h-[38vh] w-[38vh]"
          style={{ background: "var(--sinal)", opacity: 0.12 }}
        />
      </div>

      <div className="lgo-lanes -z-10 hidden lg:block" aria-hidden />

      {/*
        A LÂMINA (desktop). Sangra na direita e no pé da dobra: a fileira de
        esteiras não "termina", ela continua para dentro da página. Começa em
        30% da altura para não brigar com a headline, que fica em largura cheia.

        Em cada breakpoint só UMA das duas fotos está renderizada (esta ou a do
        dossiê mobile), então as duas carregam o alt de verdade sem duplicar
        leitura no leitor de tela.
      */}
      <div className="js-hero-maquina absolute bottom-0 right-0 top-[30%] -z-[5] hidden w-[42%] overflow-hidden lg:block xl:w-[38%]">
        <div className="js-hero-maquina-img absolute inset-x-0 -bottom-[7%] -top-[7%]">
          <Image
            src={MAQUINA_SRC}
            alt={MAQUINA_ALT}
            fill
            sizes={MAQUINA_SIZES}
            className="object-cover object-[62%_38%]"
          />
        </div>
        {/* Dissolve na borda esquerda: a foto entra na noite em vez de ser colada nela. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--noite)_0%,rgba(5,5,8,0.72)_18%,rgba(5,5,8,0.1)_54%,rgba(5,5,8,0)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--noite)_0%,rgba(5,5,8,0)_22%)]" />
        <span className="absolute inset-y-0 left-0 w-px bg-[color:var(--line)]" />
      </div>

      <div className="lgo-wrap relative">
        <p className="js-hero-fade lgo-label flex flex-wrap items-center gap-x-3 gap-y-2 text-[color:rgba(242,240,236,0.72)]">
          <span aria-hidden className="inline-block h-1.5 w-1.5 bg-[color:var(--sinal)]" />
          {HERO.kicker}
          <span aria-hidden className="inline-block h-3 w-px bg-[color:var(--line)]" />
          {EVENTO.cidade} {EVENTO.uf}
          <span aria-hidden className="inline-block h-3 w-px bg-[color:var(--line)]" />
          {EVENTO.final.janela}
        </p>

        {/* Headline em largura total: o título divide a dobra com a máquina,
            passando por cima da borda superior da lâmina. */}
        <h1 id="hero-titulo" className="mt-4 md:mt-5">
          <FitLines linhas={HERO.titulo} maskClass="js-hero-line" max="16rem" min="2.4rem" />
        </h1>

        <p className="js-hero-fade lgo-display lgo-display-condensed mt-4 text-[clamp(1.4rem,5.2vw,2.9rem)] text-[color:var(--sinal)] md:mt-5">
          {HERO.mote}
        </p>

        {/*
          BARRA DE CRÉDITO. É a resposta direta ao "deixar claro as marcas":
          quem realiza e quem equipa a prova, em marca e não em texto,
          antes de qualquer parágrafo. A régua de 24 horas liga os dois lados.
        */}
        <div className="js-hero-fade mt-7 lg:mt-9">
          <div className="js-hero-rule lgo-hairline" />
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 py-4 lg:py-5">
            <div>
              <p className="lgo-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">
                {HERO.rotuloRealizacao}
              </p>
              <Logos altura={22} className="md:hidden" />
              <Logos altura={30} className="hidden md:flex" />
            </div>

            <div aria-hidden className="hidden flex-1 self-end pb-2.5 lg:block">
              <div className="lgo-hours opacity-60" />
            </div>

            <div>
              <p className="lgo-label mb-2.5 text-[color:var(--sinal)]">{HERO.rotuloMaster}</p>
              <StarTracLogo altura={17} className="md:hidden" />
              <StarTracLogo altura={24} className="hidden md:block" />
            </div>
          </div>
          <div className="js-hero-rule lgo-hairline" />
        </div>

        {/*
          Grade da dobra.

          A ordem do DOM é a ordem do MOBILE: promessa, CTA, máquina,
          convocação. O CTA vem antes do painel de propósito — o painel é alto,
          e deixá-lo na frente empurraria "INSCREVA SUA CREW" para bem longe da
          primeira tela do celular.

          No desktop nada disso vale: as posições são explícitas
          (`lg:row-start-*`, `lg:col-start-*`), então a ficha da máquina volta
          para a direita, por cima da lâmina, e o texto fica à esquerda.
        */}
        <div className="mt-7 grid gap-7 lg:mt-9 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:gap-y-6">
          <p className="js-hero-fade max-w-[42ch] text-[clamp(1rem,2.6vw,1.2rem)] leading-relaxed text-[color:var(--cinza)] lg:col-span-7 lg:col-start-1 lg:row-start-1">
            {HERO.frase}
          </p>

          <div className="js-hero-fade flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <Link
              href={LINKS.inscricao}
              onClick={() => track("begin_registration", { origem: "hero" })}
              className="lgo-btn lgo-pulse sm:flex-1 lg:!min-h-[68px] lg:!text-[1.05rem]"
            >
              {HERO.ctaPrimario}
            </Link>
            <a
              href="#desafio"
              className="lgo-btn lgo-btn--ghost sm:flex-1 lg:!min-h-[68px] lg:!text-[1.05rem]"
            >
              {HERO.ctaSecundario}
            </a>
          </div>

          {/* ── A MÁQUINA ─────────────────────────────────────────────────
              No desktop é a ficha parafusada na lâmina. No mobile é um
              dossiê fechado: foto em cima, ficha embaixo, tudo num objeto só. */}
          <div className="js-hero-painel lgo-panel lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1">
            <div className="js-hero-maquina relative h-[clamp(150px,22svh,210px)] w-full overflow-hidden lg:hidden">
              <Image
                src={MAQUINA_SRC}
                alt={MAQUINA_ALT}
                fill
                priority
                sizes={MAQUINA_SIZES}
                className="object-cover object-[58%_42%]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,8,0.55)_0%,rgba(5,5,8,0.05)_45%,rgba(5,5,8,0.85)_100%)]" />
            </div>

            <div className="flex items-center justify-between gap-3 border-y border-[color:var(--line)] px-4 py-3 lg:border-t-0">
              <span className="lgo-label flex items-center gap-2 text-[color:var(--sinal)]">
                <span
                  aria-hidden
                  className="block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--sinal)]"
                />
                {HERO_MAQUINA.rotulo}
              </span>
              <span ref={relogio} aria-hidden className="lgo-clock text-[0.95rem]">
                {HERO.relogio}
              </span>
            </div>

            <div className="px-4 py-5 sm:px-5">
              <StarTracLogo altura={22} />
              <p className="lgo-mono mt-3 text-[0.62rem] uppercase leading-[1.7] tracking-[0.2em] text-[color:rgba(242,240,236,0.5)]">
                {HERO_MAQUINA.selo}
              </p>

              <p className="lgo-display lgo-display-condensed mt-4 text-[clamp(1.2rem,4vw,1.55rem)]">
                {HERO_MAQUINA.chamada}
              </p>
              <p className="mt-3 text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
                {HERO_MAQUINA.texto}
              </p>

              {/* Âmbar é cronometragem, então o link do sponsor fica em papel. */}
              <a
                href="#star-trac"
                className="lgo-label mt-3 inline-flex min-h-[44px] items-center gap-2 text-[color:var(--papel)]"
              >
                {HERO_MAQUINA.cta}
                <span aria-hidden className="text-[color:var(--sinal)]">
                  &rarr;
                </span>
              </a>
            </div>

            <dl className="grid grid-cols-3 border-t border-[color:var(--line)]">
              {HERO_MAQUINA.specs.map((spec, i) => (
                <div
                  key={spec.rotulo}
                  className={`px-3 py-3.5 ${i > 0 ? "border-l border-[color:var(--line)]" : ""}`}
                >
                  <dt className="lgo-label text-[0.55rem] text-[color:rgba(242,240,236,0.45)]">
                    {spec.rotulo}
                  </dt>
                  <dd className="lgo-num mt-1.5 text-[0.78rem] font-bold leading-tight">
                    {spec.valor}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="js-hero-fade lgo-mono max-w-[52ch] text-[0.75rem] uppercase leading-[1.7] tracking-[0.14em] text-[color:rgba(242,240,236,0.55)] lg:col-span-7 lg:col-start-1 lg:row-start-3">
            {HERO.convocacao}
          </p>
        </div>
      </div>
    </section>
  );
}
