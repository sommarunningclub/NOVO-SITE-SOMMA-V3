"use client";

import { ATOS, COPY } from "@/lib/sunday-social-run/event.config";
import { gsap, useScope } from "../_motion";
import { Marquee } from "./base";
import { LogoHypeOn, LogoSantaMonica, LogoSomma } from "./Logos";
import { SignatureLine } from "./SignatureLine";

/**
 * A tríade RUN · CONNECT · STAY.
 *
 * Emenda o hero: a frase gigante atravessa a tela na horizontal conforme a
 * pessoa rola (o único movimento horizontal do mobile, e ele é curto), e logo
 * abaixo os três atos aparecem como capítulos — cada um com a marca que o
 * sustenta. É o índice da experiência antes de a experiência começar.
 */
export function ActsStrip() {
  const root = useScope<HTMLElement>(({ root }) => {
    // A faixa se desloca com o scroll: entra por um lado e sai pelo outro.
    gsap.fromTo(
      root.querySelector(".acts-frase"),
      { xPercent: 6 },
      {
        xPercent: -34,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.5 },
      }
    );

    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".acts-item"),
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: root.querySelector(".acts-grid"), start: "top 82%", once: true },
      }
    );
  });

  return (
    <section ref={root} id="experiencia" className="relative overflow-hidden py-10 md:py-16">
      {/* Frase que atravessa — o mote da experiência em escala de outdoor */}
      <div className="acts-frase ris-display pointer-events-none whitespace-nowrap text-[clamp(2.4rem,9vw,8rem)] leading-none opacity-[0.09]">
        {COPY.hero.scroll} — {COPY.hero.scroll}
      </div>

      <div className="ris-wrap">
        <SignatureLine
          de="route"
          para="pace"
          espessura={1.6}
          altura="clamp(60px,12vw,120px)"
          opacidade={0.7}
          className="my-6 md:my-10"
        />

        <div className="acts-grid grid gap-px overflow-hidden rounded-[22px] border border-[color:var(--line)] bg-[color:var(--veil)] md:grid-cols-3">
          {ATOS.map((ato) => (
            <div key={ato.id} className="acts-item bg-[color:var(--cream-70)] p-6 backdrop-blur-sm md:p-8">
              <div className="ris-display text-[clamp(2rem,5vw,3.2rem)] leading-none">{ato.titulo}</div>
              <p className="ris-lead mt-2 text-[1.15rem] text-[color:var(--somma)] md:text-[1.3rem]">{ato.linha}</p>
              <p className="mt-4 text-[0.9rem] leading-relaxed opacity-70">{ato.texto}</p>
              {/* a marca dona do ato, em logo */}
              <div className="mt-6 flex h-8 items-center">
                {ato.id === "run" && <LogoSomma className="h-[21px] w-auto" />}
                {ato.id === "connect" && <LogoHypeOn className="h-[19px] w-auto" />}
                {ato.id === "stay" && <LogoSantaMonica className="h-[30px] w-auto" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ris-label mt-10 opacity-40 md:mt-14">
        <Marquee
          itens={[
            "CORRE. CONHECE. FICA.",
            "QUAL É O SEU PACE?",
            "TROCAR STRAVA VIROU O NOVO TROCAR TELEFONE",
            "100 PESSOAS. UMA CORRIDA.",
            "DOMINGO DE MANHÃ · BRASÍLIA",
          ]}
          velocidade={70}
        />
      </div>
    </section>
  );
}
