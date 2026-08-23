"use client";

import { COMO_FUNCIONA, COPY } from "@/lib/sunday-social-run/event.config";
import { gsap, useScope } from "../_motion";
import { Label, TicketCta } from "./base";

/**
 * COMO FUNCIONA — a parte prática.
 *
 * Quem nunca foi a um evento assim precisa entender a mecânica antes de decidir
 * comprar: onde compra, o que recebe, o que faz no domingo. São quatro passos
 * curtos, na ordem em que acontecem, e nenhum deles depende de já conhecer o
 * SOMMA, a Hype ou o Santa Monica.
 */
export function ComoFunciona() {
  const root = useScope<HTMLElement>(({ root }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".passo"),
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.querySelector(".passos"), start: "top 82%", once: true },
      }
    );

    // a linha que liga os passos cresce conforme a leitura
    gsap.fromTo(
      root.querySelector(".passos-linha"),
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: root.querySelector(".passos"), start: "top 78%", end: "bottom 70%", scrub: 0.5 },
      }
    );
  });

  return (
    <section ref={root} id="como-funciona" aria-labelledby="como-titulo" className="ris-section pt-0 md:pt-0">
      <div className="ris-wrap">
        <div className="grid gap-5 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Label className="text-[color:var(--somma)]">Como funciona</Label>
            <h2 id="como-titulo" className="ris-display mt-4 text-[clamp(2rem,6vw,3.6rem)] leading-[0.9]">
              QUATRO PASSOS E VOCÊ ESTÁ DENTRO
            </h2>
          </div>
          <p className="ris-lead text-[clamp(1.1rem,2.6vw,1.5rem)] opacity-70 md:col-span-5 md:pb-2">
            Do download até o brunch, sem letra miúda.
          </p>
        </div>

        <div className="passos relative mt-10 md:mt-14">
          {/* trilho que liga os quatro passos no desktop */}
          <span className="absolute left-0 right-0 top-[26px] hidden h-px bg-[color:var(--line)] md:block" aria-hidden />
          <span
            className="passos-linha absolute left-0 right-0 top-[26px] hidden h-px origin-left bg-[color:var(--somma)] md:block"
            aria-hidden
          />

          <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
            {COMO_FUNCIONA.map((p) => (
              <li key={p.passo} className="passo relative">
                <span className="ris-mono relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--cream-70)] text-[0.82rem] font-bold backdrop-blur-sm">
                  {p.passo}
                </span>
                <h3 className="ris-display mt-4 text-[1.15rem] leading-tight md:text-[1.35rem]">{p.titulo}</h3>
                <p className="mt-2 max-w-[34ch] text-[0.92rem] leading-relaxed opacity-70">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <TicketCta origem="como_funciona">{COPY.cta.principal}</TicketCta>
          <a
            href="#domingo"
            className="ris-btn"
            data-variant="ghost"
          >
            VER A PROGRAMAÇÃO
          </a>
        </div>
      </div>
    </section>
  );
}
