"use client";

import { useState } from "react";
import { FAQ } from "@/lib/desafio-esteiras/event.config";
import { riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * FAQ. Perguntas cuja resposta ainda não foi definida pela organização vêm
 * com `r: null` no config — em vez de inventar uma regra, a página diz que a
 * informação será confirmada. Basta preencher o config para a resposta aparecer.
 */
export function Faq() {
  const [aberto, setAberto] = useState<number | null>(0);

  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".faq-item"), { trigger: root, start: "top 80%", stagger: 0.05 });
  });

  return (
    <section
      ref={root}
      id="faq"
      className="dst-paper dst-section scroll-mt-16"
      aria-labelledby="faq-titulo"
    >
      <div className="dst-wrap grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-4">
          <p className="dst-label mb-6 text-[color:var(--evolve)]">Dúvidas</p>
          <h2 id="faq-titulo" className="dst-col-4">
            <FitLines linhas={["PERGUNTAS", "FREQUENTES"]} max="4.5rem" min="1.9rem" />
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
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="dst-display dst-display-condensed text-[clamp(1.05rem,3.6vw,1.5rem)]">
                      {item.p}
                    </span>
                    <span
                      aria-hidden
                      className="relative block h-4 w-4 shrink-0 transition-transform duration-300"
                      style={{ transform: expandido ? "rotate(135deg)" : "none" }}
                    >
                      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[color:var(--evolve)]" />
                      <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[color:var(--evolve)]" />
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-r-${i}`}
                  hidden={!expandido}
                  className="max-w-[62ch] pb-6 text-[0.98rem] leading-relaxed text-[color:rgba(8,8,10,0.72)]"
                >
                  {item.r ?? (
                    <span className="italic opacity-70">
                      Estamos confirmando essa informação com a organização. Assim que estiver
                      definida, ela aparece aqui.
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
