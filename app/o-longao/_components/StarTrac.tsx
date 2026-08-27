"use client";

import Image from "next/image";
import { STAR_TRAC } from "@/lib/o-longao/copy";
import { imageMask, isLowPower, maskReveal, parallax, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/** O copy é a fonte única; aqui só quebramos o título em linhas para o FitLines. */
const PALAVRAS = STAR_TRAC.titulo.split(" ");
const TITULO_LINHAS = [
  PALAVRAS.slice(0, 3).join(" "),
  PALAVRAS.slice(3, 6).join(" "),
  PALAVRAS.slice(6).join(" "),
];

/**
 * Espaço estruturado do material oficial da Star Trac: o kit do sponsor
 * (modelo, especificações, fotos, vídeo, tecnologia, dados coletados) ainda
 * não chegou. Os slots abaixo já reservam o lugar no layout — quando o
 * material vier, preenche-se cada slot aqui, sem redesenhar a seção.
 */
const SLOTS_FUTUROS = [
  "MODELO",
  "ESPECIFICAÇÕES",
  "FOTOS",
  "VÍDEO",
  "TECNOLOGIA",
  "DADOS COLETADOS",
] as const;

/**
 * A seção da marca que equipa a prova.
 *
 * Star Trac não é um banner de patrocínio: é parte da narrativa da prova.
 * Cada crew corre as 24 horas inteiras sobre uma única máquina, então a
 * máquina ganha o tratamento premium — moldura de hairlines, âmbar de
 * cronometragem e o wordmark em escala de headline.
 */
export function StarTrac() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".st-wordmark > *"), { trigger: root, start: "top 74%" });
    maskReveal(root.querySelectorAll(".st-titulo > *"), {
      trigger: root.querySelector(".st-grid") ?? root,
      start: "top 78%",
    });
    riseIn(root.querySelectorAll(".st-anim"), { trigger: root, start: "top 80%" });
    riseIn(root.querySelectorAll(".st-grid-anim"), {
      trigger: root.querySelector(".st-grid") ?? root,
      start: "top 72%",
      stagger: 0.1,
    });
    riseIn(root.querySelectorAll(".st-slot"), {
      trigger: root.querySelector(".st-slots") ?? root,
      start: "top 86%",
      stagger: 0.06,
    });
    imageMask(root.querySelector(".st-foto"), root.querySelector(".st-foto-wrap") ?? undefined);
    if (!isLowPower()) parallax(root.querySelector(".st-foto"), 8, root);
  });

  return (
    <section
      ref={root}
      id="star-trac"
      className="lgo-section lgo-grain relative scroll-mt-16 overflow-hidden"
      style={{ background: "var(--noite-2)" }}
      aria-labelledby="star-trac-titulo"
    >
      {/* âmbar de madrugada atrás do wordmark: luz de painel, não de vitrine */}
      <div
        aria-hidden
        className="lgo-glow left-1/2 top-[12%] h-[42vh] w-[42vh] -translate-x-1/2"
        style={{ background: "var(--sinal)", opacity: 0.1 }}
      />

      <div className="lgo-wrap relative">
        {/* Moldura: hairline, kicker âmbar, hairline. A plaqueta da seção. */}
        <div className="st-anim flex items-center gap-4">
          <span aria-hidden className="lgo-hairline w-10 shrink-0 sm:w-16" />
          <p className="lgo-label shrink-0 text-[color:var(--sinal)]">{STAR_TRAC.kicker}</p>
          <span aria-hidden className="lgo-hairline flex-1" />
        </div>

        {/*
          A marca oficial, no maior tamanho que ela aparece no site. A largura
          é limitada por `max-width` e a altura acompanha, porque aqui o logo
          faz o papel de headline: precisa crescer com a tela sem estourar a
          coluna. `priority` fica de fora de propósito — é conteúdo de meio de
          página e não deve disputar banda com o LCP do hero.
        */}
        {/* `lgo-mask` é o que faz o reveal do GSAP (linha 41) continuar sendo
            uma janela: sem ela, o logo apareceria deslizando por fora. */}
        <div className="st-wordmark lgo-mask mt-10 w-full max-w-[min(880px,92%)] md:mt-14">
          <Image
            src="/o-longao/star-trac-branco.png"
            alt="Star Trac"
            width={1137}
            height={138}
            sizes="(min-width: 768px) 880px, 92vw"
            className="h-auto w-full"
          />
        </div>

        <div className="st-grid mt-12 grid gap-10 md:mt-20 md:grid-cols-12 md:items-start md:gap-8 lg:gap-12">
          <div className="md:col-span-6">
            <h2 id="star-trac-titulo" className="lgo-col-6">
              <FitLines linhas={TITULO_LINHAS} maskClass="st-titulo" max="4.6rem" min="1.6rem" />
            </h2>

            {/* A frase-chave da narrativa ("uma única máquina") já vive no copy. */}
            <p className="st-grid-anim mt-7 max-w-[52ch] text-[clamp(1rem,2.4vw,1.2rem)] leading-relaxed text-[color:rgba(242,240,236,0.78)]">
              {STAR_TRAC.texto}
            </p>
          </div>

          <div className="md:col-span-6">
            <div className="st-foto-wrap relative aspect-[4/3] overflow-hidden">
              <Image
                src="/desafio-esteiras-evolve/img/display.jpg"
                alt="Close do painel de uma esteira Star Trac aceso durante a corrida"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
                className="st-foto object-cover"
              />
            </div>

            {/* Painel de dados sobreposto à foto, como etiqueta de pit wall. */}
            <div className="st-grid-anim lgo-panel relative z-10 mx-4 -mt-16 sm:mx-8">
              <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
                {STAR_TRAC.slots.map((slot) => (
                  <div key={slot.rotulo}>
                    <dt className="lgo-label text-[color:rgba(242,240,236,0.45)]">
                      {slot.rotulo}
                    </dt>
                    <dd
                      className={`lgo-num mt-2 text-[clamp(1rem,2.6vw,1.25rem)] font-bold ${
                        slot.valor === "A anunciar" ? "opacity-50" : ""
                      }`}
                    >
                      {slot.valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Slots do material oficial — ver comentário em SLOTS_FUTUROS. */}
        <ul className="st-slots mt-14 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-3 lg:grid-cols-6">
          {SLOTS_FUTUROS.map((rotulo) => (
            <li
              key={rotulo}
              className="st-slot lgo-slot flex min-h-[120px] flex-col justify-between p-4"
            >
              <span className="lgo-label text-[color:rgba(242,240,236,0.55)]">{rotulo}</span>
              <span className="lgo-mono text-[0.68rem] tracking-[0.18em] text-[color:rgba(242,240,236,0.3)]">
                A ANUNCIAR
              </span>
            </li>
          ))}
        </ul>

        {/* Base da moldura. */}
        <div aria-hidden className="lgo-hairline mt-14 md:mt-20" />
      </div>
    </section>
  );
}
