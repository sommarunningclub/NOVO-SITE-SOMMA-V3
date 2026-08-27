"use client";

import Image from "next/image";
import { ESTEIRA } from "@/lib/o-longao/config";
import { STAR_TRAC } from "@/lib/o-longao/copy";
import { EASE, gsap, isLowPower, maskReveal, parallax, riseIn, useScope } from "../_motion";
import { EsteiraCinematica } from "./EsteiraCinematica";
import { FitLines } from "./FitLines";

/** O copy é a fonte única; aqui só quebramos o título em linhas para o FitLines. */
const PALAVRAS = STAR_TRAC.titulo.split(" ");
const TITULO_LINHAS = [
  PALAVRAS.slice(0, 3).join(" "),
  PALAVRAS.slice(3, 6).join(" "),
  PALAVRAS.slice(6).join(" "),
];

/** Os três ângulos de estúdio, além da foto principal. */
const GALERIA = [
  { src: ESTEIRA.imagens.frente, alt: `${ESTEIRA.nomeCompleto} vista de frente`, rotulo: "FRENTE" },
  { src: ESTEIRA.imagens.lateralEsq, alt: `${ESTEIRA.nomeCompleto} vista pela lateral esquerda`, rotulo: "LATERAL" },
  { src: ESTEIRA.imagens.lateralDir, alt: `${ESTEIRA.nomeCompleto} vista pela lateral direita`, rotulo: "LATERAL" },
] as const;

/**
 * A seção da marca que equipa a prova.
 *
 * A Star Trac não é um banner de patrocínio: é parte da narrativa da prova, e
 * agora tem nome e sobrenome. A FreeRunner 10TRx entra em foto de estúdio sem
 * fundo, flutuando sobre a noite como um carro em stand de salão, e o resto da
 * seção é o argumento: por que ESTA máquina aguenta 24 horas, em três pontos,
 * a ficha técnica e o console.
 *
 * As fotos já vêm com alfa, então elas não são "cortadas" da página: o
 * imageMask sobe a máquina de dentro de uma janela, e o halo âmbar atrás dela
 * é o que faz o objeto parecer iluminado em vez de colado.
 */
