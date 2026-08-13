"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Eyebrow, Lockup, PaceLines, Section, cx, s } from "../_ui";

/**
 * Abertura.
 *
 * O skyline de Brasília é o mesmo PNG do KV separado em três máscaras por
 * profundidade — cada uma entra numa velocidade e recebe cor por CSS, o que dá
 * parallax de verdade em vez de uma imagem chapada deslizando.
 */
export function Hero() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    // ---- entrada cinematográfica ----------------------------------------
    const tl = gsap.timeline({ defaults: { ease: EASE.out } });

    tl.from(q(".js-sky"), {
      yPercent: (i) => 26 - i * 7,
      opacity: 0,
      duration: 2.1,
      stagger: 0.14,
      ease: "power3.out",
    })
      .from(q(".js-sun"), { opacity: 0, scale: 1.25, duration: 2.4, ease: "power2.out" }, 0)
      .from(q(".js-eyebrow"), { opacity: 0, y: 14, duration: 1 }, 0.5)
      // o `y: 0` zera o deslocamento que o GSAP converteu do transform da classe
      .fromTo(
        q(".js-hero-head .js-word"),
        { yPercent: 106, y: 0 },
        { yPercent: 0, duration: 1.35, stagger: 0.075 },
        0.65,
      )
      .from(q(".js-hero-rule"), { scaleX: 0, duration: 1.4, ease: "power3.inOut" }, 1.15)
      .from(q(".js-hero-foot > *"), { opacity: 0, y: 20, duration: 1.1, stagger: 0.1 }, 1.25)
      .from(q(".js-lockup"), { opacity: 0, y: 16, duration: 1.1 }, 1.35);

    // respiração lenta e contínua do fundo: dá a sensação de câmera viva
    gsap.to(q(".js-sun"), {
      scale: 1.14,
      duration: 16,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // ---- linhas de velocidade -------------------------------------------
    q(".js-pace-line").forEach((line, i) => {
      gsap.fromTo(
        line,
        { xPercent: -140 },
        {
          xPercent: 240,
          duration: 5 + (i % 4) * 2.4,
          ease: "none",
          repeat: -1,
          delay: i * 0.7,
        },
      );
    });

    // ---- saída em parallax ----------------------------------------------
    gsap
      .timeline({
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 },
      })
      .to(q(".js-hero-copy"), { yPercent: -34, opacity: 0.15, ease: "none" }, 0)
      .to(q(".js-sky-far"), { yPercent: -13, ease: "none" }, 0)
      .to(q(".js-sky-mid"), { yPercent: -7, ease: "none" }, 0)
      .to(q(".js-sky-near"), { yPercent: 5, ease: "none" }, 0);

    // ---- indicador de scroll --------------------------------------------
    gsap.fromTo(
      q(".js-scroll-dot"),
      { yPercent: -110 },
      { yPercent: 210, duration: 1.9, ease: "power2.inOut", repeat: -1, repeatDelay: 0.25 },
    );
  });

  return (
    <Section id="hero" stage={0}>
      <div
        ref={ref}
        className="relative flex min-h-[100svh] flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(178deg,#04081a 0%,#061031 34%,#0a2a72 68%,#123c95 84%,#1c4fae 100%)",
        }}
      >
        {/* ---------------------------------------------------------- fundo */}
        <div aria-hidden className="absolute inset-0">
          {/* sol se pondo atrás da Esplanada */}
          <div
            className="js-sun absolute inset-x-0 bottom-0 h-[86%] origin-bottom"
            style={{
              background:
                "radial-gradient(64% 100% at 64% 102%, rgba(255,178,86,.95) 0%, rgba(255,116,48,.78) 20%, rgba(255,74,40,.42) 38%, rgba(122,59,224,.4) 58%, rgba(20,102,224,0) 80%)",
            }}
          />

          <PaceLines count={9} />

          {/* skyline em três profundidades */}
          <div
            className={cx(s.skyLayer, s.skyFar, "js-sky js-sky-far")}
            style={{ ["--mask" as string]: "url(/sbt/kit/skyline-far.png)" }}
          />
          <div
            className={cx(s.skyLayer, s.skyMid, "js-sky js-sky-mid")}
            style={{ ["--mask" as string]: "url(/sbt/kit/skyline-mid.png)" }}
          />
          <div
            className={cx(s.skyLayer, s.skyNear, "js-sky js-sky-near")}
            style={{ ["--mask" as string]: "url(/sbt/kit/skyline-near.png)" }}
          />

          {/* o chão escurece para a tipografia respirar */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: "linear-gradient(180deg,rgba(4,8,26,0) 0%,rgba(4,8,26,.86) 78%,#04081a 100%)" }}
          />
          <div className={s.leak} />
          <div className={s.grain} />
        </div>

        {/* ---------------------------------------------------------- conteúdo */}
        <div className={cx(s.shell, "js-hero-copy relative z-10 flex flex-1 flex-col justify-end pb-8 pt-28 md:pb-12")}>
          <div className="js-lockup mb-auto pt-4 md:pt-8">
            <Lockup size="md" className="!justify-start" />
          </div>

          <Eyebrow className="js-eyebrow mb-5 md:mb-8" tone="cyan">
            Proposta de parceria · Brasília 2026
          </Eyebrow>

          <Headline as="h1" level="h1" solo className="js-hero-head">
            {"Road to\nSBT Sunset Run"}
          </Headline>

          <div
            className="js-hero-rule mt-8 h-px w-full origin-left md:mt-12"
            style={{ background: "linear-gradient(90deg,var(--somma),rgba(85,218,255,.5) 48%,rgba(255,255,255,0))" }}
          />

          <div className="js-hero-foot mt-7 grid gap-8 md:mt-9 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
            <p
              className="max-w-[26ch] text-[1.35rem] font-light leading-[1.18] tracking-[-0.02em] text-white md:text-[2rem]"
              style={{ textWrap: "balance" }}
            >
              A corrida começa <span style={{ color: "var(--somma)" }}>antes da largada.</span>
            </p>

            <div className="flex flex-col gap-2 md:items-end">
              <span
                className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.26em]")}
                style={{ color: "var(--dim)" }}
              >
                SBT Sunset Run <span style={{ color: "var(--somma)" }}>×</span> Somma Club
              </span>
              {/* quem está falando, antes de qualquer proposta */}
              <span
                className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.26em] text-white")}
              >
                O maior running club do DF
              </span>
              <span
                className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.26em]")}
                style={{ color: "var(--dim-2)" }}
              >
                +6.000 membros · todo sábado
              </span>
            </div>
          </div>

          {/* indicador de scroll */}
          <div className="mt-10 flex items-center gap-4 md:mt-14">
            <span className="relative block h-10 w-px overflow-hidden" style={{ background: "var(--faint)" }}>
              <span
                className="js-scroll-dot absolute inset-x-0 top-0 block h-4 w-px"
                style={{ background: "var(--somma)" }}
              />
            </span>
            <span
              className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.3em]")}
              style={{ color: "var(--dim-2)" }}
            >
              Role para começar
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
