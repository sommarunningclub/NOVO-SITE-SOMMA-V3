"use client";

import { useEffect } from "react";
import { COPY, TIMELINE, type Ato } from "@/lib/sunday-social-run/event.config";
import { observeSection } from "@/lib/sunday-social-run/analytics";
import { gsap, useScope } from "../_motion";
import { Fit, Label } from "./base";

/** Cor de cada ato dentro da timeline — a manhã muda de dono conforme avança. */
const COR_ATO: Record<Ato, string> = {
  run: "var(--somma)",
  connect: "var(--gold)",
  stay: "var(--terra)",
};

/**
 * SCENE 05/06 — A MANHÃ.
 *
 * Não é uma tabela de horários: é a passagem do tempo. Um relógio gigante fica
 * fixo enquanto a lista corre, e ele marca a hora do momento que está sendo
 * lido — das 07:00 às 12:00, a manhã inteira acontece na barra de progresso ao
 * lado. A linha vertical se preenche conforme a leitura avança.
 */
export function SundayJourney() {
  const root = useScope<HTMLElement>(({ root }) => {
    const lista = root.querySelector<HTMLElement>(".jornada-lista");
    const relogio = root.querySelector<HTMLElement>(".jornada-relogio");
    const rotulo = root.querySelector<HTMLElement>(".jornada-rotulo");
    const trilho = root.querySelector<HTMLElement>(".jornada-trilho");
    if (!lista) return;

    // A linha se preenche do primeiro ao último momento.
    if (trilho) {
      gsap.fromTo(
        trilho,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: lista, start: "top 70%", end: "bottom 75%", scrub: 0.4 },
        }
      );
    }

    const itens = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".jornada-item"));

    itens.forEach((item, i) => {
      // entrada do bloco
      gsap.fromTo(
        item,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 88%", once: true },
        }
      );

      // o relógio segue a leitura
      gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: "top 62%",
          end: "bottom 62%",
          onToggle: (self) => {
            if (!self.isActive) return;
            const momento = TIMELINE[i];
            item.dataset.ativo = "sim";

            if (relogio) {
              gsap.fromTo(
                relogio,
                { yPercent: 18, opacity: 0.2 },
                { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", overwrite: true }
              );
              relogio.textContent = momento.hora;
              relogio.style.color = COR_ATO[momento.ato];
            }
            if (rotulo) {
              gsap.fromTo(rotulo, { opacity: 0 }, { opacity: 1, duration: 0.5, overwrite: true });
              rotulo.textContent = momento.titulo;
            }
          },
        },
      });
    });
  });

  useEffect(() => observeSection(root.current, "timeline_view"), [root]);

  return (
    <section ref={root} id="domingo" aria-labelledby="domingo-titulo" className="ris-section relative">
      <div className="ris-wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Label className="text-[color:var(--somma)]">05 · A manhã</Label>
            <h2 id="domingo-titulo" className="mt-5">
              <Fit linhas={COPY.jornada.titulo} col={7} max="8rem" min="2.6rem" />
            </h2>
          </div>
          <p className="ris-lead text-[clamp(1.3rem,3.4vw,1.9rem)] leading-tight md:col-span-5 md:pb-2">
            {COPY.jornada.linha}
          </p>
        </div>

        <div className="relative mt-12 md:mt-16 md:grid md:grid-cols-12 md:gap-12">
          {/* Relógio — acompanha a leitura */}
          <div className="mb-8 md:col-span-4 md:mb-0">
            <div className="sticky top-[calc(env(safe-area-inset-top)+4.2rem)] z-20">
              <div className="ris-card flex items-center gap-4 p-4 md:block md:!border-0 md:!bg-transparent md:p-0 md:!backdrop-blur-none">
                <div className="overflow-hidden">
                  <div className="jornada-relogio ris-mono text-[2.6rem] font-bold leading-none text-[color:var(--somma)] md:text-[clamp(4rem,7vw,6.5rem)]">
                    {TIMELINE[0].hora}
                  </div>
                </div>
                <div className="min-w-0 md:mt-3">
                  <div className="jornada-rotulo ris-display truncate text-[1.05rem] leading-none md:text-[1.6rem]">
                    {TIMELINE[0].titulo}
                  </div>
                  <div className="ris-label mt-2 hidden opacity-45 md:block">
                    Santa Monica · Eixão · Santa Monica
                  </div>
                </div>
              </div>

              {/* a manhã inteira em uma régua */}
              <div className="mt-6 hidden md:block">
                <div className="ris-label mb-2 flex justify-between opacity-40">
                  <span>07:00</span>
                  <span>12:00</span>
                </div>
                <div className="h-px w-full bg-[color:var(--line)]" />
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {(["run", "connect", "stay"] as const).map((ato) => (
                    <span key={ato} className="ris-label flex items-center gap-2 opacity-60">
                      <span className="h-2 w-2 rounded-full" style={{ background: COR_ATO[ato] }} aria-hidden />
                      {ato}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de momentos */}
          <ol className="jornada-lista relative md:col-span-8">
            {/* trilho da linha */}
            <span className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-[color:var(--line)] md:left-[9px]" aria-hidden />
            <span
              className="jornada-trilho absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-[color:var(--somma)] md:left-[9px]"
              aria-hidden
            />

            {TIMELINE.map((m) => (
              <li
                key={m.hora}
                className="jornada-item group relative pb-7 pl-8 last:pb-0 md:pl-12"
                data-ato={m.ato}
              >
                <span
                  className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border md:h-[19px] md:w-[19px]"
                  style={{ borderColor: COR_ATO[m.ato] }}
                  aria-hidden
                >
                  {m.destaque && (
                    <span className="block h-2 w-2 rounded-full" style={{ background: COR_ATO[m.ato] }} />
                  )}
                </span>

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="ris-mono text-[0.95rem] font-bold leading-none md:text-[1.05rem]">{m.hora}</span>
                  <h3
                    className="ris-display text-[1.25rem] leading-none md:text-[1.9rem]"
                    style={m.destaque ? { color: COR_ATO[m.ato] } : undefined}
                  >
                    {m.titulo}
                  </h3>
                </div>
                <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed opacity-65">{m.detalhe}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
