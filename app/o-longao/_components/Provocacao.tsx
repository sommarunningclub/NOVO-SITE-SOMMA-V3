"use client";

import { PROVOCACAO, FRASES } from "@/lib/o-longao/copy";
import { EASE, gsap, isLowPower, maskReveal, pinnedTimeline, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * O bloco de impacto: "Você chama isso de longão?".
 *
 * No desktop a seção é fixada e a sequência acontece no scrub — os números
 * clássicos aparecem, são riscados um a um, e cedem lugar às 24 horas. No
 * mobile o mesmo DOM é revelado por scroll comum: o pin muda o motion, nunca
 * o markup, e a página continua legível sem JS.
 */
export function Provocacao() {
  const root = useScope<HTMLElement>(({ root }) => {
    const numeros = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".js-num"));
    const riscos = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".js-risco"));
    const resposta = root.querySelector<HTMLElement>(".js-resposta");
    const fecho = root.querySelector<HTMLElement>(".js-fecho");
    const regua = root.querySelector<HTMLElement>(".js-regua");

    // Estado inicial: o GSAP é dono dos dois extremos (nada escondido no CSS).
    gsap.set(riscos, { scaleX: 0, transformOrigin: "left center" });
    gsap.set([resposta, fecho], { opacity: 0, y: 40 });
    gsap.set(regua, { scaleX: 0, transformOrigin: "left center" });

    if (isLowPower()) {
      // Sem pin: cada peça entra na sua vez, por scroll.
      maskReveal(root.querySelectorAll(".js-pergunta > *"), { trigger: root });
      numeros.forEach((num, i) => {
        gsap.fromTo(
          num,
          { opacity: 0, y: 28 },
          {
            opacity: 0.35,
            y: 0,
            duration: 0.7,
            ease: EASE.soft,
            scrollTrigger: { trigger: num, start: "top 85%", once: true },
          }
        );
        gsap.to(riscos[i], {
          scaleX: 1,
          duration: 0.5,
          ease: EASE.out,
          scrollTrigger: { trigger: num, start: "top 78%", once: true },
        });
      });
      riseIn([resposta, fecho].filter(Boolean) as HTMLElement[], {
        trigger: resposta ?? root,
        stagger: 0.15,
      });
      gsap.to(regua, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top 60%", end: "bottom bottom", scrub: 0.5 },
      });
      return;
    }

    const tl = pinnedTimeline(root, { distance: 2600 });

    tl.from(root.querySelectorAll(".js-pergunta > *"), {
      yPercent: 105,
      duration: 1,
      stagger: 0.08,
      ease: EASE.out,
    });

    // Cada distância entra, é riscada e apaga: o longão de sempre ficando pequeno.
    numeros.forEach((num, i) => {
      tl.fromTo(num, { opacity: 0, y: 30 }, { opacity: 0.38, y: 0, duration: 0.7, ease: EASE.soft }, ">-0.15")
        .to(riscos[i], { scaleX: 1, duration: 0.5, ease: EASE.out }, ">-0.2")
        .to(num, { opacity: 0.14, duration: 0.4 }, ">-0.1");
    });

    tl.to(numeros, { opacity: 0.06, y: -20, duration: 0.6, stagger: 0.04 }, ">")
      .to(resposta, { opacity: 1, y: 0, duration: 1, ease: EASE.out }, ">-0.3")
      // tremor curto de chegada: o número assenta como um cronômetro travando
      .fromTo(resposta, { scale: 1.04 }, { scale: 1, duration: 0.5, ease: "power4.out" }, "<")
      .to(fecho, { opacity: 1, y: 0, duration: 0.8, ease: EASE.out }, ">-0.35");

    // A régua das 24 horas acompanha o progresso do bloco inteiro.
    tl.to(regua, { scaleX: 1, ease: "none", duration: tl.duration() }, 0);
  });

  return (
    <section
      ref={root}
      id="desafio"
      className="lgo-grain relative isolate flex min-h-[100svh] scroll-mt-16 flex-col justify-center overflow-hidden py-20 md:py-0"
      aria-labelledby="provocacao-titulo"
    >
      <div className="lgo-lanes" aria-hidden />

      <div className="lgo-wrap relative">
        <p className="lgo-label mb-6 text-[color:rgba(242,240,236,0.45)]">{FRASES.seuLongao}</p>

        <h2 id="provocacao-titulo" className="js-pergunta">
          <FitLines linhas={[PROVOCACAO.pergunta.toUpperCase()]} max="7.5rem" min="1.8rem" />
        </h2>

        {/* As distâncias de sempre, riscadas uma a uma */}
        <ul className="mt-10 flex flex-col gap-1 md:mt-14 md:flex-row md:items-baseline md:gap-12">
          {PROVOCACAO.distancias.map((d) => (
            <li key={d} className="relative w-fit">
              <span className="js-num lgo-display block text-[clamp(2.75rem,11vw,6.5rem)] leading-none text-[color:var(--papel)]">
                {d}
              </span>
              <span
                aria-hidden
                className="js-risco absolute left-0 top-1/2 block h-[3px] w-full -translate-y-1/2 bg-[color:var(--somma)]"
              />
            </li>
          ))}
        </ul>

        {/* A resposta toma a tela */}
        <div className="js-resposta mt-10 md:mt-16">
          <FitLines
            linhas={[PROVOCACAO.resposta]}
            max="16rem"
            min="3rem"
            className="text-[color:var(--sinal)]"
          />
        </div>

        <p className="js-fecho lgo-display lgo-display-condensed mt-5 text-[clamp(1.5rem,5.5vw,3rem)] text-[color:var(--papel)]">
          {PROVOCACAO.fecho}
        </p>
      </div>

      {/* Régua de 24 marcas: enche conforme a sequência avança */}
      <div className="lgo-wrap relative mt-12 md:absolute md:inset-x-0 md:bottom-10 md:mt-0">
        <div className="lgo-hours" aria-hidden />
        <div className="mt-1.5 h-[2px] overflow-hidden">
          <div
            aria-hidden
            className="js-regua h-full w-full"
            style={{ background: "var(--timing)" }}
          />
        </div>
      </div>
    </section>
  );
}