export function StarTrac() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".st-wordmark > *"), { trigger: root, start: "top 74%" });

    const grid = root.querySelector(".st-grid") ?? root;
    maskReveal(root.querySelectorAll(".st-titulo > *"), { trigger: grid, start: "top 78%" });
    maskReveal(root.querySelectorAll(".st-modelo > *"), { trigger: grid, start: "top 72%", stagger: 0.1 });
    riseIn(root.querySelectorAll(".st-anim"), { trigger: root, start: "top 80%" });
    riseIn(root.querySelectorAll(".st-grid-anim"), { trigger: grid, start: "top 70%", stagger: 0.1 });

    /*
      A máquina entra de baixo para cima e assenta: é a única imagem da página
      que sobe em vez de ser revelada por clip, porque um objeto sem fundo
      "chegando" convence mais que uma foto sendo descoberta.
    */
    const foto = root.querySelector<HTMLElement>(".st-foto");
    if (foto) {
      gsap.fromTo(
        foto,
        { y: 80, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.6,
          ease: EASE.out,
          scrollTrigger: { trigger: grid, start: "top 70%", once: true },
        }
      );
      if (!isLowPower()) parallax(foto, -6, root);
    }

    const argumentos = root.querySelector(".st-argumentos") ?? root;
    riseIn(root.querySelectorAll(".st-arg"), { trigger: argumentos, start: "top 82%", stagger: 0.12 });

    const specs = root.querySelector(".st-specs") ?? root;
    riseIn(root.querySelectorAll(".st-spec"), { trigger: specs, start: "top 84%", stagger: 0.05, y: 18 });

    const consoleWrap = root.querySelector(".st-console") ?? root;
    riseIn(root.querySelectorAll(".st-console-anim"), { trigger: consoleWrap, start: "top 78%", stagger: 0.1 });

    const galeria = root.querySelector(".st-galeria") ?? root;
    riseIn(root.querySelectorAll(".st-galeria-item"), { trigger: galeria, start: "top 86%", stagger: 0.08 });
  });

  return (
    <section
      ref={root}
      id="star-trac"
      className="lgo-section lgo-grain relative scroll-mt-16 overflow-hidden"
      style={{ background: "var(--noite-2)" }}
      aria-labelledby="star-trac-titulo"
    >
      <div aria-hidden className="lgo-lanes" />

      <div className="lgo-wrap relative">
        {/* Moldura: hairline, kicker âmbar, hairline. A plaqueta da seção. */}
        <div className="st-anim flex items-center gap-4">
          <span aria-hidden className="lgo-hairline w-10 shrink-0 sm:w-16" />
          <p className="lgo-label shrink-0 text-[color:var(--sinal)]">{STAR_TRAC.kicker}</p>
          <span aria-hidden className="lgo-hairline flex-1" />
        </div>

        {/* A marca, no maior tamanho que ela aparece no site. */}
        <div className="st-wordmark lgo-mask mt-10 w-full max-w-[min(760px,88%)] md:mt-14">
          <Image
            src="/o-longao/star-trac-branco.png"
            alt="Star Trac"
            width={1137}
            height={138}
            sizes="(min-width: 768px) 760px, 88vw"
            className="h-auto w-full"
          />
        </div>

        {/* ── Título + máquina ──────────────────────────────────────────── */}
        <div className="st-grid mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:items-center md:gap-8 lg:gap-12">
          <div className="md:col-span-5">
            {/* col-span-5: a headline precisa saber que tem 38% do wrap, não 47%. */}
            <h2 id="star-trac-titulo" className="lgo-col-5">
              <FitLines linhas={TITULO_LINHAS} maskClass="st-titulo" max="4.2rem" min="1.5rem" />
            </h2>

            <p className="st-grid-anim lgo-label mt-8 text-[color:var(--sinal)]">
              {STAR_TRAC.modeloKicker}
            </p>

            {/* O nome do modelo em corpo de headline: é ele que a crew vai lembrar. */}
            <div className="st-modelo mt-3">
              <span className="lgo-mask">
                <span className="lgo-display lgo-display-condensed block text-[clamp(2.2rem,7vw,4rem)] leading-[0.9]">
                  {ESTEIRA.modelo}
                </span>
              </span>
              <span className="lgo-mask mt-2">
                <span className="flex flex-wrap items-center gap-3">
                  <span className="lgo-label lgo-clip-tag bg-[color:var(--sinal)] px-3 py-1.5 text-[color:var(--noite)]">
                    {ESTEIRA.display}
                  </span>
                  <span className="lgo-label text-[color:rgba(242,240,236,0.45)]">
                    {ESTEIRA.marca}
                  </span>
                </span>
              </span>
            </div>

            <p className="st-grid-anim mt-7 max-w-[48ch] text-[clamp(1rem,2.4vw,1.15rem)] leading-relaxed text-[color:rgba(242,240,236,0.78)]">
              {STAR_TRAC.texto}
            </p>
          </div>

          <div className="relative md:col-span-7">
            {/* Luz de stand atrás do objeto: âmbar embaixo, para a máquina parecer sobre um piso iluminado. */}
            <div
              aria-hidden
              className="lgo-glow left-1/2 top-[62%] h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2"
              style={{ background: "var(--sinal)", opacity: 0.16 }}
            />
            <div aria-hidden className="absolute inset-x-[6%] bottom-[6%] h-px bg-[color:var(--line)]" />
            <div className="st-foto relative aspect-[3/2] w-full">
              <Image
                src={ESTEIRA.imagens.principal}
                alt={`${ESTEIRA.nomeCompleto} com o console ${ESTEIRA.display}, em ângulo de três quartos`}
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-contain"
              />
            </div>
            <p className="st-grid-anim lgo-mono mt-2 text-center text-[0.68rem] uppercase tracking-[0.18em] text-[color:rgba(242,240,236,0.4)]">
              {ESTEIRA.nomeCompleto} · {ESTEIRA.display}
            </p>
          </div>
        </div>

      </div>

      {/*
        Faixa de vídeo em sangria total: fica FORA do wrap de propósito, para
        tomar a largura da tela e ser fixada pelo scrub sem carregar o padding
        lateral junto. Os blocos seguintes reabrem o wrap.
      */}
      <EsteiraCinematica />

      <div className="lgo-wrap relative">
        {/* ── Por que esta máquina, em 24 horas ────────────────────────── */}
        <ol className="st-argumentos mt-14 grid gap-3 md:mt-20 md:grid-cols-3 md:gap-4">
          {STAR_TRAC.argumentos.map((arg) => (
            <li key={arg.indice} className="st-arg lgo-panel flex flex-col p-6 md:p-7">
              <span className="lgo-num text-[color:var(--sinal)]">{arg.indice}</span>
              <h3 className="lgo-display lgo-display-condensed mt-4 text-[clamp(1.3rem,4vw,1.7rem)]">
                {arg.titulo}
              </h3>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
                {arg.texto}
              </p>
            </li>
          ))}
        </ol>

        {/* ── Console + ficha técnica ──────────────────────────────────── */}
        <div className="st-console mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:items-center md:gap-8 lg:gap-12">
          <div className="md:col-span-6">
            <div className="lgo-panel relative overflow-hidden">
              <span className="lgo-label absolute left-0 top-0 z-10 bg-[color:var(--sinal)] px-4 py-2 text-[color:var(--noite)]">
                {STAR_TRAC.display.kicker}
              </span>
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={ESTEIRA.imagens.console}
                  alt={`Console ${ESTEIRA.display} da ${ESTEIRA.nomeCompleto}`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain p-4"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-6">
            <h3 className="st-console-anim lgo-display text-[clamp(1.6rem,5vw,2.6rem)]">
              {STAR_TRAC.display.titulo}
            </h3>
            <p className="st-console-anim mt-5 max-w-[46ch] text-[clamp(1rem,2.4vw,1.1rem)] leading-relaxed text-[color:rgba(242,240,236,0.75)]">
              {STAR_TRAC.display.texto}
            </p>

            <p className="st-console-anim lgo-label mt-10 text-[color:rgba(242,240,236,0.45)]">
              {STAR_TRAC.specsKicker}
            </p>
            <dl className="st-specs mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-2">
              {ESTEIRA.specs.map((spec) => (
                <div key={spec.rotulo} className="st-spec border-b border-[color:var(--line)] py-3">
                  <dt className="lgo-label text-[0.58rem] text-[color:rgba(242,240,236,0.45)]">
                    {spec.rotulo}
                  </dt>
                  <dd className="lgo-num mt-1.5 text-[0.95rem] font-bold leading-tight text-[color:var(--papel)]">
                    {spec.valor}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* ── Galeria ──────────────────────────────────────────────────── */}
        <p className="st-anim lgo-label mt-14 text-[color:rgba(242,240,236,0.45)] md:mt-20">
          {STAR_TRAC.galeriaKicker}
        </p>
        <ul className="st-galeria mt-4 grid grid-cols-3 gap-3">
          {GALERIA.map((foto, i) => (
            <li key={`${foto.rotulo}-${i}`} className="st-galeria-item lgo-slot relative aspect-[3/2]">
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                sizes="(min-width: 768px) 30vw, 33vw"
                className="object-contain p-3"
              />
              <span className="lgo-label absolute bottom-2 left-3 text-[0.55rem] text-[color:rgba(242,240,236,0.4)]">
                {foto.rotulo}
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
