"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  COPY,
  EVENT,
  dataLabel,
  distanciasLabel,
  precoLabel,
  spotsLabel,
} from "@/lib/sunday-social-run/event.config";
import { EASE, gsap, prefersReducedMotion, useScope } from "../_motion";
import { Fit, Label, TicketCta } from "./base";
import { LogoHypeOn, LogoSantaMonica, LogoSomma } from "./Logos";

/**
 * O filme do hero: três quadros da mesma manhã, todos do acervo real do SOMMA
 * no Eixão. Trocam sozinhos, num corte lento — a página abre como um teaser,
 * não como um banner.
 */
const QUADROS = [
  {
    src: "/sunday-social-run/hero-pelotao.jpg",
    alt: "Pelotão do SOMMA Club correndo no Eixão sob os ipês",
    foco: "50% 42%",
  },
  {
    src: "/sunday-social-run/hero-bandeira.jpg",
    alt: "Corredor conduzindo o pelotão do SOMMA Club com a bandeira do clube",
    foco: "50% 38%",
  },
  {
    src: "/sunday-social-run/hero-social.jpg",
    alt: "Dois corredores sorrindo durante a corrida, de braços abertos",
    foco: "50% 35%",
  },
] as const;

/** Tempo de cada quadro no ar. Lento de propósito: o corte não pode competir. */
const DURACAO = 5200;

/**
 * SCENE 01 — a primeira dobra.
 *
 * Uma imagem, um nome, uma linha de dados e um botão. O movimento é todo de
 * respiração: o quadro faz um zoom lento enquanto está no ar, o próximo entra
 * por dissolvência e a tipografia sobe de dentro da máscara uma única vez.
 *
 * A mesma composição serve mobile e desktop — o que muda é a escala e o
 * arranjo da ficha técnica. Sob `prefers-reduced-motion`, o carrossel para no
 * primeiro quadro e nada mais se move.
 */
