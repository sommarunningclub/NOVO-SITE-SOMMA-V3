"use client";

import Image from "next/image";
import { MANIFESTO } from "@/lib/desafio-esteiras/event.config";
import { FitLines } from "./FitLines";
import { gsap, imageMask, isLowPower, maskReveal, useScope } from "../_motion";

/**
 * Manifesto — a quebra clara da página.
 *
 * Frases fragmentadas, cada uma numa janela própria, subindo em cascata.
 * A última linha ("E TUDO AO MESMO TEMPO.") é a que carrega a cor SOMMA e
 * fecha o pensamento.
 */
export function Manifesto() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".man-linha > *"), {
      trigger: root,
      start: "top 72%",
      stagger: 0.055,
    });

    imageMask(root.querySelector(".man-foto"), root.querySelector(".man-foto-wrap") ?? undefined);

    if (!isLowPower()) {
      // A palavra final acompanha o scroll — puxa o olho para o fecho.
      gsap.to(root.querySelector(".man-fecho"), {
        xPercent: -6,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.8 },
      });
    }
  });

  return (
    <section
      ref={root}
      id="desafio"
      className="dst-paper dst-section dst-grain relative overflow-hidden scroll-mt-16"
      aria-labelledby="manifesto-titulo"
    >
      <div className="dst-wrap relative">
        <p className="dst-label mb-10 text-[color:var(--evolve)]">O manifesto</p>

        <h2 id="manifesto-titulo">
          <FitLines linhas={MANIFESTO} maskClass="man-linha" max="6.5rem" min="1.1rem" />
        </h2>

        <div className="mt-12 grid items-end gap-8 md:mt-16 md:grid-cols-12">
          <div className="man-foto-wrap relative order-2 aspect-[4/5] overflow-hidden md:order-1 md:col-span-5">
            <Image
              src="/desafio-esteiras-evolve/img/comunidade-escada.jpg"
              alt="Grupo de corredores reunido na Evolve"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="man-foto object-cover"
            />
          </div>

          <div className="order-1 md:order-2 md:col-span-7">
            <p className="man-fecho dst-display text-[clamp(1.8rem,6.5vw,4.5rem)] text-[color:var(--somma)]">
              E TUDO ACONTECENDO
              <br />
              AO MESMO TEMPO.
            </p>
            <p className="mt-6 max-w-[46ch] text-[clamp(1rem,2.4vw,1.2rem)] leading-relaxed text-[color:rgba(8,8,10,0.72)]">
              No dia 19 de agosto, quatro unidades da Evolve viram um só evento. A esteira é o
              ponto de encontro. O resto é o que a gente constrói junto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
