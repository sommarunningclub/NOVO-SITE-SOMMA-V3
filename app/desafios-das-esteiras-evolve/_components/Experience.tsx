"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { EXPERIENCE } from "@/lib/desafio-esteiras/event.config";
import { EASE, gsap, imageMask, isLowPower, maskReveal, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

const FOTOS: Record<string, { src: string; alt: string }> = {
  ativacoes: { src: "/desafio-esteiras-evolve/img/energia.jpg", alt: "Equipe SOMMA animando a experiência" },
  "brindes-evolve": { src: "/desafio-esteiras-evolve/img/neon-evolve.jpg", alt: "Letreiro neon da Evolve" },
  "brindes-somma": { src: "/desafio-esteiras-evolve/img/somma-costas.jpg", alt: "Camiseta do SOMMA Running Club" },
  musica: { src: "/desafio-esteiras-evolve/img/display.jpg", alt: "Ambiente da Evolve durante a experiência" },
  comunidade: { src: "/desafio-esteiras-evolve/img/comunidade-neon.jpg", alt: "Grupo reunido sob o neon da Evolve" },
  surpresas: { src: "/desafio-esteiras-evolve/img/bootcamp.jpg", alt: "Área de treino da Evolve" },
};

/**
 * O que vai acontecer.
 *
 * Nada de grade de cards: dois blocos full-bleed para o que é âncora do evento
 * (o desafio e a catraca liberada) e, abaixo, uma lista tipográfica gigante em
 * que cada linha revela sua foto. No desktop a foto segue o cursor; no mobile
 * ela é exibida inline — nada depende exclusivamente de hover.
 */
export function Experience() {
  const [ativo, setAtivo] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<((v: number) => void) | null>(null);
  const quickY = useRef<((v: number) => void) | null>(null);

  const destaques = EXPERIENCE.filter((e) => e.destaque);
  const lista = EXPERIENCE.filter((e) => !e.destaque);

  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".exp-titulo > *"), { trigger: root, start: "top 76%" });
    riseIn(root.querySelectorAll(".exp-destaque"), { trigger: root, start: "top 70%", stagger: 0.14 });

    root.querySelectorAll<HTMLElement>(".exp-foto-destaque").forEach((el) => {
      imageMask(el, el.parentElement ?? undefined);
    });

    gsap.fromTo(
      root.querySelectorAll(".exp-item"),
      { x: -40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.9,
        ease: EASE.out,
        stagger: 0.07,
        scrollTrigger: { trigger: root.querySelector(".exp-lista"), start: "top 82%", once: true },
      }
    );

    // quickTo evita recriar tweens a cada mousemove.
    if (!isLowPower() && previewRef.current) {
      quickX.current = gsap.quickTo(previewRef.current, "x", { duration: 0.5, ease: "power3" });
      quickY.current = gsap.quickTo(previewRef.current, "y", { duration: 0.5, ease: "power3" });
    }
  });

  function onMove(e: React.MouseEvent) {
    quickX.current?.(e.clientX + 28);
    quickY.current?.(e.clientY - 130);
  }

  return (
    <section
      ref={root}
      id="experiencia"
      className="dst-section relative scroll-mt-16 overflow-hidden"
      aria-labelledby="experiencia-titulo"
      onMouseMove={onMove}
    >
      <div className="dst-lanes" />

      <div className="dst-wrap relative">
        <p className="dst-label mb-6 text-[color:var(--somma)]">A experiência</p>
        <h2 id="experiencia-titulo">
          <FitLines linhas={["O QUE VAI", "ACONTECER"]} maskClass="exp-titulo" max="8rem" min="2.2rem" />
        </h2>

        {/* Âncoras do evento */}
        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 md:gap-6">
          {destaques.map((item, i) => (
            <article
              key={item.id}
              className="exp-destaque group relative isolate flex min-h-[380px] flex-col justify-end overflow-hidden border border-[color:var(--line)] p-6 md:min-h-[520px] md:p-8"
            >
              <Image
                src={
                  i === 0
                    ? "/desafio-esteiras-evolve/img/esteiras-fila.jpg"
                    : "/desafio-esteiras-evolve/img/esteira-somma.jpg"
                }
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="exp-foto-destaque -z-10 object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,8,10,0.25)_0%,rgba(8,8,10,0.55)_45%,rgba(8,8,10,0.94)_100%)]" />

              <span className="dst-num absolute right-6 top-6 text-[clamp(3rem,9vw,5.5rem)] font-bold leading-none text-[color:rgba(242,240,236,0.14)]">
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="dst-display text-[clamp(1.8rem,6vw,3.2rem)]">{item.titulo}</h3>
              <p className="mt-3 max-w-[42ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
                {item.texto}
              </p>
              <span
                className="mt-6 block h-[3px] w-16 origin-left transition-transform duration-500 group-hover:scale-x-[2.4]"
                style={{ background: "var(--energia)" }}
              />
            </article>
          ))}
        </div>

        {/* Lista tipográfica */}
        <ul className="exp-lista mt-14 border-t border-[color:var(--line)] md:mt-20">
          {lista.map((item) => {
            const foto = FOTOS[item.id];
            return (
              <li
                key={item.id}
                className="exp-item border-b border-[color:var(--line)]"
                onMouseEnter={() => setAtivo(item.id)}
                onMouseLeave={() => setAtivo(null)}
              >
                <div className="flex flex-col gap-4 py-6 md:flex-row md:items-baseline md:gap-10 md:py-7">
                  <h3 className="dst-display dst-display-condensed flex-1 text-[clamp(1.7rem,6vw,3.6rem)] transition-colors duration-300 md:hover:text-[color:var(--somma)]">
                    {item.titulo}
                  </h3>
                  <p className="max-w-[38ch] text-[0.92rem] leading-relaxed text-[color:rgba(242,240,236,0.6)] md:text-right">
                    {item.texto}
                  </p>
                </div>
                {/* Mobile: a foto é parte do conteúdo, não um estado de hover. */}
                {foto && (
                  <div className="relative mb-6 aspect-[16/10] overflow-hidden md:hidden">
                    <Image
                      src={foto.src}
                      alt={foto.alt}
                      fill
                      sizes="100vw"
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preview que segue o cursor — decorativo, desktop apenas */}
      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 hidden h-[300px] w-[230px] overflow-hidden transition-opacity duration-300 md:block"
        style={{ opacity: ativo ? 1 : 0 }}
      >
        {ativo && FOTOS[ativo] && (
          <Image src={FOTOS[ativo].src} alt="" fill sizes="230px" className="object-cover" />
        )}
      </div>
    </section>
  );
}
