"use client";

import { useEffect } from "react";
import { COPY, PELOTOES, PERFIS_DEMO } from "@/lib/sunday-social-run/event.config";
import { observeSection } from "@/lib/sunday-social-run/analytics";
import { EASE, gsap, useScope } from "../_motion";
import { Label } from "./base";

const A = PERFIS_DEMO[0]; // Marina · 5:20 · 10K
const B = PERFIS_DEMO[1]; // Lucas · 5:18 · 21K

/**
 * SCENE 04 — PACE MATCH.
 *
 * A cena que a página existe para ter. Dois corredores entram por lados
 * opostos; conforme a pessoa rola, eles se aproximam, uma linha se estica entre
 * os dois e o encontro acontece — PACE MATCH.
 *
 * No desktop a seção é fixada e a aproximação é dirigida pelo scroll, quadro a
 * quadro. No mobile não há pin: a mesma coreografia acontece dentro da rolagem
 * natural, mais curta, porque prender a tela em aparelho de dedo custa caro e
 * confunde. Sob `prefers-reduced-motion`, os dois já nascem lado a lado.
 */
export function PaceMatchScene() {
  const root = useScope<HTMLElement>(({ root, mm }) => {
    const palco = root.querySelector<HTMLElement>(".pace-palco");
    if (!palco) return;

    const coreografia = (pin: boolean) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: palco,
          start: pin ? "top top" : "top 76%",
          end: pin ? "+=95%" : "bottom 55%",
          scrub: pin ? 0.6 : 0.8,
          pin,
          anticipatePin: pin ? 1 : 0,
        },
      });

      tl.fromTo(
        root.querySelector(".pace-a"),
        { xPercent: -62, yPercent: -6, rotate: -6, opacity: 0.55 },
        { xPercent: 0, yPercent: 0, rotate: 0, opacity: 1, ease: "none" },
        0
      )
        .fromTo(
          root.querySelector(".pace-b"),
          { xPercent: 62, yPercent: 6, rotate: 6, opacity: 0.55 },
          { xPercent: 0, yPercent: 0, rotate: 0, opacity: 1, ease: "none" },
          0
        )
        .fromTo(
          root.querySelector(".pace-fio"),
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, ease: "none" },
          0.25
        )
        .fromTo(
          root.querySelector(".pace-selo"),
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, ease: EASE.snap, duration: 0.4 },
          0.72
        )
        .fromTo(
          root.querySelector(".pace-fecho"),
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35 },
          0.85
        );
    };

    mm.add("(min-width: 900px)", () => coreografia(true));
    mm.add("(max-width: 899px)", () => coreografia(false));

    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".pace-grupo"),
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.querySelector(".pace-grupos"), start: "top 84%", once: true },
      }
    );
  });

  useEffect(() => observeSection(root.current, "pace_match_view"), [root]);

  return (
    <section ref={root} id="pace-match" aria-labelledby="pace-titulo" className="ris-dark ris-section relative">
      <div className="ris-wrap">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Label className="text-[color:var(--somma)]">04 · Conexão</Label>
            <h2 id="pace-titulo" className="ris-display mt-5 text-[clamp(2.6rem,9vw,7rem)] leading-[0.85]">
              {COPY.paceMatch.titulo}
            </h2>
          </div>
          <p className="ris-lead text-[clamp(1.4rem,3.6vw,2.2rem)] leading-tight md:col-span-5 md:pb-2">
            {COPY.paceMatch.headline}
          </p>
        </div>
      </div>

      {/* Palco da aproximação */}
      <div className="pace-palco relative mt-10 flex min-h-[54svh] items-center overflow-hidden md:mt-12 md:min-h-[68svh]">
        <div className="ris-wrap w-full">
          <div className="relative mx-auto flex max-w-[760px] items-center justify-center gap-3 md:gap-6">
            <CardCorredor className="pace-a" nome={A.nome} pace={A.pace} distancia={A.distancia} tag={A.tag} />

            {/* o fio entre os dois — a mesma linha da página, agora como conexão */}
            <div className="relative flex h-px flex-1 items-center">
              <span className="pace-fio block h-px w-full origin-left bg-[color:var(--somma)]" />
              <span className="pace-selo ris-mono absolute bottom-[-3.4rem] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[color:var(--somma)] px-4 py-2 text-[0.62rem] font-bold tracking-[0.14em] text-[color:var(--cream)] md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:px-4 md:text-[0.68rem]">
                MESMO PACE
              </span>
            </div>

            <CardCorredor className="pace-b" nome={B.nome} pace={B.pace} distancia={B.distancia} tag={B.tag} />
          </div>

          <p className="pace-fecho ris-lead mx-auto mt-20 max-w-[22ch] md:mt-10 text-center text-[clamp(1.5rem,5vw,2.6rem)] leading-tight">
            {COPY.paceMatch.fecho}
          </p>
        </div>
      </div>

      {/* Como os grupos se formam */}
      <div className="ris-wrap pace-grupos mt-14 md:mt-20">
        <div className="grid gap-6 md:grid-cols-12 md:items-start">
          <p className="max-w-[46ch] text-[0.98rem] leading-relaxed opacity-70 md:col-span-5">{COPY.paceMatch.texto}</p>

          <div className="grid grid-cols-3 gap-3 md:col-span-7">
            {PELOTOES.map((p) => (
              <div key={p.km} className="pace-grupo ris-glass p-4">
                <div className="ris-mono text-[1.5rem] font-bold leading-none md:text-[1.9rem]">
                  {p.km}
                  <span className="ml-1 text-[0.8rem] font-medium opacity-50">km</span>
                </div>
                <div className="ris-label mt-2 opacity-55">{p.rotulo}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="ris-label mt-6 opacity-35">{COPY.paceMatch.pelotoes}</p>
      </div>
    </section>
  );
}

/** Cartão de corredor: nome, ritmo, distância e bairro. Dados como telemetria. */
function CardCorredor({
  nome,
  pace,
  distancia,
  tag,
  className = "",
}: {
  nome: string;
  pace: string;
  distancia: string;
  tag: string;
  className?: string;
}) {
  return (
    <article
      className={`ris-glass relative w-[38vw] max-w-[220px] shrink-0 overflow-hidden p-4 md:w-[220px] md:p-5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--somma-25)] text-[0.9rem] font-bold text-[color:var(--cream)]">
          {nome[0]}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[1rem] font-semibold leading-none">{nome}</div>
          <div className="ris-label mt-1.5 opacity-50">{tag}</div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-[color:var(--line)] pt-3">
        <div>
          <div className="ris-mono text-[1.4rem] font-bold leading-none md:text-[1.7rem]">{pace}</div>
          <div className="ris-label mt-1.5 opacity-50">min/km</div>
        </div>
        <div className="ris-mono rounded-full border border-[color:var(--line-strong)] px-2.5 py-1 text-[0.6rem] font-bold">
          {distancia}
        </div>
      </div>
    </article>
  );
}
