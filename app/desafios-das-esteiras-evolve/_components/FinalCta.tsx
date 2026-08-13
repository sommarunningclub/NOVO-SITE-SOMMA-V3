"use client";

import Link from "next/link";
import {
  COPY,
  EVENT,
  EVENT_PATH,
  UNITS,
  inscricoesAbertas,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { FitLines } from "./FitLines";
import { gsap, isLowPower, maskReveal, riseIn, useScope } from "../_motion";
import { Countdown } from "./Countdown";

/**
 * Fecho da página: a data em tipografia máxima, o CTA grande e as quatro
 * unidades como último atalho. Depois disso só resta o rodapé.
 */
export function FinalCta() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".cta-titulo > *"), {
      trigger: root,
      start: "top 78%",
      stagger: 0.09,
    });
    riseIn(root.querySelectorAll(".cta-anim"), { trigger: root, start: "top 70%", stagger: 0.08 });

    if (!isLowPower()) {
      // A data desliza no eixo horizontal enquanto a seção passa: sensação de esteira.
      gsap.fromTo(
        root.querySelector(".cta-data"),
        { xPercent: 6 },
        {
          xPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.7 },
        }
      );
    }
  });

  const abertas = inscricoesAbertas();

  return (
    <section
      ref={root}
      className="dst-section dst-grain relative overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="cta-final-titulo"
    >
      <div
        className="dst-glow bottom-0 left-1/2 h-[55vh] w-[80vw] -translate-x-1/2 translate-y-1/3"
        style={{ background: "var(--evolve)", opacity: 0.24 }}
      />
      <div className="dst-lanes" />

      <div className="dst-wrap relative text-center">
        <p className="dst-label cta-anim mb-8 text-[color:var(--somma)]">Última chamada</p>

        <h2 id="cta-final-titulo">
          <FitLines
            linhas={[
              { texto: EVENT.dataLabel, className: "cta-data" },
              "A CIDADE",
              { texto: "CORRE JUNTA.", style: { color: "var(--somma)" } },
            ]}
            maskClass="cta-titulo"
            max="13rem"
            min="1.9rem"
          />
        </h2>

        <p className="dst-label cta-anim mt-7 text-[color:rgba(242,240,236,0.6)]">
          Evolve + SOMMA Club · {EVENT.dataExtenso} · {EVENT.horaExtenso}
        </p>

        {abertas ? (
          <>
            <p className="dst-display cta-anim mt-10 text-[clamp(1.2rem,4.5vw,2rem)]">
              ESCOLHA SUA UNIDADE.
            </p>
            <p className="cta-anim mx-auto mt-4 max-w-[52ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.6)]">
              {COPY.vagasDetalhe}
            </p>

            <div className="cta-anim mx-auto mt-6 max-w-[560px]">
              <Link
                href={`${EVENT_PATH}/inscricao`}
                onClick={() => track("begin_registration", { origem: "cta_final" })}
                className="dst-btn dst-btn--xl w-full"
              >
                {COPY.ctaPrimario}
              </Link>
            </div>

            <ul className="cta-anim mx-auto mt-4 grid max-w-[720px] grid-cols-2 gap-2 md:grid-cols-4">
              {UNITS.map((unit) => (
                <li key={unit.id}>
                  <Link
                    href={`${EVENT_PATH}/inscricao?unidade=${unit.slug}`}
                    onClick={() => {
                      track("select_unit", { unidade: unit.id, origem: "cta_final" });
                      track("begin_registration", { origem: "cta_final", unidade: unit.id });
                    }}
                    className="dst-panel dst-label flex min-h-[56px] items-center justify-center px-3 text-center transition-colors hover:border-[color:var(--somma)] hover:text-[color:var(--somma)]"
                  >
                    {unit.curto}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="dst-display cta-anim mt-10 text-[clamp(1.2rem,4.5vw,2rem)] text-[color:rgba(242,240,236,0.6)]">
            AS INSCRIÇÕES NÃO ESTÃO ABERTAS.
          </p>
        )}

        <div className="cta-anim mx-auto mt-12 max-w-[520px]">
          <Countdown compacto />
        </div>
      </div>
    </section>
  );
}
