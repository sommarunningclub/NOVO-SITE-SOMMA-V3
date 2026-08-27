"use client";

import { useState } from "react";
import { FAQ, FRASES } from "@/lib/o-longao/copy";
import { maskReveal, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * FAQ em papel: o respiro claro antes do fecho escuro da página.
 *
 * Acordeão nativo em `dl`: cada pergunta é um botão com `aria-expanded` e a
 * resposta some via `hidden` — sem JS a página degrada para a primeira
 * resposta aberta, e leitores de tela navegam a lista como definições.
 */
export function Faq() {
  const [aberto, setAberto] = useState<number | null>(0);

  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".faq-titulo > *"), { trigger: root, start: "top 80%" });
    riseIn(root.querySelectorAll(".faq-item"), { trigger: root, start: "top 76%", stagger: 0.04 });
  });

  return (
    <section
      ref={root}
      id="faq"
      className="lgo-paper lgo-section scroll-mt-16"
      aria-labelledby="faq-titulo"
    >
      <div className="lgo-wrap grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-4">
          <p className="lgo-label mb-6 text-[color:var(--evolve)]">{FRASES.dormirEstrategia}</p>
          <h2 id="faq-titulo" className="lgo-col-4">
            <FitLines linhas={["PERGUNTAS"]} maskClass="faq-titulo" max="7.5rem" min="2.4rem" />
          </h2>
        </div>

        <dl className="md:col-span-8">
          {FAQ.map((item, i) => {
            const expandido = aberto === i;
            return (
              <div key={item.p} className="faq-item border-b border-[color:var(--line-dark)]">
                <dt>
                  <button
                    type="button"
                    onClick={() => setAberto(expandido ? null : i)}
                    aria-expanded={expandido}
                    aria-controls={`faq-r-${i}`}
                    className="flex min-h-[44px] w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="lgo-display lgo-display-condensed text-[clamp(1.05rem,3.6vw,1.5rem)]">
                      {item.p}
                    </span>
                    <span
                      aria-hidden
                      className="relative block h-4 w-4 shrink-0 transition-transform duration-300"
                      style={{ transform: expandido ? "rotate(135deg)" : "none" }}
                    >
                      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[color:var(--somma)]" />
                      <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[color:var(--somma)]" />
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-r-${i}`}
                  hidden={!expandido}
                  className="max-w-[62ch] pb-6 text-[0.98rem] leading-relaxed text-[color:rgba(5,5,8,0.72)]"
                >
                  {item.r}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
