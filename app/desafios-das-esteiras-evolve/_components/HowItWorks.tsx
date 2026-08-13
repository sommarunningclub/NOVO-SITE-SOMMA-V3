"use client";

import { useState } from "react";
import { STEPS } from "@/lib/desafio-esteiras/event.config";
import { ScrollTrigger, gsap, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * Como vai funcionar — narrativa de scroll.
 *
 * A coluna esquerda fica sticky com o número do passo atual e a barra de
 * progresso; a direita rola. O passo ativo vem de ScrollTriggers individuais,
 * não de cálculo de posição no scroll — assim funciona igual em qualquer
 * altura de viewport.
 */
export function HowItWorks() {
  const [ativo, setAtivo] = useState(0);

  const root = useScope<HTMLElement>(({ root }) => {
    const passos = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".hiw-passo"));

    passos.forEach((passo, i) => {
      ScrollTrigger.create({
        trigger: passo,
        start: "top 62%",
        end: "bottom 62%",
        onEnter: () => setAtivo(i),
        onEnterBack: () => setAtivo(i),
      });

      gsap.fromTo(
        passo.querySelectorAll(".hiw-anim"),
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: passo, start: "top 84%", once: true },
        }
      );
    });

    // Barra de progresso: acompanha a leitura da lista inteira.
    gsap.fromTo(
      root.querySelector(".hiw-barra"),
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        transformOrigin: "top center",
        scrollTrigger: {
          trigger: root.querySelector(".hiw-lista"),
          start: "top 60%",
          end: "bottom 70%",
          scrub: 0.4,
        },
      }
    );
  });

  const progresso = ((ativo + 1) / STEPS.length) * 100;

  return (
    <section
      ref={root}
      id="como-funciona"
      className="dst-section relative scroll-mt-16 overflow-hidden"
      aria-labelledby="como-funciona-titulo"
    >
      <div className="dst-wrap">
        <p className="dst-label mb-6 text-[color:var(--somma)]">Passo a passo</p>
        <h2 id="como-funciona-titulo">
          <FitLines linhas={["COMO VAI", "FUNCIONAR"]} max="8rem" min="2.2rem" />
        </h2>

        <div className="mt-12 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-14">
          {/* Coluna sticky */}
          <div className="md:col-span-5 lg:col-span-4">
            <div className="md:sticky md:top-28">
              <div className="dst-panel p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span
                    className="dst-num block text-[clamp(4rem,14vw,8rem)] font-bold leading-[0.8] tabular-nums"
                    style={{ color: "var(--somma)" }}
                    aria-hidden
                  >
                    {STEPS[ativo].n}
                  </span>
                  <span className="dst-label text-[color:rgba(242,240,236,0.4)]">
                    {ativo + 1}/{STEPS.length}
                  </span>
                </div>

                <p className="dst-display mt-6 text-[clamp(1.3rem,4vw,1.9rem)]" aria-live="polite">
                  {STEPS[ativo].titulo}
                </p>

                {/* Progressão — a "distância" percorrida na jornada */}
                <div className="mt-7">
                  <div className="dst-label mb-2 flex justify-between text-[color:rgba(242,240,236,0.4)]">
                    <span>Progresso</span>
                    <span className="dst-num">{Math.round(progresso)}%</span>
                  </div>
                  <div className="h-[3px] w-full bg-[color:var(--line)]">
                    <div
                      className="h-full origin-left transition-transform duration-700 ease-out"
                      style={{
                        background: "var(--energia)",
                        transform: `scaleX(${progresso / 100})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passos */}
          <ol className="hiw-lista relative md:col-span-7 lg:col-span-8">
            {/* trilho + barra que preenche com o scroll */}
            <span
              aria-hidden
              className="absolute left-[13px] top-2 hidden h-[calc(100%-1rem)] w-px bg-[color:var(--line)] sm:block"
            >
              {/* O estado inicial (scaleY 0) é aplicado pelo GSAP em `fromTo`.
                  Consultar matchMedia aqui no render causaria divergência de
                  hidratação: o servidor não sabe a preferência de movimento. */}
              <span
                className="hiw-barra absolute inset-0 block origin-top"
                style={{ background: "var(--energia)" }}
              />
            </span>

            {STEPS.map((passo, i) => (
              <li
                key={passo.n}
                className="hiw-passo relative border-b border-[color:var(--line)] py-7 sm:pl-12 md:py-9"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-[2.15rem] hidden h-[27px] w-[27px] items-center justify-center rounded-full border transition-colors duration-500 sm:flex"
                  style={{
                    borderColor: i <= ativo ? "var(--somma)" : "var(--line)",
                    background: i <= ativo ? "var(--somma)" : "var(--ink)",
                  }}
                >
                  <span
                    className="block h-1.5 w-1.5 rounded-full transition-colors duration-500"
                    style={{ background: i <= ativo ? "var(--ink)" : "rgba(242,240,236,0.35)" }}
                  />
                </span>

                <div className="hiw-anim flex items-baseline gap-4">
                  <span className="dst-num text-sm font-bold text-[color:var(--somma)]">{passo.n}</span>
                  <h3 className="dst-display dst-display-condensed text-[clamp(1.5rem,5.5vw,2.7rem)]">
                    {passo.titulo}
                  </h3>
                </div>
                <p className="hiw-anim mt-2 max-w-[46ch] pl-8 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.6)] sm:pl-9">
                  {passo.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