export function HeroExperience() {
  const [ativo, setAtivo] = useState(0);
  const quadros = useRef<(HTMLDivElement | null)[]>([]);

  const root = useScope<HTMLElement>(({ root, low }) => {
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });

    tl.fromTo(
      root.querySelector(".hero-palco"),
      { clipPath: "inset(14% 8% 14% 8% round 28px)", scale: 1.06 },
      { clipPath: "inset(0% 0% 0% 0% round 0px)", scale: 1, duration: 1.6, ease: EASE.inOut }
    )
      .fromTo(
        root.querySelectorAll<HTMLElement>(".hero-mask > *"),
        { yPercent: 112 },
        { yPercent: 0, duration: 1.35, stagger: 0.1 },
        "-=1.05"
      )
      .fromTo(
        root.querySelectorAll<HTMLElement>(".hero-fade"),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.09 },
        "-=1"
      );

    // Saída: a imagem sobe devagar e escurece, a tipografia sobe mais rápido.
    if (!low) {
      gsap.to(root.querySelector(".hero-palco"), {
        yPercent: 8,
        scale: 1.06,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.7 },
      });
      gsap.to(root.querySelector(".hero-conteudo"), {
        yPercent: -6,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: { trigger: root, start: "40% top", end: "bottom top", scrub: 0.7 },
      });
    }
  });

  /** Troca de quadro: dissolvência longa, sem corte seco. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setAtivo((i) => (i + 1) % QUADROS.length), DURACAO);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    quadros.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { opacity: i === ativo ? 1 : 0, duration: 1.5, ease: "power2.inOut" });
      // Ken Burns: o quadro no ar cresce quase imperceptivelmente.
      if (i === ativo) {
        gsap.fromTo(
          el.querySelector("img"),
          { scale: 1.02 },
          { scale: 1.12, duration: (DURACAO + 1500) / 1000, ease: "none" }
        );
      }
    });
  }, [ativo]);

  const dados = [
    { valor: spotsLabel.toUpperCase(), rotulo: "Vagas" },
    { valor: precoLabel, rotulo: "Ingresso" },
    { valor: dataLabel().toUpperCase(), rotulo: EVENT.cidade },
    { valor: distanciasLabel.toUpperCase(), rotulo: "Pelotões" },
  ];

  return (
    <section
      ref={root}
      id="hero"
      aria-labelledby="hero-titulo"
      className="ris-dark relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden pb-6 pt-[calc(env(safe-area-inset-top)+5.5rem)] md:pb-10 md:pt-28"
    >
      {/* ── O filme ──────────────────────────────────────────────────────── */}
      <div className="hero-palco absolute inset-0 -z-10">
        {QUADROS.map((q, i) => (
          <div
            key={q.src}
            ref={(el) => {
              quadros.current[i] = el;
            }}
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: i === 0 ? 1 : 0 }}
            aria-hidden={i !== ativo}
          >
            <Image
              src={q.src}
              alt={i === 0 ? q.alt : ""}
              fill
              priority={i === 0}
              quality={75}
              sizes="100vw"
              className="object-cover will-change-transform"
              style={{ objectPosition: q.foco }}
            />
          </div>
        ))}

        {/* Luz da manhã por cima da foto: clareia o topo, assenta o pé */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,10,0.78)_0%,rgba(20,30,9,0.3)_26%,rgba(20,30,9,0.52)_60%,rgba(20,30,9,0.94)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_35%,rgba(6,6,10,0.5)_100%)]" />
      </div>

      {/* ── Marcas ───────────────────────────────────────────────────────── */}
      <div className="ris-wrap hero-conteudo">
        <div className="hero-fade flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-5">
          <div className="flex items-center gap-3">
            <LogoSomma tom="claro" className="h-[20px] w-auto md:h-[24px]" />
            <span className="ris-label opacity-40">×</span>
            <LogoSantaMonica tom="claro" className="h-[26px] w-auto md:h-[30px]" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="opacity-50">powered by</Label>
            <LogoHypeOn className="h-[18px] w-auto md:h-5" />
          </div>
        </div>
      </div>

      {/* ── Nome, assinatura e conversão ─────────────────────────────────── */}
      <div className="ris-wrap hero-conteudo">
        <h1 id="hero-titulo" className="ris-col-8">
          <Fit linhas={COPY.hero.headline} maskClass="hero-mask" max="9.5rem" min="2.7rem" />
        </h1>

        <p className="hero-fade ris-lead mt-4 text-[clamp(1.5rem,4.4vw,2.6rem)] leading-none">
          {COPY.hero.assinatura}
        </p>
        <p className="hero-fade mt-3 max-w-[34ch] text-[0.98rem] leading-relaxed opacity-75 md:max-w-[42ch]">
          {COPY.hero.frase}
        </p>

        {/* Ficha técnica em uma linha só — o hero não precisa de mais nada */}
        <div className="hero-fade mt-7 flex flex-col gap-5 border-t border-[color:var(--cream-20)] pt-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:items-end sm:gap-x-10">
            {dados.map((d) => (
              <div key={d.rotulo}>
                <dt className="ris-label opacity-55">{d.rotulo}</dt>
                <dd className="ris-mono mt-1.5 whitespace-nowrap text-[1.02rem] font-bold leading-none md:text-[1.15rem]">
                  {d.valor}
                </dd>
              </div>
            ))}
          </dl>

          <TicketCta origem="hero" evento="hero_cta_click" className="w-full shrink-0 md:w-auto">
            {COPY.cta.principal}
          </TicketCta>
        </div>

        {/* Marcadores do filme — discretos, clicáveis */}
        <div className="hero-fade mt-6 flex items-center gap-2" role="tablist" aria-label="Imagens da capa">
          {QUADROS.map((q, i) => (
            <button
              key={q.src}
              type="button"
              role="tab"
              aria-selected={i === ativo}
              aria-label={`Imagem ${i + 1} de ${QUADROS.length}`}
              onClick={() => setAtivo(i)}
              className="flex h-10 items-center px-1"
            >
              <span
                className="block h-[2px] w-8 rounded-full transition-all duration-500"
                style={{
                  background: i === ativo ? "var(--somma)" : "currentColor",
                  opacity: i === ativo ? 1 : 0.3,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
