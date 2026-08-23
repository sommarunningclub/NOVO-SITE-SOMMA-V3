"use client";

import Image from "next/image";
import { COPY } from "@/lib/sunday-social-run/event.config";
import { gsap, useScope } from "../_motion";
import { Fit } from "./base";

/**
 * SCENE 07 — FINISH? NOT YET.
 *
 * A virada da página. A corrida acabou e a manhã muda de dono: a fotografia
 * abre em zoom-out enquanto a tipografia cresce, e a luz sai do asfalto quente
 * para o céu do brunch. É a dobradiça entre RUN e STAY.
 */
export function FinishTransition() {
  const root = useScope<HTMLElement>(({ root, low }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".finish-mask > *"),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      }
    );

    if (!low) {
      gsap.fromTo(
        root.querySelector(".finish-foto"),
        { scale: 1.25 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.7 },
        }
      );
    }

    gsap.fromTo(
      root.querySelector(".finish-veu"),
      { opacity: 0.1 },
      {
        opacity: 0.72,
        ease: "none",
        scrollTrigger: { trigger: root, start: "center center", end: "bottom top", scrub: 0.6 },
      }
    );
  });

  return (
    <section
      ref={root}
      id="finish"
      aria-labelledby="finish-titulo"
      className="ris-dark relative isolate flex min-h-[78svh] items-center overflow-hidden py-20 md:min-h-[92svh]"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/somma/SMSPD-372.jpg"
          alt="Pelotão do SOMMA Club correndo em via de Brasília"
          fill
          quality={75}
          sizes="100vw"
          className="finish-foto object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,13,7,0.72)_0%,rgba(24,13,7,0.35)_45%,rgba(20,30,9,0.85)_100%)]" />
        {/* véu que traz a luz do brunch para dentro da corrida */}
        <div className="finish-veu absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(206,238,254,0.35)_70%,rgba(253,250,244,0.9)_100%)]" />
      </div>

      <div className="ris-wrap">
        <h2 id="finish-titulo">
          <Fit linhas={COPY.finish.titulo} maskClass="finish-mask" max="12rem" min="3rem" />
        </h2>
        <p className="ris-lead mt-6 text-[clamp(1.5rem,4.5vw,2.6rem)] leading-tight">{COPY.finish.linha}</p>
      </div>
    </section>
  );
}
