"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { CONCEITO } from "@/lib/o-longao/copy";
import { FitLines } from "./FitLines";
import { imageMask, maskReveal, riseIn, useScope } from "../_motion";

/**
 * O Conceito — a quebra de papel depois da provocação.
 *
 * A regra da prova cabe em um parágrafo; o resto é tipografia. Os quatro
 * pilares sobem em cascata como linhas que preenchem a largura, e os dois
 * que definem a prova ganham tratamento: "24 HORAS" vira contorno sobre o
 * papel e "MAIOR DISTÂNCIA VENCE" carrega o laranja de energia.
 */

/** Tratamento por pilar. As chaves espelham literais de `CONCEITO.pilares`. */
const TRATAMENTO_PILAR: Record<string, CSSProperties> = {
  "24 HORAS": {
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: "2px var(--noite)",
  },
  "MAIOR DISTÂNCIA VENCE": { color: "var(--somma)" },
};

export function Conceito() {
  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".con-intro"), {
      trigger: root,
      start: "top 75%",
      stagger: 0.12,
    });

    const foto = root.querySelector(".con-foto");
    if (foto) imageMask(foto, root.querySelector(".con-foto-wrap") ?? undefined);

    maskReveal(root.querySelectorAll(".con-pilar > *"), {
      trigger: root.querySelector(".con-pilares") ?? root,
      start: "top 80%",
      stagger: 0.12,
      duration: 1.2,
    });
  });

  return (
    <section
      ref={root}
      className="lgo-paper lgo-section lgo-grain relative overflow-hidden"
      aria-labelledby="conceito-titulo"
    >
      <div className="lgo-wrap relative">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <h2
              id="conceito-titulo"
              className="con-intro lgo-label text-[color:var(--somma)]"
            >
              {CONCEITO.kicker}
            </h2>

            <p className="con-intro mt-8 max-w-[52ch] text-[clamp(1.1rem,2.7vw,1.6rem)] leading-relaxed text-[color:rgba(5,5,8,0.78)]">
              {CONCEITO.texto}
            </p>

            <div className="con-intro mt-9">
              <span className="lgo-energia-line block w-16" aria-hidden />
              <p className="mt-4 max-w-[30ch] text-[clamp(1.35rem,3.4vw,2rem)] font-bold leading-snug tracking-tight text-[color:var(--noite)]">
                {CONCEITO.fecho}
              </p>
            </div>
          </div>

          <div className="con-foto-wrap relative aspect-[4/5] overflow-hidden md:col-span-5 md:self-end">
            <Image
              src="/desafio-esteiras-evolve/img/esteira-somma.jpg"
              alt="Atleta correndo em uma esteira durante a madrugada"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="con-foto object-cover"
            />
          </div>
        </div>

        {/* Os quatro pilares: a prova inteira em quatro linhas. */}
        <div className="con-pilares mt-16 md:mt-24">
          <FitLines
            linhas={CONCEITO.pilares.map((pilar) =>
              TRATAMENTO_PILAR[pilar] ? { texto: pilar, style: TRATAMENTO_PILAR[pilar] } : pilar
            )}
            maskClass="con-pilar"
            max="12rem"
            min="1.6rem"
          />
        </div>
      </div>
    </section>
  );
}
