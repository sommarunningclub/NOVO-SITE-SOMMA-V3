"use client";

import Image from "next/image";
import { ARENA, FRASES } from "@/lib/o-longao/copy";
import { imageMask, isLowPower, maskReveal, parallax, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * A arena da final.
 *
 * O título vem inteiro da copy e é quebrado por frase: cada sentença vira uma
 * linha do FitLines. A foto grande entra por máscara e só ganha parallax fora
 * de aparelho fraco; a estrutura da arena vira chips de pit wall em mono.
 */

const LINHAS_TITULO = ARENA.titulo.split(/(?<=\.)\s+/);

export function Arena() {
  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".ar-kicker"), { trigger: root, start: "top 82%" });
    maskReveal(root.querySelectorAll(".ar-titulo > *"), { trigger: root, start: "top 76%" });
    riseIn(root.querySelectorAll(".ar-anim"), {
      trigger: root.querySelector(".ar-corpo") ?? undefined,
      start: "top 78%",
      stagger: 0.12,
    });

    const fotoGrande = root.querySelector<HTMLElement>(".ar-foto-grande");
    const wrapGrande = root.querySelector(".ar-foto-grande-wrap");
    if (fotoGrande) {
      imageMask(fotoGrande, wrapGrande ?? undefined);
      if (wrapGrande && !isLowPower()) parallax(fotoGrande, 7, wrapGrande);
    }
    const fotoMenor = root.querySelector<HTMLElement>(".ar-foto-menor");
    if (fotoMenor) imageMask(fotoMenor, root.querySelector(".ar-foto-menor-wrap") ?? undefined);

    riseIn(root.querySelectorAll(".ar-chip"), {
      trigger: root.querySelector(".ar-chips") ?? undefined,
      start: "top 86%",
      stagger: 0.045,
      y: 18,
    });
  });

  return (
    <section
      ref={root}
      id="arena"
      className="lgo-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="arena-titulo"
    >
      <div className="lgo-lanes" aria-hidden />
      <div
        aria-hidden
        className="lgo-glow bottom-[2%] left-[-14%] h-[44vh] w-[44vh]"
        style={{ background: "var(--somma)", opacity: 0.16 }}
      />

      <div className="lgo-wrap relative">
        {/* A arena é uma unidade Evolve: a marca aparece como palco, não como
            crédito de rodapé. É o lugar da página onde ela tem função. */}
        <div className="ar-kicker mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <p className="lgo-label flex items-center gap-3 text-[color:var(--somma)]">
            <span aria-hidden className="block h-2 w-2 bg-current" />
            {ARENA.kicker}
          </p>
          <span className="flex items-center gap-3">
            <span className="lgo-label text-[color:rgba(242,240,236,0.4)]">PALCO</span>
            <Image
              src="/evolve-logo.svg"
              alt="Evolve"
              width={192}
              height={50}
              style={{ height: 22 }}
              className="w-auto"
            />
          </span>
        </div>

        <h2 id="arena-titulo">
          <FitLines linhas={LINHAS_TITULO} maskClass="ar-titulo" max="10rem" min="1.9rem" />
        </h2>

        <div className="ar-corpo mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-8 lg:gap-12">
          {/* A fileira de esteiras: a imagem que sustenta a frase do título */}
          <div className="ar-foto-grande-wrap relative aspect-[16/10] overflow-hidden md:col-span-7 md:aspect-[4/3] lg:aspect-[16/10]">
            <Image
              src="/desafio-esteiras-evolve/img/esteiras-fila.jpg"
              alt="Fileira de esteiras alinhadas na Evolve, prontas para a largada"
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              loading="lazy"
              className="ar-foto-grande object-cover"
            />
          </div>

          <div className="md:col-span-5 md:flex md:flex-col md:justify-between">
            <div>
              <p className="ar-anim max-w-[46ch] text-[clamp(1.05rem,2.8vw,1.3rem)] leading-relaxed text-[color:rgba(242,240,236,0.78)]">
                {ARENA.texto}
              </p>
              <p className="ar-anim lgo-mono mt-7 flex items-center gap-3 text-[0.9rem] text-[color:var(--sinal)]">
                <span aria-hidden className="block h-2 w-2 bg-current" />
                {FRASES.umParaOutroComeça}
              </p>
            </div>

            <div className="ar-foto-menor-wrap relative mt-10 aspect-[16/9] overflow-hidden md:mt-8 md:aspect-[3/2] lg:max-w-[85%]">
              <Image
                src="/desafio-esteiras-evolve/img/comunidade-neon.jpg"
                alt="Comunidade reunida sob o letreiro neon da Evolve"
                fill
                sizes="(max-width: 768px) 100vw, 38vw"
                loading="lazy"
                className="ar-foto-menor object-cover"
              />
            </div>
          </div>
        </div>

        {/* O que compõe a arena */}
        <ul className="ar-chips mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:mt-16 lg:grid-cols-4">
          {ARENA.itens.map((item, i) => (
            <li
              key={item}
              className="ar-chip flex min-h-[44px] items-center gap-3 border border-[color:var(--line)] bg-[color:var(--noite-2)] px-3.5 py-2.5 transition-colors duration-300 md:hover:border-[color:rgba(255,196,0,0.45)]"
            >
              <span
                aria-hidden="true"
                className="lgo-num text-[0.65rem] text-[color:rgba(242,240,236,0.35)]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="lgo-mono text-[0.78rem] uppercase leading-tight tracking-[0.08em] text-[color:rgba(242,240,236,0.85)]">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
