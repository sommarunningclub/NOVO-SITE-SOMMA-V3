"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

const STEPS = [
  { k: "Discover", d: "Comunicação Somma", n: "A base descobre a Sunset Run por quem ela já segue." },
  { k: "Join", d: "Sunset Pass", n: "Um toque e o corredor está dentro da jornada." },
  { k: "Train", d: "Training Series", n: "Quatro sábados que preparam para a distância." },
  { k: "Engage", d: "Missões e conteúdo", n: "A Sunset 5 mantém a comunidade ativa entre os treinos." },
  { k: "Run", d: "Somma Sunset Crew", n: "O bloco da comunidade dentro da prova." },
  { k: "Continue", d: "Conteúdo + CRM", n: "A relação não acaba na linha de chegada." },
];

/**
 * A jornada completa.
 *
 * A linha que atravessou a apresentação inteira aparece aqui por extenso, com
 * as seis etapas nomeadas. É o slide que o executivo fotografa.
 */
export function Journey() {
  const ref = useScope<HTMLDivElement>(({ root, mm }) => {
    const q = gsap.utils.selector(root);

    // a linha se desenha ao longo da leitura da seção
    const draw = (sel: string) =>
      gsap.fromTo(
        q(sel),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: q(".js-journey")[0], start: "top 74%", end: "bottom 62%", scrub: 0.6 },
        },
      );

    mm.add("(min-width: 768px)", () => {
      draw(".js-jline");
      gsap.fromTo(
        q(".js-jstep"),
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: EASE.soft,
          stagger: 0.1,
          scrollTrigger: { trigger: q(".js-journey")[0], start: "top 76%", once: true },
        },
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.fromTo(
        q(".js-jline-v"),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: q(".js-journey")[0], start: "top 80%", end: "bottom 70%", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        q(".js-jstep"),
        { opacity: 0, x: 18 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: EASE.soft,
          scrollTrigger: { trigger: q(".js-journey")[0], start: "top 82%", once: true },
        },
      );
    });
  });

  return (
    <Section id="journey" stage={5} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="12" label="A jornada completa" />

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h2">{"Seis etapas.\nUma relação\nque continua."}</Headline>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={s.body}>
                Do primeiro contato ao pós-prova. Cada etapa tem um responsável, uma ferramenta e um indicador — não é
                um conceito, é uma operação.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------ trilha */}
          <div className="js-journey relative mt-20 md:mt-32">
            {/* linha horizontal no desktop */}
            <div className="relative hidden md:block">
              <span className="absolute left-0 right-0 top-[7px] h-px" style={{ background: "var(--hair)" }} />
              <span
                className={cx("js-jline", s.mBarX, "absolute left-0 right-0 top-[7px] h-px origin-left")}
                style={{ background: "linear-gradient(90deg,var(--cyan) 0%,var(--violet) 52%,var(--somma) 100%)" }}
              />

              <ol className="relative grid grid-cols-6 gap-5">
                {STEPS.map((st, i) => (
                  <li key={st.k} className="js-jstep">
                    <span
                      className="mb-7 block h-[15px] w-[15px] rounded-full"
                      style={{
                        background: i === STEPS.length - 1 ? "var(--somma)" : "var(--ink)",
                        border: `1px solid ${i === STEPS.length - 1 ? "var(--somma)" : "rgba(255,255,255,.35)"}`,
                      }}
                    />
                    <p className={cx(s.mono, "text-[0.5625rem] tracking-[0.22em]")} style={{ color: "var(--dim-2)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className={cx(s.h3, "mt-2 !text-[clamp(1.05rem,1.5vw,1.4rem)]")}>{st.k}</p>
                    <p className={cx(s.mono, "mt-2 text-[0.625rem] uppercase tracking-[0.14em]")} style={{ color: "var(--cyan)" }}>
                      {st.d}
                    </p>
                    <p className={cx(s.body, "mt-3 !text-[0.8125rem] !leading-[1.5]")}>{st.n}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* trilha vertical no mobile */}
            <div className="relative md:hidden">
              <span className="absolute bottom-2 left-[7px] top-2 w-px" style={{ background: "var(--hair)" }} />
              <span
                className={cx("js-jline-v", s.mBarY, "absolute bottom-2 left-[7px] top-2 w-px origin-top")}
                style={{ background: "linear-gradient(180deg,var(--cyan),var(--violet) 52%,var(--somma))" }}
              />

              <ol className="relative flex flex-col gap-9">
                {STEPS.map((st, i) => (
                  <li key={st.k} className="js-jstep grid grid-cols-[15px_1fr] gap-5">
                    <span
                      className="mt-1.5 block h-[15px] w-[15px] rounded-full"
                      style={{
                        background: i === STEPS.length - 1 ? "var(--somma)" : "var(--ink)",
                        border: `1px solid ${i === STEPS.length - 1 ? "var(--somma)" : "rgba(255,255,255,.35)"}`,
                      }}
                    />
                    <div>
                      <p className={cx(s.mono, "text-[0.5625rem] tracking-[0.22em]")} style={{ color: "var(--dim-2)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <p className={cx(s.h3, "mt-1.5")}>{st.k}</p>
                      <p className={cx(s.mono, "mt-1.5 text-[0.625rem] uppercase tracking-[0.14em]")} style={{ color: "var(--cyan)" }}>
                        {st.d}
                      </p>
                      <p className={cx(s.body, "mt-2.5 !text-[0.875rem]")}>{st.n}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
