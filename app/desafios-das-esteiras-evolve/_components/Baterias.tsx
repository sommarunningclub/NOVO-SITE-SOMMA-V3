"use client";

import Link from "next/link";
import {
  COMPETICAO,
  EVENT_PATH,
  UNITS,
  bateriasNecessarias,
  inscricoesAbertas,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { EASE, gsap, maskReveal, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * O formato da disputa, explicado sem parecer regulamento.
 *
 * A regra virou elástica: a inscrição é aberta e o que é finito são as quatro
 * esteiras, não as vagas. Então a seção não conta mais um total, conta uma
 * mecânica: quatro por vez, e quantas rodadas forem precisas para caber quem
 * apareceu.
 *
 * A animação segue a mesma ordem em que a coisa faz sentido: as esteiras
 * aparecem, os corredores entram, e a escada de baterias cresce. Quem está com
 * movimento reduzido lê exatamente o mesmo, parado.
 */

/** A escada que mostra a grade crescendo com a procura. */
const EXEMPLOS = [8, 16, 32, 60];

export function Baterias() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".bat-titulo > *"), { trigger: root, start: "top 76%" });

    const tl = gsap.timeline({
      defaults: { ease: EASE.out },
      scrollTrigger: { trigger: root.querySelector(".bat-palco"), start: "top 72%", once: true },
    });

    tl.fromTo(
      root.querySelectorAll(".bat-esteira"),
      { scaleY: 0, opacity: 0, transformOrigin: "bottom center" },
      { scaleY: 1, opacity: 1, duration: 0.6, stagger: 0.09 }
    )
      .fromTo(
        root.querySelectorAll(".bat-atleta"),
        { y: -18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.09 },
        "-=0.15"
      )
      .fromTo(
        root.querySelectorAll(".bat-linha"),
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        "-=0.1"
      )
      .fromTo(
        root.querySelectorAll(".bat-total"),
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 },
        "-=0.2"
      );
  });

  const abertas = inscricoesAbertas();

  return (
    <section
      ref={root}
      id="formato"
      className="dst-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="formato-titulo"
    >
      <div
        className="dst-glow left-[-10%] top-[20%] h-[46vh] w-[46vh]"
        style={{ background: "var(--evolve)", opacity: 0.2 }}
      />

      <div className="dst-wrap relative">
        <p className="dst-label mb-6 text-[color:var(--somma)]">O formato da disputa</p>
        <h2 id="formato-titulo">
          <FitLines
            linhas={[
              `${COMPETICAO.esteirasPorBateria} ESTEIRAS.`,
              "QUANTAS BATERIAS",
              "PRECISAR.",
            ]}
            maskClass="bat-titulo"
            max="7rem"
            min="1.9rem"
          />
        </h2>

        <p className="mt-8 max-w-[56ch] text-[clamp(1rem,2.6vw,1.2rem)] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
          A disputa é dividida entre Feminino e Masculino, e a inscrição está{" "}
          <strong className="text-[color:var(--paper)]">aberta nas duas</strong>. Cada bateria leva{" "}
          <strong className="text-[color:var(--paper)]">
            {COMPETICAO.esteirasPorBateria} competidores
          </strong>
          , uma pessoa por esteira. Quanto mais gente entrar, mais baterias a gente monta.
        </p>

        {/* ── O palco: as esteiras e a grade que cresce ── */}
        <div className="bat-palco mt-12 grid gap-4 md:mt-16 md:grid-cols-12 md:gap-6">
          {/* As quatro esteiras */}
          <div className="dst-panel md:col-span-5 lg:col-span-4">
            <div className="flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3">
              <span className="dst-label text-[color:var(--somma)]">Uma bateria</span>
              <span className="dst-label text-[color:rgba(242,240,236,0.4)]">
                {COMPETICAO.esteirasPorBateria} esteiras
              </span>
            </div>

            <div className="flex items-end justify-center gap-3 px-5 py-8 sm:gap-5">
              {Array.from({ length: COMPETICAO.esteirasPorBateria }, (_, i) => (
                <div key={i} className="bat-esteira flex flex-col items-center gap-3">
                  <span className="bat-atleta" aria-hidden>
                    <svg width="26" height="34" viewBox="0 0 24 32" fill="none">
                      <circle cx="12" cy="5" r="4" fill="var(--somma)" />
                      <path
                        d="M12 10c-3 0-5 2-5 5v7h3v10h4V22h3v-7c0-3-2-5-5-5z"
                        fill="var(--paper)"
                      />
                    </svg>
                  </span>
                  <span
                    className="bat-fita block h-[86px] w-[42px] border border-[color:var(--line)] sm:w-[48px]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(255,255,255,.14) 0 2px, transparent 2px 12px)",
                      backgroundColor: "var(--ink)",
                    }}
                    aria-hidden
                  />
                  <span className="dst-label text-[0.5rem] text-[color:rgba(242,240,236,0.35)]">
                    0{i + 1}
                  </span>
                </div>
              ))}
            </div>

            <p className="dst-label border-t border-[color:var(--line)] px-5 py-3 text-center text-[color:rgba(242,240,236,0.5)]">
              {COMPETICAO.esteirasPorBateria} pessoas correndo ao mesmo tempo
            </p>
          </div>

          {/* A grade acompanhando a procura */}
          <div className="md:col-span-7 lg:col-span-8">
            <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">
              A grade acompanha a procura
            </p>

            <ul className="space-y-3">
              {EXEMPLOS.map((inscritos) => {
                const baterias = bateriasNecessarias(inscritos);
                return (
                  <li key={inscritos} className="bat-linha dst-panel flex items-center gap-4 p-5">
                    <span
                      className="dst-num grid h-12 w-12 shrink-0 place-items-center text-[1.05rem] font-bold"
                      style={{ background: "var(--ink-3)", color: "var(--somma)" }}
                    >
                      {inscritos}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="dst-display dst-display-condensed text-[clamp(1.1rem,3.4vw,1.5rem)]">
                        {baterias} bateria{baterias === 1 ? "" : "s"}
                      </p>
                      <p className="dst-label mt-1.5 text-[color:rgba(242,240,236,0.45)]">
                        {inscritos} inscritos na categoria
                      </p>
                    </div>
                    {/* uma marca por bateria: a grade crescendo se lê de relance */}
                    <span className="flex shrink-0 flex-wrap justify-end gap-1.5" aria-hidden>
                      {Array.from({ length: baterias }, (_, i) => (
                        <span
                          key={i}
                          className="block h-2.5 w-2.5 rounded-full"
                          style={{ background: "var(--somma)" }}
                        />
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div
              className="bat-total mt-3 flex flex-wrap items-center justify-between gap-4 p-6"
              style={{ background: "var(--energia)", color: "#fff" }}
            >
              <div>
                <p className="dst-label opacity-85">Vagas para competir</p>
                <p className="dst-display mt-2 text-[clamp(1.8rem,6vw,2.8rem)]">SEM LIMITE</p>
              </div>
              <p className="dst-num max-w-[22ch] text-right text-[0.85rem] leading-relaxed opacity-90">
                inscritos ÷ {COMPETICAO.esteirasPorBateria} esteiras = baterias
              </p>
            </div>
          </div>
        </div>

        {/* O que continua valendo */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              k: "Por bateria",
              v: COMPETICAO.esteirasPorBateria,
              d: "uma pessoa por esteira",
            },
            { k: "Unidades", v: UNITS.length, d: "correndo ao mesmo tempo" },
            { k: "Categorias", v: 2, d: "feminino e masculino" },
          ].map((c) => (
            <div key={c.k} className="dst-panel p-5">
              <p className="dst-label text-[color:rgba(242,240,236,0.4)]">{c.k}</p>
              <p className="dst-num mt-2.5 text-[2.4rem] font-bold leading-none">{c.v}</p>
              <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">{c.d}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-[60ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.55)]">
          A organização define em qual bateria você corre depois da inscrição, e isso aparece no
          seu ticket.
        </p>

        {abertas && (
          <div className="mt-10">
            <Link
              href={`${EVENT_PATH}/inscricao`}
              onClick={() => track("begin_registration", { origem: "secao_formato" })}
              className="dst-btn dst-btn--xl w-full sm:w-auto sm:min-w-[340px]"
            >
              Garantir minha vaga
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
