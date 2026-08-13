"use client";

import { gsap, useScope, EASE, scrub } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

const MISSIONS = [
  { n: "01", t: "Participar de um treino Somma", d: "Presença em qualquer treinão da semana." },
  { n: "02", t: "Completar 5 km", d: "Na rua, na esteira ou no treinão. Vale o esforço." },
  { n: "03", t: "Levar alguém para correr", d: "A missão que faz a comunidade crescer sozinha." },
  { n: "04", t: "Participar de um Training Series", d: "Um dos quatro sábados oficiais SBT × Somma." },
  { n: "05", t: "Confirmar presença na Sunset Run", d: "A missão que converte preparação em inscrição." },
];

/**
 * Sunset 5.
 *
 * Gamificação sem placar: cinco missões que qualquer corredor consegue cumprir
 * e uma delas, a quinta, é a própria inscrição. O prêmio é um card que o
 * atleta quer postar, e que carrega as duas marcas junto.
 */
export function Missions() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: q(".js-mis-wrap")[0], start: "top top", end: "bottom bottom", scrub: scrub(0.5) },
    });

    // uma missão é marcada por vez
    q<HTMLElement>(".js-mission").forEach((m, i) => {
      const at = i * 0.14;
      tl.to(m, { opacity: 1, duration: 0.1 }, at);
      tl.fromTo(m.querySelector(".js-check"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.12, ease: "back.out(2.4)" }, at + 0.04);
      tl.fromTo(m.querySelector(".js-mis-bar"), { scaleX: 0 }, { scaleX: 1, duration: 0.12 }, at + 0.02);
    });

    // o card só é emitido depois da quinta missão
    tl.fromTo(
      q(".js-card"),
      { opacity: 0, yPercent: 14, rotateX: -22, scale: 0.9 },
      { opacity: 1, yPercent: 0, rotateX: 0, scale: 1, duration: 0.34, ease: EASE.out },
      0.78,
    )
      .fromTo(q(".js-card-shine"), { xPercent: -130 }, { xPercent: 130, duration: 0.34, ease: "power2.inOut" }, 0.92)
      .fromTo(q(".js-card-line"), { scaleX: 0 }, { scaleX: 1, duration: 0.2, stagger: 0.05 }, 0.96)
      .fromTo(q(".js-share"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.2 }, 1.06);
  });

  return (
    <Section id="missions" stage={3} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="07" label="Sunset 5" />
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h2">{"5 missions.\nOne finish line."}</Headline>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={s.body}>
                Cinco desafios simples que qualquer corredor cumpre em quatro semanas. A última missão é a inscrição:
                a gamificação e a conversão são a mesma coisa.
              </p>
            </div>
          </div>
        </div>

        <div className="js-mis-wrap js-pin-track relative mt-14 md:mt-20 md:h-[340vh]">
          <div className="js-pin-frame md:sticky md:top-0 md:flex md:h-[100svh] md:items-center md:overflow-hidden">
            <div className={cx(s.shell, "grid w-full items-center gap-14 md:grid-cols-12 md:gap-12")}>
              {/* --------------------------------------------- missões */}
              <ol className="flex flex-col gap-6 md:col-span-6">
                {MISSIONS.map((m) => (
                  <li key={m.n} className={cx("js-mission", s.mDim)}>
                    <div className="flex items-start gap-5">
                      {/* caixa de conclusão */}
                      <span
                        className="relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                        style={{ border: "1px solid var(--hair)" }}
                      >
                        <svg className={cx("js-check", s.mHide, "h-3 w-3")} viewBox="0 0 12 12" fill="none">
                          <path d="M2 6.2 4.6 9 10 3" stroke="var(--somma)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>

                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className={cx(s.mono, "text-[0.625rem] tracking-[0.22em]")} style={{ color: "var(--cyan)" }}>
                            {m.n}
                          </span>
                          <p className={cx(s.h3, "!text-[clamp(1.05rem,1.7vw,1.35rem)]")} style={{ fontVariationSettings: '"wdth" 100' }}>
                            {m.t}
                          </p>
                        </div>
                        <p className={cx(s.body, "mt-1.5 !text-[0.875rem]")}>{m.d}</p>
                        <span
                          className={cx("js-mis-bar", s.mBarX, "mt-4 block h-px w-full origin-left")}
                          style={{ background: "linear-gradient(90deg,var(--somma),rgba(255,255,255,0))" }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* --------------------------------------------- card gerado */}
              <div className="md:col-span-5 md:col-start-8" style={{ perspective: "1200px" }}>
                <div
                  className={cx("js-card", s.mHide, "relative mx-auto w-full max-w-[340px] overflow-hidden p-7")}
                  style={{
                    borderRadius: "4px",
                    background:
                      "linear-gradient(158deg,#0b2a70 0%,#0a1a4a 38%,#2a1348 66%,#5c1e18 88%,#7d2408 100%)",
                    boxShadow: "0 30px 70px -30px rgba(0,0,0,.9), inset 0 0 0 1px rgba(255,255,255,.12)",
                  }}
                >
                  {/* varredura de brilho na emissão */}
                  <span
                    aria-hidden
                    className="js-card-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg]"
                    style={{ background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.22),rgba(255,255,255,0))" }}
                  />

                  <div className="relative">
                    <p className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.3em] text-white/60")}>
                      Sunset Pass · 2026
                    </p>

                    <p className={cx(s.num, "mt-6 !text-[3.4rem]")}>ALEX</p>

                    <span className="js-card-line mt-5 block h-px w-full origin-left bg-white/20" />

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className={cx(s.num, "!text-[1.6rem]")}>18,7</p>
                        <p className={cx(s.mono, "mt-1 text-[0.5rem] uppercase tracking-[0.2em] text-white/50")}>km na jornada</p>
                      </div>
                      <div>
                        <p className={cx(s.num, "!text-[1.6rem]")}>5/5</p>
                        <p className={cx(s.mono, "mt-1 text-[0.5rem] uppercase tracking-[0.2em] text-white/50")}>missões</p>
                      </div>
                    </div>

                    <span className="js-card-line mt-5 block h-px w-full origin-left bg-white/20" />

                    <p
                      className={cx(s.h3, "mt-5 !text-[1.5rem]")}
                      style={{ color: "#fff", fontVariationSettings: '"wdth" 112' }}
                    >
                      Ready for
                      <br />
                      Sunset
                    </p>

                    <div className="mt-7 flex items-center gap-3 border-t border-white/15 pt-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/sbt/kit/sunset-run-logo.png" alt="" className="h-4 w-auto" />
                      <span className="text-[0.6rem] font-extralight text-white/50">×</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo-somma.svg" alt="" className="h-2.5 w-auto" />
                    </div>
                  </div>
                </div>

                <p className={cx(s.mono, s.mHide, "js-share mt-5 text-center text-[0.625rem] uppercase tracking-[0.2em]")} style={{ color: "var(--dim-2)" }}>
                  Pronto para o story · 1080 × 1920
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
