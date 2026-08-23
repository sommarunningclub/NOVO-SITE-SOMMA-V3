"use client";

import { useEffect } from "react";
import { COPY, HYPE_FEATURES, PERFIS_DEMO } from "@/lib/sunday-social-run/event.config";
import { observeSection } from "@/lib/sunday-social-run/analytics";
import { EASE, gsap, scramble, useScope } from "../_motion";
import { Fit, Label } from "./base";
import { LogoHypeOn } from "./Logos";

/** Cards que orbitam o aparelho. Posições em % da caixa — mesma ordem no SVG. */
const ORBITA = [
  { texto: "PACE 5:10", x: 4, y: 12, delay: 0 },
  { texto: "10K", x: 78, y: 6, delay: 0.1 },
  { texto: "MEIA MARATONA", x: 62, y: 78, delay: 0.2 },
  { texto: "BRASÍLIA", x: 0, y: 62, delay: 0.3 },
  { texto: "CONFIRMADO", x: 72, y: 42, delay: 0.4 },
] as const;

/**
 * SCENE 03 — THE RUN STARTS BEFORE THE START.
 *
 * O ato CONNECT: preto, vidro e dourado. A Hype On não entra como meio de
 * pagamento e sim como a camada que faz as pessoas se encontrarem antes de
 * domingo — a compra é só a porta.
 *
 * O aparelho é um mockup autoral: representa a experiência sem reproduzir a
 * interface oficial da Hype, que não está neste projeto. A legenda diz isso em
 * voz alta, e quando os assets reais chegarem é só trocar o conteúdo da tela.
 */
