"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

const STEPS = [
  { t: "Entra na jornada", d: "Um toque no link da Somma ou do SBT abre o Pass. Sem app para baixar." },
  { t: "Faz check-in nos treinões", d: "Cada sábado presente é registrado no perfil do atleta." },
  { t: "Completa missões", d: "Cinco desafios simples destravam a progressão da Sunset 5." },
  { t: "Acumula quilômetros", d: "O volume da preparação vira número visível — e motivo para voltar." },
  { t: "Recebe badges", d: "Conquistas digitais que o corredor mostra no story antes da prova." },
  { t: "Chega conectado", d: "No Race Day ele não conhece a marca. Ele já pertence a ela." },
];

const BADGES = ["First Run", "5K Complete", "Sunset Crew", "Pace Lab", "Ready"];

const R = 52;
const CIRC = 2 * Math.PI * R;

export function Pass() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: q(".js-pass-wrap")[0], start: "top top", end: "bottom bottom", scrub: 0.55 },
    });

    // anel de progresso: 0 → 92%
    const ringTarget = CIRC * (1 - 0.92);
    tl.fromTo(q(".js-ring"), { strokeDashoffset: CIRC }, { strokeDashoffset: ringTarget, ease: "none", duration: 1 }, 0);

    // contadores da tela
    const counters: [string, number, number, string][] = [
      [".js-c-treinos", 3, 0, ""],
      [".js-c-km", 18.7, 1, ""],
      [".js-c-missoes", 4, 0, ""],
      [".js-c-pct", 92, 0, "%"],
    ];
    counters.forEach(([sel, to, dec, suf]) => {
      const el = q<HTMLElement>(sel)[0];
      if (!el) return;
      const o = { v: 0 };
      tl.to(
        o,
        {
          v: to,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            el.textContent = o.v.toFixed(dec).replace(".", ",") + suf;
          },
        },
        0,
      );
    });

    // badges acendem em sequência ao longo do mesmo trecho
    tl.fromTo(
      q(".js-badge"),
      { opacity: 0.18, y: 8 },
      { opacity: 1, y: 0, duration: 0.16, stagger: 0.14, ease: "power2.out" },
      0.18,
    );

    // selo final
    tl.fromTo(
      q(".js-ready"),
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.16, ease: EASE.out },
      0.86,
    );

    // passos da esquerda acendem junto
    q<HTMLElement>(".js-step").forEach((step, i) => {
      tl.to(step, { opacity: 1, duration: 0.1 }, i * (0.86 / STEPS.length));
      tl.to(step.querySelector(".js-step-bar"), { scaleX: 1, duration: 0.12 }, i * (0.86 / STEPS.length));
    });
  });

  return (
    <Section id="pass" stage={2} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="06" label="Sunset Pass" />
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h1">{"The\nSunset Pass"}</Headline>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={cx(s.lead, "!text-[clamp(1.15rem,1.9vw,1.6rem)] !text-white")}>
                Transformando preparação em <span style={{ color: "var(--somma)" }}>participação.</span>
              </p>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- produto */}
        <div className="js-pass-wrap js-pin-track relative mt-16 md:mt-24 md:h-[380vh]">
          <div className="js-pin-frame md:sticky md:top-0 md:flex md:h-[100svh] md:items-center md:overflow-hidden">
            <div className={cx(s.shell, "grid w-full items-center gap-14 md:grid-cols-12 md:gap-10")}>
              {/* ------------------------------------------ passos */}
              <ol className="order-2 flex flex-col gap-5 md:order-1 md:col-span-5">
                {STEPS.map((st, i) => (
                  <li key={st.t} className={cx("js-step", s.mDim)}>
                    <div className="flex items-baseline gap-4">
                      <span className={cx(s.mono, "text-[0.625rem] tracking-[0.2em]")} style={{ color: "var(--somma)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className={cx(s.mono, "text-[0.8125rem] uppercase tracking-[0.12em] text-white")}>{st.t}</p>
                        <p className={cx(s.body, "mt-1 !text-[0.875rem]")}>{st.d}</p>
                        <span
                          className={cx("js-step-bar", s.mBarX, "mt-4 block h-px w-full origin-left")}
                          style={{ background: "linear-gradient(90deg,var(--somma),rgba(255,255,255,0))" }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* ------------------------------------------ mockup */}
              <div className="order-1 flex justify-center md:order-2 md:col-span-6 md:col-start-7">
                <div className={s.phone}>
                  <div className={s.phoneScreen}>
                    <div className={s.notch} />

                    {/* barra de status */}
                    <div className="flex items-center justify-between px-6 pt-4">
                      <span className={cx(s.mono, "text-[0.625rem] text-white/80")}>17:41</span>
                      <span className={cx(s.mono, "text-[0.5rem] tracking-[0.2em] text-white/50")}>SUNSET PASS</span>
                    </div>

                    <div className="flex flex-1 flex-col px-6 pb-6 pt-9">
                      {/* identificação */}
                      <p className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.3em]")} style={{ color: "var(--cyan)" }}>
                        Road to Sunset
                      </p>
                      <p className={cx(s.h3, "mt-1.5 !text-[1.35rem]")}>Alex Rodrigues</p>

                      {/* anel */}
                      <div className="relative mx-auto mt-7 grid h-[152px] w-[152px] place-items-center">
                        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
                          <circle className={s.ringTrack} cx="60" cy="60" r={R} fill="none" strokeWidth="7" />
                          <circle
                            className={cx(s.ringFill, "js-ring")}
                            cx="60"
                            cy="60"
                            r={R}
                            fill="none"
                            strokeWidth="7"
                            stroke="url(#passGrad)"
                            strokeDasharray={CIRC}
                            strokeDashoffset={CIRC}
                          />
                          <defs>
                            <linearGradient id="passGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#55DAFF" />
                              <stop offset="55%" stopColor="#3B8CFF" />
                              <stop offset="100%" stopColor="#FF2C04" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="text-center">
                          <p className={cx(s.num, "js-c-pct !text-[2.35rem]")}>0%</p>
                          <p className={cx(s.mono, "mt-1 text-[0.5rem] uppercase tracking-[0.24em] text-white/45")}>
                            da jornada
                          </p>
                        </div>
                      </div>

                      {/* selo */}
                      <div
                        className={cx("js-ready", s.mHide, "mx-auto mt-5 rounded-full px-4 py-2")}
                        style={{ background: "rgba(255,44,4,.13)", border: "1px solid rgba(255,44,4,.45)" }}
                      >
                        <p className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.24em]")} style={{ color: "var(--somma)" }}>
                          Ready for Sunset
                        </p>
                      </div>

                      {/* métricas */}
                      <div className="mt-7 grid grid-cols-3 gap-2 border-y py-4" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                        {[
                          { k: "Treinos", cls: "js-c-treinos", suf: "/4" },
                          { k: "KM", cls: "js-c-km", suf: "" },
                          { k: "Missões", cls: "js-c-missoes", suf: "/5" },
                        ].map((m) => (
                          <div key={m.k}>
                            <p className={cx(s.num, "!text-[1.3rem]")}>
                              <span className={m.cls}>0</span>
                              <span className="text-white/35">{m.suf}</span>
                            </p>
                            <p className={cx(s.mono, "mt-1 text-[0.5rem] uppercase tracking-[0.18em] text-white/40")}>
                              {m.k}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* badges */}
                      <p className={cx(s.mono, "mt-5 text-[0.5rem] uppercase tracking-[0.24em] text-white/40")}>Badges</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {BADGES.map((b, i) => (
                          <span
                            key={b}
                            className={cx(s.mono, s.mDimSoft, "js-badge rounded-full px-2.5 py-1 text-[0.5rem] uppercase tracking-[0.12em]")}
                            style={{
                              border: `1px solid ${i === BADGES.length - 1 ? "rgba(255,44,4,.5)" : "rgba(85,218,255,.3)"}`,
                              color: i === BADGES.length - 1 ? "var(--somma)" : "var(--cyan)",
                            }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>

                      {/* ação */}
                      <div
                        className="mt-auto grid place-items-center rounded-xl py-3.5"
                        style={{ background: "var(--somma)" }}
                      >
                        <span className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.2em] text-white")}>
                          Check-in no treinão
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
