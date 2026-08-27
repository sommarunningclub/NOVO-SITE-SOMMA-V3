"use client";

import { TIMELINE_24H } from "@/lib/o-longao/config";
import { FRASES } from "@/lib/o-longao/copy";
import { EASE, gsap, isLowPower, maskReveal, pinnedTimeline, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * As 24 horas, marco a marco.
 *
 * Desktop: a seção é fixada e o trilho de cartões corre na horizontal com o
 * scrub, enquanto um marcador percorre a régua das horas no topo. Mobile:
 * a mesma lista, na vertical, com entradas por scroll. O DOM é o mesmo nos
 * dois casos.
 *
 * Os marcos da madrugada (00:00 e 03:00) recebem tratamento próprio: é ali
 * que a prova vira, e o visual precisa dizer isso antes do texto.
 */
const MADRUGADA = new Set(["00:00", "03:00"]);

export function Timeline24() {
  const root = useScope<HTMLElement>(({ root }) => {
    const trilho = root.querySelector<HTMLElement>(".js-trilho");
    const marcador = root.querySelector<HTMLElement>(".js-marcador");
    const cartoes = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".js-cartao"));

    if (isLowPower() || !trilho) {
      riseIn(cartoes, { trigger: root, stagger: 0.06, start: "top 85%" });
      maskReveal(root.querySelectorAll(".js-fecho > *"), {
        trigger: root.querySelector(".js-fecho") ?? root,
      });
      return;
    }

    // Distância a percorrer: o trilho inteiro menos a largura visível.
    const percorrer = () => Math.max(0, trilho.scrollWidth - trilho.parentElement!.clientWidth);

    const tl = pinnedTimeline(root, { distance: 3000, scrub: 0.7 });

    tl.to(trilho, { x: () => -percorrer(), ease: "none", duration: 1 }, 0);
    if (marcador) {
      tl.fromTo(marcador, { xPercent: 0 }, { xPercent: 2300, ease: "none", duration: 1 }, 0);
    }

    maskReveal(root.querySelectorAll(".js-fecho > *"), {
      trigger: root,
      start: "bottom 80%",
    });
  });

  return (
    <section
      ref={root}
      id="as-24-horas"
      className="lgo-madrugada relative isolate scroll-mt-16 overflow-hidden py-20 md:flex md:min-h-[100svh] md:flex-col md:justify-center md:py-0"
      aria-labelledby="timeline-titulo"
    >
      <div className="lgo-wrap">
        <p className="lgo-label text-[color:var(--sinal)]">COMO SÃO AS 24 HORAS</p>
        <h2 id="timeline-titulo" className="sr-only">
          Como são as 24 horas do Longão
        </h2>

        {/* Régua das horas com o marcador que percorre a prova */}
        <div className="relative mt-6 hidden md:block">
          <div className="lgo-hours" aria-hidden />
          <span
            aria-hidden
            className="js-marcador absolute -top-1 left-0 block h-4 w-1 bg-[color:var(--sinal)]"
          />
        </div>
      </div>

      {/* Trilho: horizontal no desktop (com pin), vertical no mobile */}
      <div className="mt-8 md:mt-12 md:overflow-hidden">
        <ol className="js-trilho flex flex-col gap-4 px-[max(1.125rem,4vw)] md:flex-row md:gap-6 md:px-[max(1.125rem,4vw)]">
          {TIMELINE_24H.map((marco) => {
            const noturno = MADRUGADA.has(marco.hora);
            return (
              <li
                key={`${marco.hora}-${marco.titulo}`}
                className={`js-cartao lgo-panel flex shrink-0 flex-col justify-between p-5 md:w-[340px] md:p-6 ${
                  noturno ? "bg-[color:#07070f]" : ""
                }`}
              >
                <div>
                  <span
                    className={`lgo-clock block text-[clamp(2.25rem,9vw,3.25rem)] ${
                      noturno ? "text-[color:var(--sinal)]" : "text-[color:var(--papel)]"
                    }`}
                  >
                    {marco.hora}
                  </span>
                  <div
                    aria-hidden
                    className="mt-4 h-[2px] w-12"
                    style={{ background: noturno ? "var(--sinal)" : "var(--somma)" }}
                  />
                  <h3 className="lgo-display lgo-display-condensed mt-4 text-[clamp(1.15rem,4.5vw,1.6rem)]">
                    {marco.titulo}
                  </h3>
                </div>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.6)]">
                  {marco.texto}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Fecho da seção: a frase que resume a madrugada */}
      <div className="lgo-wrap js-fecho mt-14 md:mt-16">
        <FitLines linhas={[FRASES.brasiliaDorme.toUpperCase()]} max="6.5rem" min="1.6rem" />
        <p className="lgo-label mt-5 text-[color:var(--sinal)]">{FRASES.paceConfortavel}</p>
      </div>
    </section>
  );
}
