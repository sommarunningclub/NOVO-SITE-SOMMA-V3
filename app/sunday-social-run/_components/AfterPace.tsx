"use client";

import Image from "next/image";
import { useEffect } from "react";
import { COPY } from "@/lib/sunday-social-run/event.config";
import { observeSection } from "@/lib/sunday-social-run/analytics";
import { gsap, useScope } from "../_motion";
import { Fit, Label, Marquee } from "./base";
import { LogoSantaMonica } from "./Logos";
import { SignatureLine } from "./SignatureLine";

/**
 * Blocos da morning party, agora com as fotografias oficiais da casa: a cabine
 * do DJ, o salão, as mesas sob as árvores — e a comunidade do SOMMA fechando a
 * sequência. Nenhum placeholder: tudo aqui é o lugar de verdade.
 */
const MOMENTOS = [
  {
    id: "dj",
    titulo: "DJ SET",
    hora: "09:00",
    span: "md:col-span-5",
    ratio: "aspect-[4/5]",
    foto: {
      src: "/sunday-social-run/santa-monica-dj.jpg",
      alt: "DJ tocando na cabine do Santa Monica Gastrobar",
      foco: "50% 35%",
    },
  },
  {
    id: "casa",
    titulo: "A CASA",
    hora: "08:40",
    span: "md:col-span-7",
    ratio: "aspect-[4/3]",
    foto: {
      src: "/sunday-social-run/santa-monica-salao.jpg",
      alt: "Salão do Santa Monica Gastrobar com o letreiro da casa",
      foco: "50% 50%",
    },
  },
  {
    id: "brunch",
    titulo: "BRUNCH",
    hora: "09:00",
    span: "md:col-span-7",
    ratio: "aspect-[4/3]",
    foto: {
      src: "/sunday-social-run/santa-monica-mesas.jpg",
      alt: "Área externa do Santa Monica com mesas sob as árvores",
      foco: "50% 55%",
    },
  },
  {
    id: "social",
    titulo: "SOCIAL",
    hora: "10:00",
    span: "md:col-span-5",
    ratio: "aspect-[4/5]",
    foto: {
      src: "/somma/PDCSK217JAN-2433.jpg",
      alt: "Comunidade do SOMMA Club reunida em aquecimento coletivo",
      foco: "50% 40%",
    },
  },
] as const;


/**
 * SCENE 08 — AFTER PACE.
 *
 * A seção muda a sensação da página inteira: sai o asfalto, entra o céu. É
 * domingo de manhã em Palm Springs, não madrugada de balada — luz natural,
 * boné, café, drink, mesa cheia e a música que segura todo mundo ali.
 *
 * A linha reaparece aqui como waveform: o mesmo traço da rota, agora som.
 */
export function AfterPace() {
  const root = useScope<HTMLElement>(({ root, low }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".after-mask > *"),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: root, start: "top 76%", once: true },
      }
    );

    const molduras = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".after-moldura"));
    for (const moldura of molduras) {
      gsap.fromTo(
        moldura,
        { clipPath: "inset(0% 0% 100% 0%)", scale: 1.06 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1.3,
          ease: "power4.inOut",
          scrollTrigger: { trigger: moldura, start: "top 86%", once: true },
        }
      );

      if (!low) {
        gsap.fromTo(
          moldura.querySelector(".after-camada"),
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: moldura, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }
        );
      }
    }
  });

  useEffect(() => observeSection(root.current, "after_pace_view"), [root]);

  return (
    <section ref={root} id="after-pace" aria-labelledby="after-titulo" className="ris-section relative">
      <div className="ris-wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Label className="text-[color:var(--terra)]">08 · Das 9h às 11h30</Label>
              <LogoSantaMonica className="h-[26px] w-auto md:h-[30px]" />
            </div>
            <h2 id="after-titulo" className="mt-5">
              <Fit linhas={COPY.after.headline} col={7} maskClass="after-mask" max="6rem" min="2rem" />
            </h2>
          </div>
          <p className="max-w-[40ch] text-[0.98rem] leading-relaxed opacity-70 md:col-span-5 md:pb-2">
            {COPY.after.texto}
          </p>
        </div>

        {/* O nome da sub-experiência, com a linha virando som */}
        <div className="relative mt-12 md:mt-16">
          <div className="ris-display text-center text-[clamp(3.4rem,17vw,15rem)] leading-[0.8] text-[color:var(--terra)]">
            AFTER
            <br />
            PACE
          </div>
          <SignatureLine
            de="connect"
            para="wave"
            cor="var(--terra)"
            espessura={2}
            altura="clamp(70px,14vw,140px)"
            className="mt-4"
            start="top 90%"
            end="bottom 45%"
          />
        </div>

        {/* Momentos */}
        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-12">
          {MOMENTOS.map((m) => (
            <figure key={m.id} className={`after-moldura relative overflow-hidden rounded-[22px] ${m.span}`}>
              <div className={`relative ${m.ratio} w-full`}>
                <Image
                  src={m.foto.src}
                  alt={m.foto.alt}
                  fill
                  quality={75}
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="after-camada scale-110 object-cover"
                  style={{ objectPosition: m.foto.foco }}
                />

                {/* selo do momento */}
                <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(20,30,9,0.55)_38%,rgba(20,30,9,0.9)_100%)] p-4 pt-16 text-[color:var(--cream)] md:p-6 md:pt-20">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="ris-display text-[1.3rem] leading-none md:text-[1.9rem]">{m.titulo}</div>
                    <span className="ris-mono shrink-0 text-[0.7rem] font-bold opacity-80">{m.hora}</span>
                  </div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>

      <div className="ris-display mt-12 text-[clamp(1.4rem,4vw,2.6rem)] leading-none text-[color:var(--terra)] opacity-70 md:mt-16">
        <Marquee
          itens={["DJ", "BRUNCH", "DRINK", "MÚSICA", "MARCAS", "GENTE NOVA", "DOMINGO DE MANHÃ"]}
          velocidade={80}
          reverso
          separador="✳"
        />
      </div>
    </section>
  );
}
