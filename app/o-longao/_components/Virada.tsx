"use client";

import { FINAL, HERO } from "@/lib/o-longao/copy";
import { EASE, ScrollTrigger, gsap, maskReveal, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * FASE 02 — a virada de atmosfera da página.
 *
 * Depois da seletiva a landing "anoitece": fundo de madrugada, relógio armado
 * em 24:00:00 e entradas de propósito mais graves (durações e staggers maiores
 * que no resto da página). É o silêncio antes da largada da final.
 */

// O título quebra em duas linhas sem duplicar copy aqui: as duas primeiras
// palavras abrem a frase e o nome do evento fecha sozinho na segunda linha.
const PALAVRAS = FINAL.titulo.split(" ");
const TITULO_LINHAS = [
  PALAVRAS.slice(0, 2).join(" "),
  PALAVRAS.slice(2).join(" "),
] as const;

// Relógio armado, parado em 24:00:00. Só os dois-pontos respiram.
const [HORAS, MINUTOS, SEGUNDOS] = HERO.relogio.split(":");

export function Virada() {
  const root = useScope<HTMLElement>(({ root }) => {
    // Dois-pontos piscando enquanto a seção está em cena. `useScope` já corta
    // tudo em prefers-reduced-motion, então o loop nem chega a ser criado lá.
    const pontos = root.querySelectorAll<HTMLElement>(".vrd-relogio em");
    if (pontos.length) {
      const blink = gsap.to(pontos, {
        opacity: 0.15,
        duration: 0.72,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
        paused: true,
      });
      ScrollTrigger.create({
        trigger: root,
        start: "top 95%",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? blink.play() : blink.pause()),
      });
    }

    // Uma única largada de trigger, coreografada por delay: chip e relógio,
    // depois o título, depois o corpo. Tudo mais lento que o resto da página.
    const start = "top 62%";
    gsap.fromTo(
      root.querySelectorAll(".vrd-abre"),
      { y: 42, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: EASE.soft,
        stagger: 0.22,
        scrollTrigger: { trigger: root, start, once: true },
      }
    );
    maskReveal(root.querySelectorAll(".vrd-titulo > *"), {
      trigger: root,
      start,
      delay: 0.45,
      duration: 1.9,
      stagger: 0.26,
    });
    gsap.fromTo(
      root.querySelectorAll(".vrd-corpo"),
      { y: 42, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: EASE.soft,
        stagger: 0.22,
        delay: 1.05,
        scrollTrigger: { trigger: root, start, once: true },
      }
    );

    maskReveal(root.querySelectorAll(".vrd-fecho > *"), {
      trigger: root.querySelector(".vrd-fecho-wrap") ?? root,
      start: "top 85%",
      duration: 1.8,
    });
  });

  return (
    <section
      ref={root}
      id="final"
      className="lgo-section lgo-madrugada lgo-grain relative flex min-h-[90svh] scroll-mt-16 items-center overflow-hidden"
      aria-labelledby="final-titulo"
    >
      {/* Madrugada: um farol âmbar fraco no alto e um resto de energia no canto. */}
      <div
        aria-hidden
        className="lgo-glow left-1/2 top-[8%] h-[46vh] w-[72vw] -translate-x-1/2"
        style={{ background: "var(--sinal)", opacity: 0.14 }}
      />
      <div
        aria-hidden
        className="lgo-glow -bottom-[12%] right-[6%] h-[34vh] w-[36vw]"
        style={{ background: "var(--somma)", opacity: 0.1 }}
      />

      <div className="lgo-wrap relative z-[1] w-full text-center">
        <p className="vrd-abre lgo-label inline-flex items-center gap-2.5 border border-[color:rgba(255,196,0,0.38)] px-4 py-2.5 text-[color:var(--sinal)]">
          <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-[color:var(--sinal)]" />
          {FINAL.fase}
        </p>

        <p className="vrd-abre vrd-relogio lgo-clock mt-8 text-[clamp(3.4rem,14vw,9rem)] md:mt-10">
          {HORAS}
          <em>:</em>
          {MINUTOS}
          <em>:</em>
          {SEGUNDOS}
        </p>

        <h2 id="final-titulo" className="mt-8 md:mt-12">
          <FitLines linhas={TITULO_LINHAS} maskClass="vrd-titulo" max="11rem" min="2.2rem" />
        </h2>

        <p className="vrd-corpo lgo-mono mt-7 text-[clamp(0.95rem,2.4vw,1.15rem)] tracking-[0.06em] text-[color:var(--sinal)]">
          {FINAL.subtitulo}
        </p>

        <p className="vrd-corpo mx-auto mt-7 max-w-[54ch] text-[clamp(1rem,2.6vw,1.2rem)] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
          {FINAL.texto}
        </p>

        <p className="vrd-fecho-wrap mt-14 md:mt-20">
          <FitLines
            linhas={[{ texto: FINAL.fecho, style: { color: "var(--somma)" } }]}
            maskClass="vrd-fecho"
            max="9.5rem"
            min="1.6rem"
          />
        </p>
      </div>
    </section>
  );
}
