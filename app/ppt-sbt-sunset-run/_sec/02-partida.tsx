"use client";

import { gsap, useScope, EASE, scrub } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";
import { ConvergenceCanvas } from "../_convergence";

const DIVULGACAO = ["post", "story", "cupom", "cortesia", "alcance"];
const EXPERIENCIA = ["comunidade", "treino", "tecnologia", "conteúdo", "conversão", "corrida", "relacionamento"];

/**
 * O ponto de partida.
 *
 * A troca acontece na mesma moldura: "Divulgação" é riscada e murcha enquanto
 * "Experiência" cresce por trás e toma a tela. Um corte no lugar de dois slides.
 */
export function Partida() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: q(".js-stage-wrap")[0], start: "top top", end: "bottom bottom", scrub: scrub(0.5) },
    });

    // --- divulgação sai --------------------------------------------------
    // os dois estados não se cruzam: um sai inteiro antes do outro entrar
    tl.to(q(".js-strike"), { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, 0.1)
      .to(q(".js-a-item"), { opacity: 0.1, x: -18, duration: 0.4, stagger: 0.045 }, 0.24)
      .to(q(".js-a"), { scale: 0.78, opacity: 0, yPercent: -12, duration: 0.5, ease: "power2.in" }, 0.44)

      // --- experiência entra ---------------------------------------------
      .fromTo(
        q(".js-b"),
        { scale: 0.84, opacity: 0, yPercent: 14 },
        { scale: 1, opacity: 1, yPercent: 0, duration: 0.62, ease: EASE.out },
        0.96,
      )
      .fromTo(
        q(".js-b-item"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.42, stagger: 0.05, ease: "power2.out" },
        1.18,
      )
      .fromTo(q(".js-b-glow"), { opacity: 0 }, { opacity: 1, duration: 0.7 }, 0.98);
  });

  return (
    <Section id="partida" stage={0} className="pt-24 md:pt-40">
      <div ref={ref}>
        {/* --------------------------------------------------------- abertura */}
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="02" label="O ponto de partida" />

          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7">
              <Headline level="h2">{"Divulgação não é\no que queremos\nconstruir."}</Headline>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={s.lead}>
                O SBT nos chamou para divulgar. Queremos colocar gente dentro.
              </p>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- a virada */}
        <div className="js-stage-wrap js-pin-track relative mt-20 h-[150vh] md:mt-24 md:h-[175vh]">
          <div className="js-pin-frame sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
            {/* Os pontos convergem no mesmo scroll em que a palavra troca: a
                audiência dispersa vira comunidade enquanto se lê. */}
            <ConvergenceCanvas trigger=".js-stage-wrap" />

            {/* halo que acende junto com a experiência */}
            <div
              aria-hidden
              className="js-b-glow absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 55% at 50% 58%, rgba(255,44,4,.2) 0%, rgba(122,59,224,.14) 40%, rgba(4,8,26,0) 72%)",
              }}
            />

            {/* ---------------- estado A: divulgação ---------------- */}
            <div className="js-a js-pin-layer absolute inset-0 flex flex-col items-center justify-center px-[var(--gut)]">
              <p className={cx(s.eyebrow, "mb-7")}>Lado A</p>
              <div className="relative">
                <h3
                  className={cx(s.h1, "text-center")}
                  style={{ color: "rgba(255,255,255,.5)", fontSize: "clamp(2.1rem,7.4vw,6.5rem)" }}
                >
                  Divulgação
                </h3>
                <span
                  aria-hidden
                  className={cx("js-strike", s.mBarX, "absolute left-[-2%] top-1/2 h-[3px] w-[104%] origin-left")}
                  style={{ background: "var(--somma)" }}
                />
              </div>
              <ul className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3">
                {DIVULGACAO.map((i) => (
                  <li
                    key={i}
                    className={cx(s.mono, "js-a-item flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.24em]")}
                    style={{ color: "var(--dim-2)" }}
                  >
                    <span aria-hidden style={{ color: "rgba(255,255,255,.3)" }}>✕</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            {/* ---------------- estado B: experiência ---------------- */}
            <div className="js-b js-pin-layer absolute inset-0 flex flex-col items-center justify-center px-[var(--gut)]">
              <p className={cx(s.eyebrow, "mb-7")} style={{ color: "var(--somma)" }}>
                Lado B
              </p>
              <h3
                className={cx(s.h1, "text-center")}
                style={{ fontSize: "clamp(2.4rem,8.4vw,7.6rem)", lineHeight: 0.84 }}
              >
                Experiência
              </h3>
              <ul className="mt-10 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-3.5 md:gap-x-9">
                {EXPERIENCIA.map((i, n) => (
                  <li
                    key={i}
                    className={cx(s.mono, "js-b-item flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.24em] md:text-[0.8125rem]")}
                    style={{ color: n % 3 === 1 ? "var(--cyan)" : "var(--paper)" }}
                  >
                    <span aria-hidden style={{ color: "var(--somma)" }}>✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              <p
                className={cx(s.mono, "js-b-item mt-12 text-center text-[0.625rem] uppercase tracking-[0.3em]")}
                style={{ color: "var(--dim-2)" }}
              >
                From audience to community
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
