"use client";

import Link from "next/link";
import {
  BATERIAS,
  COMPETICAO,
  EVENT_PATH,
  UNITS,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  VAGAS_TOTAIS,
  inscricoesAbertas,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { EASE, gsap, maskReveal, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * O formato da disputa, explicado sem parecer regulamento.
 *
 * A animação conta a regra na ordem em que ela faz sentido: primeiro as quatro
 * esteiras aparecem, depois quatro pessoas ocupam as esteiras (uma bateria),
 * então as três baterias se empilham e o total de 12 aparece. Quem não vê a
 * animação (movimento reduzido) lê exatamente a mesma coisa parada.
 */
export function Baterias() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".bat-titulo > *"), { trigger: root, start: "top 76%" });

    const tl = gsap.timeline({
      defaults: { ease: EASE.out },
      scrollTrigger: { trigger: root.querySelector(".bat-palco"), start: "top 72%", once: true },
    });

    // 1. as quatro esteiras surgem
    tl.fromTo(
      root.querySelectorAll(".bat-esteira"),
      { scaleY: 0, opacity: 0, transformOrigin: "bottom center" },
      { scaleY: 1, opacity: 1, duration: 0.6, stagger: 0.09 }
    )
      // 2. um corredor entra em cada uma
      .fromTo(
        root.querySelectorAll(".bat-atleta"),
        { y: -18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.09 },
        "-=0.15"
      )
      // 3. a bateria fecha e as três se empilham
      .fromTo(
        root.querySelectorAll(".bat-linha"),
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.65, stagger: 0.14 },
        "+=0.15"
      )
      .fromTo(
        root.querySelector(".bat-total"),
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.6)" },
        "-=0.2"
      );

    // pulso contínuo nas esteiras: a sensação de que estão rodando
    gsap.to(root.querySelectorAll(".bat-fita"), {
      backgroundPositionY: "-24px",
      duration: 0.9,
      ease: "none",
      repeat: -1,
      stagger: 0.12,
    });
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
              `${COMPETICAO.bateriasPorCategoria} BATERIAS.`,
              `${VAGAS_POR_CATEGORIA} VAGAS POR CATEGORIA.`,
            ]}
            maskClass="bat-titulo"
            max="7rem"
            min="1.9rem"
          />
        </h2>

        <p className="mt-8 max-w-[54ch] text-[clamp(1rem,2.6vw,1.2rem)] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
          Em cada unidade a disputa é dividida entre Feminino e Masculino. Cada categoria tem{" "}
          <strong className="text-[color:var(--paper)]">{VAGAS_POR_CATEGORIA} participantes</strong>,
          divididos em <strong className="text-[color:var(--paper)]">
            {COMPETICAO.bateriasPorCategoria} baterias de {COMPETICAO.esteirasPorBateria} competidores
          </strong>.
        </p>

        {/* ── O palco: esteiras → bateria → total ── */}
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
                  {/* corredor */}
                  <span className="bat-atleta" aria-hidden>
                    <svg width="26" height="34" viewBox="0 0 24 32" fill="none">
                      <circle cx="12" cy="5" r="4" fill="var(--somma)" />
                      <path
                        d="M12 10c-3 0-5 2-5 5v7h3v10h4V22h3v-7c0-3-2-5-5-5z"
                        fill="var(--paper)"
                      />
                    </svg>
                  </span>
                  {/* esteira */}
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

          {/* As três baterias */}
          <div className="md:col-span-7 lg:col-span-8">
            <ul className="space-y-3">
              {BATERIAS.map((n) => (
                <li key={n} className="bat-linha dst-panel flex items-center gap-4 p-5">
                  <span
                    className="dst-num grid h-12 w-12 shrink-0 place-items-center text-[1.1rem] font-bold"
                    style={{ background: "var(--ink-3)", color: "var(--somma)" }}
                  >
                    {n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="dst-display dst-display-condensed text-[clamp(1.1rem,3.4vw,1.5rem)]">
                      Bateria {n}
                    </p>
                    <p className="dst-label mt-1.5 text-[color:rgba(242,240,236,0.45)]">
                      {COMPETICAO.esteirasPorBateria} competidores
                    </p>
                  </div>
                  <span className="flex shrink-0 gap-1.5" aria-hidden>
                    {Array.from({ length: COMPETICAO.esteirasPorBateria }, (_, i) => (
                      <span
                        key={i}
                        className="block h-2.5 w-2.5 rounded-full"
                        style={{ background: "var(--somma)" }}
                      />
                    ))}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="bat-total mt-3 flex flex-wrap items-center justify-between gap-4 p-6"
              style={{ background: "var(--energia)", color: "#fff" }}
            >
              <div>
                <p className="dst-label opacity-85">Por categoria, em cada unidade</p>
                <p className="dst-display mt-2 text-[clamp(1.8rem,6vw,2.8rem)]">
                  {VAGAS_POR_CATEGORIA} VAGAS
                </p>
              </div>
              <p className="dst-num text-right text-[0.85rem] leading-relaxed opacity-90">
                {COMPETICAO.bateriasPorCategoria} × {COMPETICAO.esteirasPorBateria} ={" "}
                {VAGAS_POR_CATEGORIA}
              </p>
            </div>
          </div>
        </div>

        {/* A conta fechando */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Por unidade", v: VAGAS_POR_UNIDADE, d: `${VAGAS_POR_CATEGORIA} fem + ${VAGAS_POR_CATEGORIA} masc` },
            { k: "Unidades", v: UNITS.length, d: "correndo ao mesmo tempo" },
            { k: "No total", v: VAGAS_TOTAIS, d: "competidores no Desafio", destaque: true },
          ].map((c) => (
            <div
              key={c.k}
              className="dst-panel p-5"
              style={c.destaque ? { borderColor: "rgba(255,44,4,0.5)" } : undefined}
            >
              <p className="dst-label text-[color:rgba(242,240,236,0.4)]">{c.k}</p>
              <p
                className="dst-num mt-2.5 text-[2.4rem] font-bold leading-none"
                style={{ color: c.destaque ? "var(--somma)" : "var(--paper)" }}
              >
                {c.v}
              </p>
              <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">{c.d}</p>
            </div>
          ))}
        </div>

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
