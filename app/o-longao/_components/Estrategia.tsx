"use client";

import { ESTRATEGIA } from "@/lib/o-longao/copy";
import { maskReveal, riseIn, slideIn, useScope } from "../_motion";

/**
 * A estratégia: as quatro frentes que decidem 24 horas.
 *
 * Seção de papel de propósito: é o momento "quadro tático" da página, luz
 * acesa entre dois trechos de noite. Os pilares entram alternados (esquerda,
 * direita) como turnos de revezamento; o fecho sobe por máscara e a última
 * frase carrega o laranja de largada.
 */

// O destaque do fecho é sempre a última frase. Derivado do copy, não digitado
// aqui: mudou a frase em copy.ts, o destaque acompanha.
const SENTENCAS_FECHO = ESTRATEGIA.fecho
  .split(". ")
  .map((s, i, arr) => (i < arr.length - 1 ? `${s}.` : s));

export function Estrategia() {
  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".est-head"), { trigger: root, start: "top 78%" });

    // Turnos alternados: pilar ímpar entra da esquerda, par da direita.
    root.querySelectorAll<HTMLElement>(".est-pilar").forEach((el, i) => {
      slideIn(el, i % 2 === 0 ? "left" : "right", { trigger: el, distance: 48 });
    });

    maskReveal(root.querySelectorAll(".est-fecho > *"), {
      trigger: root.querySelector(".est-fecho-bloco") ?? root,
      start: "top 80%",
    });
  });

  return (
    <section
      ref={root}
      id="estrategia"
      className="lgo-section lgo-paper relative scroll-mt-16 overflow-hidden"
      aria-labelledby="estrategia-titulo"
    >
      <div className="lgo-wrap">
        <p className="est-head lgo-label flex items-center gap-3 text-[color:var(--noite)]">
          <span className="block h-2 w-2 bg-[color:var(--somma)]" aria-hidden />
          {ESTRATEGIA.kicker}
        </p>

        <h2
          id="estrategia-titulo"
          className="est-head lgo-display lgo-display-condensed mt-6 max-w-[24ch] text-[clamp(1.9rem,5.5vw,3.6rem)]"
        >
          {ESTRATEGIA.intro}
        </h2>

        {/* As quatro frentes */}
        <div className="mt-12 grid gap-x-10 gap-y-12 md:mt-20 md:grid-cols-2 md:gap-x-16 md:gap-y-20">
          {ESTRATEGIA.pilares.map((pilar, i) => (
            <article key={pilar.titulo} className="est-pilar flex flex-col">
              <span
                className="lgo-mono text-[0.9rem] font-semibold text-[color:var(--somma)]"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="lgo-display mt-4 text-[clamp(3rem,12vw,5.8rem)]">{pilar.titulo}</h3>
              <p className="mt-4 max-w-[36ch] text-[0.95rem] leading-relaxed text-[color:rgba(5,5,8,0.68)] md:mb-8">
                {pilar.texto}
              </p>
              {/* Hairline no tom do papel: o var(--line) padrão é branco e some aqui. */}
              <span
                className="lgo-hairline mt-8 block w-full md:mt-auto"
                style={{ background: "var(--line-dark)" }}
                aria-hidden
              />
            </article>
          ))}
        </div>

        {/* Fecho: a tese da prova, com a última frase em laranja de largada */}
        <div className="est-fecho-bloco mt-16 border-t border-[color:var(--line-dark)] pt-10 md:mt-24 md:pt-14">
          <p className="lgo-display max-w-[20ch] text-[clamp(2.2rem,7vw,5rem)]">
            {SENTENCAS_FECHO.map((sentenca, i) => (
              <span key={sentenca} className="lgo-mask est-fecho">
                <span
                  className={
                    i === SENTENCAS_FECHO.length - 1 ? "text-[color:var(--somma)]" : undefined
                  }
                >
                  {sentenca}
                </span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