export function HypeExperience() {
  const root = useScope<HTMLElement>(({ root, low }) => {
    const palco = root.querySelector<HTMLElement>(".hype-palco");
    if (!palco) return;

    const tl = gsap.timeline({
      defaults: { ease: EASE.out },
      scrollTrigger: { trigger: palco, start: "top 72%", once: true },
    });

    tl.fromTo(
      root.querySelector(".hype-phone"),
      { y: 60, opacity: 0, rotateX: 14 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.3 }
    )
      .fromTo(
        root.querySelectorAll<HTMLElement>(".hype-fila"),
        { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
        "-=0.7"
      );

    // As linhas ligam cada card ao aparelho — desenhadas à mão, sem plugin pago.
    const cabos = gsap.utils.toArray<SVGPathElement>(root.querySelectorAll(".hype-cabo"));
    for (const cabo of cabos) {
      const len = cabo.getTotalLength();
      gsap.set(cabo, { strokeDasharray: len, strokeDashoffset: len });
    }
    gsap.to(cabos, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "power2.inOut",
      stagger: 0.1,
      scrollTrigger: { trigger: palco, start: "top 60%", once: true },
    });

    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".hype-card"),
      { scale: 0.6, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: EASE.snap,
        stagger: 0.09,
        scrollTrigger: { trigger: palco, start: "top 58%", once: true },
      }
    );

    // Flutuação contínua dos cards: cada um no próprio compasso.
    gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".hype-card")).forEach((card, i) => {
      gsap.to(card, {
        y: i % 2 === 0 ? -10 : 10,
        duration: 3 + i * 0.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.2,
      });
    });

    // Parallax do aparelho — desktop apenas.
    if (!low) {
      gsap.to(root.querySelector(".hype-phone"), {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: palco, start: "top bottom", end: "bottom top", scrub: 0.7 },
      });
    }

    // O ruído digital: o rótulo se embaralha antes de assentar.
    const alvo = root.querySelector<HTMLElement>(".hype-scramble");
    if (alvo) {
      gsap.timeline({ scrollTrigger: { trigger: palco, start: "top 70%", once: true } }).add(
        scramble(alvo, "CONECTADO", { duration: 1.2, delay: 0.6 })
      );
    }
  });

  useEffect(() => observeSection(root.current, "hype_section_view"), [root]);

  return (
    <section
      ref={root}
      id="hype"
      aria-labelledby="hype-titulo"
      className="ris-dark ris-section relative overflow-hidden"
    >
      <div className="ris-wrap">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-[color:var(--gold)]">03 · Hype On</Label>
              <LogoHypeOn className="h-[18px] w-auto text-[color:var(--gold)] md:h-5" />
            </div>
            <h2 id="hype-titulo" className="mt-5">
              <Fit linhas={COPY.hype.titulo} col={8} max="6.5rem" min="2rem" />
            </h2>
          </div>
          <p className="ris-lead text-[clamp(1.3rem,3.4vw,1.9rem)] leading-tight text-[color:var(--gold-soft)] md:col-span-4 md:pb-3">
            {COPY.hype.linha}
          </p>
        </div>

        <div className="hype-palco mt-12 grid gap-12 md:mt-16 md:grid-cols-12 md:gap-10">
          {/* Aparelho + órbita */}
          <div className="relative order-2 md:order-1 md:col-span-6">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px]">
              {/* cabos de conexão */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                {ORBITA.map((card) => (
                  <path
                    key={card.texto}
                    className="hype-cabo"
                    d={`M ${card.x + 8} ${card.y + 4} Q 50 ${(card.y + 50) / 2} 50 50`}
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth={0.3}
                    vectorEffect="non-scaling-stroke"
                    opacity={0.45}
                  />
                ))}
              </svg>

              {/* mockup do aparelho */}
              <div className="hype-phone absolute left-1/2 top-1/2 w-[54%] max-w-[230px] -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-[34px] border border-white/15 bg-[color:var(--night-2)] p-2 shadow-[0_40px_80px_-40px_rgba(0,0,0,1)]">
                  <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#141419_0%,#0a0a0e_100%)] px-3 pb-4 pt-6">
                    {/* ilha */}
                    <span className="absolute left-1/2 top-2 h-[14px] w-[38%] -translate-x-1/2 rounded-full bg-black" aria-hidden />

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="ris-label text-[0.5rem] text-[color:var(--gold)]">SUNDAY SOCIAL RUN</span>
                      <LogoHypeOn className="h-[9px] w-auto text-white/70" />
                    </div>
                    <div className="ris-display mt-2 text-[1.05rem] leading-none text-white">
                      VOU
                      <span className="ris-mono ml-2 text-[0.6rem] font-bold text-[color:var(--gold)]">100</span>
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {PERFIS_DEMO.slice(0, 5).map((p) => (
                        <li
                          key={p.nome}
                          className="hype-fila flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-2 py-1.5"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--somma-25)] text-[0.55rem] font-bold text-white">
                            {p.nome[0]}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.6rem] font-medium text-white/90">{p.nome}</span>
                            <span className="ris-mono block text-[0.5rem] text-white/45">
                              {p.pace}/km · {p.distancia}
                            </span>
                          </span>
                          <span className="ris-mono text-[0.45rem] text-[color:var(--gold)]">VOU</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 rounded-full bg-[color:var(--somma)] py-2 text-center text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
                      Ver quem vai
                    </div>
                  </div>
                </div>
              </div>

              {/* cards orbitando */}
              {ORBITA.map((card) => (
                <span
                  key={card.texto}
                  className="hype-card ris-mono absolute rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[0.58rem] font-bold tracking-[0.08em] backdrop-blur-md"
                  style={{ left: `${card.x}%`, top: `${card.y}%` }}
                >
                  {card.texto}
                </span>
              ))}
            </div>

            <p className="ris-label mt-6 text-center opacity-35">
              Mockup ilustrativo da experiência — a interface oficial é a do app da Hype On
            </p>
          </div>

          {/* Texto + recursos */}
          <div className="order-1 md:order-2 md:col-span-6 md:pl-6">
            <p className="max-w-[42ch] text-[1rem] leading-relaxed opacity-75 md:text-[1.05rem]">{COPY.hype.texto}</p>

            <ul className="mt-9 divide-y divide-white/10 border-y border-white/10">
              {HYPE_FEATURES.map((f, i) => (
                <li key={f.id} className="flex items-baseline gap-4 py-3.5">
                  <span className="ris-mono w-6 shrink-0 text-[0.62rem] text-[color:var(--gold)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.98rem] font-semibold">{f.titulo}</span>
                    <span className="mt-0.5 block text-[0.86rem] leading-snug opacity-60">{f.detalhe}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3">
              <span className="ris-pulse text-[color:var(--gold)]" aria-hidden />
              <span className="hype-scramble ris-mono text-[0.8rem] font-bold tracking-[0.2em] text-[color:var(--gold)]">
                CONECTADO
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
