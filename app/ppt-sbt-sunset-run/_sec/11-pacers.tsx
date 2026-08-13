"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

type Group = { tier: string; pace: string; target: string; who: string };

const GROUPS: { dist: string; rows: Group[] }[] = [
  {
    dist: "5K",
    rows: [
      { tier: "Comfort", pace: "7'30\" a 8'30\"", target: "≈ 40 min", who: "Seu primeiro 5K. Caminhar um pouco é permitido." },
      { tier: "Intermediate", pace: "6'00\" a 7'00\"", target: "≈ 32 min", who: "Já corre, quer terminar forte." },
      { tier: "Fast", pace: "sub 5'30\"", target: "sub 27 min", who: "Quem corre pelo relógio." },
    ],
  },
  {
    dist: "10K",
    rows: [
      { tier: "Comfort", pace: "7'00\" a 8'00\"", target: "≈ 75 min", who: "Quer simplesmente chegar sorrindo." },
      { tier: "Intermediate", pace: "6'00\"", target: "sub 60 min", who: "Quer correr 10K abaixo de 60." },
      { tier: "Fast", pace: "sub 5'00\"", target: "sub 50 min", who: "Ritmo de prova, do início ao fim." },
    ],
  },
];

export function Pacers() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    gsap.fromTo(
      q(".js-pacer"),
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: EASE.soft,
        stagger: 0.07,
        scrollTrigger: { trigger: q(".js-pacers")[0], start: "top 80%", once: true },
      },
    );

    // trilhas de pista correndo ao fundo, uma por grupo
    q<HTMLElement>(".js-lane").forEach((lane, i) => {
      gsap.fromTo(
        lane,
        { xPercent: -100 },
        { xPercent: 100, duration: 7 + i * 1.6, ease: "none", repeat: -1, delay: i * 0.5 },
      );
    });
  });

  return (
    <Section id="pacers" stage={4} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="11" label="Sunset Pacers" />

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h2">{"Don't run\nalone."}</Headline>
              <p className={cx(s.h3, "mt-5")} style={{ color: "var(--somma)" }}>
                Run with Somma.
              </p>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={s.body}>
                Treinadores e insiders como pacers. Cada grupo tem ritmo, balão e responsável.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------ grupos */}
          <div className="js-pacers mt-16 flex flex-col gap-14 md:mt-24 md:gap-20">
            {GROUPS.map((g) => (
              <div key={g.dist}>
                <div className="mb-6 flex items-baseline gap-5">
                  <p className={cx(s.num, "!text-[clamp(2.2rem,4.6vw,4rem)]")}>{g.dist}</p>
                  <span className="h-px flex-1" style={{ background: "var(--hair)" }} />
                  <span className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.24em]")} style={{ color: "var(--dim-2)" }}>
                    3 grupos
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-3 md:gap-5">
                  {g.rows.map((r, i) => (
                    <article
                      key={r.tier}
                      className={cx(s.card, "js-pacer relative overflow-hidden p-6 md:p-7")}
                    >
                      {/* raia da pista correndo pelo rodapé, longe da leitura */}
                      <span
                        aria-hidden
                        className="js-lane absolute bottom-0 left-0 h-px w-1/2"
                        style={{
                          background: `linear-gradient(90deg,rgba(85,218,255,0),${i === 2 ? "rgba(255,44,4,.5)" : "rgba(85,218,255,.4)"},rgba(85,218,255,0))`,
                        }}
                      />

                      <div className="relative">
                        <p
                          className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.3em]")}
                          style={{ color: i === 2 ? "var(--somma)" : "var(--cyan)" }}
                        >
                          {r.tier}
                        </p>

                        <p className={cx(s.num, "mt-5 !text-[clamp(1.5rem,2.4vw,2rem)]")}>{r.pace}</p>
                        <p className={cx(s.mono, "mt-1.5 text-[0.625rem] uppercase tracking-[0.18em]")} style={{ color: "var(--dim-2)" }}>
                          por km · alvo {r.target}
                        </p>

                        <p className={cx(s.body, "mt-6 border-t pt-5 !text-[0.875rem]")} style={{ borderColor: "var(--hair)" }}>
                          {r.who}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 border-t pt-10 md:mt-24" style={{ borderColor: "var(--hair)" }} data-rise>
            <p className={cx(s.h2, "max-w-[20ch]")} style={{ fontSize: "clamp(1.6rem,3vw,2.8rem)" }}>
              Existe um grupo <span style={{ color: "var(--somma)" }}>para você.</span>
            </p>
            {/* é aqui que "comunidade democrática" deixa de ser adjetivo e vira operação */}
            <p className={cx(s.body, "mt-5 max-w-[46ch]")}>
              Comunidade democrática na prática: do primeiro 5K ao sub-50, cada ritmo com um responsável.
            </p>
            <p className={cx(s.mono, "mt-5 text-[0.625rem] uppercase tracking-[0.2em]")} style={{ color: "var(--dim-2)" }}>
              Ritmos indicativos · definição final com os treinadores
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
