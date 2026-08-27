"use client";

import Link from "next/link";
import { LINKS } from "@/lib/o-longao/config";
import { CTA_FINAL, FRASES, HERO } from "@/lib/o-longao/copy";
import { track } from "@/lib/o-longao/analytics";
import { maskReveal, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";
import { Logos } from "./Logos";
import { StarTracLogo } from "./StarTracLogo";

/**
 * Fecho da página: o convite em tipografia máxima e o relógio parado em
 * 24:00:00, esperando a largada. Depois daqui só existe o rodapé.
 */
export function FinalCta() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".ctaf-titulo > *"), {
      trigger: root,
      start: "top 78%",
      stagger: 0.09,
    });
    riseIn(root.querySelectorAll(".ctaf-anim"), { trigger: root, start: "top 70%", stagger: 0.08 });
  });

  return (
    <section
      ref={root}
      className="lgo-section lgo-grain relative overflow-hidden border-t border-[color:var(--line)] bg-[color:var(--noite)]"
      aria-labelledby="cta-final-titulo"
    >
      {/* Halo de largada: o laranja SOMMA subindo por trás do convite. */}
      <div
        className="lgo-glow bottom-0 left-1/2 h-[55vh] w-[85vw] -translate-x-1/2 translate-y-1/3"
        style={{ background: "var(--somma)", opacity: 0.3 }}
        aria-hidden
      />
      <div className="lgo-lanes" aria-hidden />

      <div className="lgo-wrap relative text-center">
        <p className="lgo-label ctaf-anim mb-8 text-[color:var(--somma)]">{CTA_FINAL.kicker}</p>

        <h2 id="cta-final-titulo">
          <FitLines
            linhas={CTA_FINAL.titulo.map((linha, i) =>
              i === CTA_FINAL.titulo.length - 1
                ? { texto: linha, style: { color: "var(--somma)" } }
                : linha
            )}
            maskClass="ctaf-titulo"
            max="13rem"
            min="2.2rem"
          />
        </h2>

        <p className="ctaf-anim mx-auto mt-8 max-w-[46ch] text-[1rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
          {CTA_FINAL.texto}
        </p>

        <div className="ctaf-anim mx-auto mt-10 max-w-[560px]">
          <Link
            href={LINKS.inscricao}
            onClick={() => track("begin_registration", { origem: "cta_final" })}
            className="lgo-btn lgo-btn--xl lgo-pulse w-full"
          >
            {CTA_FINAL.cta}
          </Link>
        </div>

        {/* Faixa de instrumentos: o relógio armado e as marcas da prova. */}
        <div className="ctaf-anim mt-16 border-t border-[color:var(--line)] pt-8 md:mt-20">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <p className="lgo-clock text-[clamp(2.4rem,7vw,4rem)]">{HERO.relogio}</p>
              <p className="lgo-mono mt-3 text-[0.85rem] uppercase tracking-[0.08em] text-[color:var(--sinal)]">
                {FRASES.relogioNaoPara}
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 md:items-end">
              <Logos altura={26} />
              <span className="flex items-center gap-3">
                <span className="lgo-label text-[color:rgba(242,240,236,0.4)]">POWERED BY</span>
                <StarTracLogo altura={20} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
