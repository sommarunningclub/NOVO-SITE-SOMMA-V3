"use client";

import { COPY, TICKET_PRICE, EVENT_CAPACITY, dataLabel, vendaAberta } from "@/lib/sunday-social-run/event.config";
import { gsap, useScope } from "../_motion";
import { Fit, TicketCta } from "./base";
import { Assinatura } from "./Logos";
import { SignatureLine } from "./SignatureLine";

/**
 * A última dobra.
 *
 * Laranja pleno, uma pergunta e um botão. Depois de toda a jornada, a decisão
 * precisa caber em uma tela — sem nova informação, sem novo argumento, só a
 * pergunta que a página inteira vinha fazendo.
 */
export function FinalCTA() {
  const root = useScope<HTMLElement>(({ root }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".final-mask > *"),
      { yPercent: 112 },
      {
        yPercent: 0,
        duration: 1.25,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: "top 74%", once: true },
      }
    );

    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".final-fade"),
      { y: 22, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: root, start: "top 68%", once: true },
      }
    );
  });

  return (
    <section
      ref={root}
      id="garantir"
      aria-labelledby="final-titulo"
      className="ris-dark relative flex min-h-[96svh] flex-col justify-center overflow-hidden py-16 md:py-20"
    >
      <div className="ris-wrap">
        <h2 id="final-titulo">
          <Fit linhas={["WHO WILL", "YOU RUN", "INTO?"]} maskClass="final-mask" max="8.5rem" min="2.6rem" />
        </h2>

        <SignatureLine
          de="wave"
          para="connect"
          cor="var(--cream)"
          espessura={1.6}
          altura="clamp(60px,10vw,110px)"
          opacidade={0.5}
          className="my-6"
          start="top 92%"
          end="bottom 55%"
        />

        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="final-fade ris-lead text-[clamp(1.5rem,4.5vw,2.4rem)] leading-tight">{COPY.final.sub}</p>

            <div className="final-fade mt-7 flex items-end gap-8">
              <div>
                <div className="ris-mono text-[2.6rem] font-bold leading-none md:text-[3.4rem]">R$ {TICKET_PRICE}</div>
                <div className="ris-label mt-2 opacity-60">Ingresso promocional</div>
              </div>
              <div>
                <div className="ris-mono text-[2.6rem] font-bold leading-none md:text-[3.4rem]">{EVENT_CAPACITY}</div>
                <div className="ris-label mt-2 opacity-60">Vagas</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 md:pl-6">
            <TicketCta origem="cta_final" variant="cream" full className="final-fade">
              {COPY.cta.principal}
            </TicketCta>

            <p className="final-fade ris-label mt-4 opacity-70">
              {vendaAberta() ? COPY.ticket.texto : COPY.ticket.semLink}
            </p>

            <div className="final-fade mt-8 border-t border-[color:var(--line-strong)] pt-6">
              <Assinatura tom="mono" />
              <p className="ris-lead mt-4 text-[1.4rem] leading-none">{COPY.final.fecho}</p>
              <p className="ris-mono mt-3 text-[0.72rem] opacity-60">{dataLabel()} · Brasília</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
