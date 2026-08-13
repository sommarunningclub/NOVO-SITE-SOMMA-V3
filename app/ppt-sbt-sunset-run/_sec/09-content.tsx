"use client";

import { gsap, useScope, EASE, scrub } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

const EPISODES = [
  { ep: "EP.01", t: "Why we run", d: "Quem são as pessoas que decidem correr a Sunset Run.", tone: "#1466E0" },
  { ep: "EP.02", t: "The training", d: "Os sábados, o esforço e o que acontece antes do sol cair.", tone: "#3B8CFF" },
  { ep: "EP.03", t: "The community", d: "O grupo que se forma quando ninguém corre sozinho.", tone: "#7A3BE0" },
  { ep: "EP.04", t: "Ready", d: "A última semana. O pass completo. O nervoso bom.", tone: "#FF6A2B" },
  { ep: "EP.05", t: "Race day", d: "A Esplanada, o pelotão Somma e a linha de chegada.", tone: "#FF2C04" },
];

/**
 * Content Engine.
 *
 * Cinco episódios que só existem porque os treinos acontecem de verdade. A
 * divisão de trabalho é o argumento: a Somma produz o acontecimento, o SBT
 * distribui.
 */
export function ContentEngine() {
  const ref = useScope<HTMLDivElement>(({ root, mm }) => {
    const q = gsap.utils.selector(root);

    gsap.fromTo(
      q(".js-ep"),
      { y: 46, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.95,
        ease: EASE.soft,
        stagger: 0.09,
        scrollTrigger: { trigger: q(".js-eps")[0], start: "top 82%", once: true },
      },
    );

    // deslocamento vertical alternado: quebra a linha reta dos cards
    mm.add("(min-width: 768px)", () => {
      q<HTMLElement>(".js-ep").forEach((el, i) => {
        gsap.to(el, {
          yPercent: i % 2 === 0 ? -9 : 9,
          ease: "none",
          scrollTrigger: { trigger: q(".js-eps")[0], start: "top bottom", end: "bottom top", scrub: scrub(0.8) },
        });
      });
    });
  });

  return (
    <Section id="content" stage={3} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="09" label="Content engine" />

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h2">{"A comunidade\nvira conteúdo."}</Headline>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={s.body}>
                Não é produção publicitária. É registro de uma coisa que aconteceu.
              </p>
            </div>
          </div>

          <p className={cx(s.mono, "mt-14 text-[0.625rem] uppercase tracking-[0.3em] md:mt-20")} style={{ color: "var(--cyan)" }}>
            Série · Road to Sunset
          </p>
        </div>

        {/* ------------------------------------------------------ episódios */}
        {/* cinco colunas só a partir de 1024px: abaixo disso cada card fica
            estreito demais e o carrossel lê melhor */}
        <div className="js-eps mt-8 flex gap-4 overflow-x-auto px-[var(--gut)] pb-6 md:mt-10 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:pb-0">
          {EPISODES.map((e, i) => (
            <article
              key={e.ep}
              className={cx(s.card, "js-ep relative flex min-w-[74vw] flex-col justify-end overflow-hidden p-6 md:min-w-[42vw] lg:min-w-0")}
              style={{ aspectRatio: "4 / 5" }}
            >
              {/* campo de cor do episódio */}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(120% 78% at 50% 0%, ${e.tone}70 0%, ${e.tone}22 42%, rgba(4,8,26,0) 72%), linear-gradient(180deg, rgba(4,8,26,0) 34%, rgba(4,8,26,.9) 88%)`,
                }}
              />

              {/* número do episódio como massa gráfica no miolo do card */}
              <span
                aria-hidden
                className={cx(s.num, "pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 select-none")}
                style={{
                  fontSize: "clamp(4rem,7vw,6.5rem)",
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,.22)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, ${e.tone}, rgba(255,255,255,0))` }}
              />

              <div className="relative">
                <p className={cx(s.mono, "text-[0.625rem] tracking-[0.24em]")} style={{ color: e.tone === "#FF2C04" ? "var(--somma)" : "var(--cyan)" }}>
                  {e.ep}
                </p>
                <h3 className={cx(s.h3, "mt-2 !text-[clamp(1.15rem,1.7vw,1.5rem)]")}>{e.t}</h3>
                <p className={cx(s.body, "mt-2.5 !text-[0.8125rem] !leading-[1.5]")}>{e.d}</p>
              </div>

              {/* numeração discreta como marca de série */}
              <span
                aria-hidden
                className={cx(s.mono, "absolute right-5 top-5 text-[0.625rem]")}
                style={{ color: "rgba(255,255,255,.24)" }}
              >
                {String(i + 1).padStart(2, "0")}/05
              </span>
            </article>
          ))}
        </div>

        {/* ------------------------------------------------------ divisão */}
        <div className={cx(s.shell, "mt-20 md:mt-28")}>
          <div className="grid gap-8 border-t pt-12 md:grid-cols-2 md:gap-16" style={{ borderColor: "var(--hair)" }}>
            <div data-rise>
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--somma)" }}>
                Somma
              </p>
              <p className={cx(s.h2, "mt-4")} style={{ fontSize: "clamp(1.75rem,3.2vw,3rem)" }}>
                Creates
                <br />
                the moment.
              </p>
            </div>
            <div data-rise>
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--cyan)" }}>
                SBT
              </p>
              <p className={cx(s.h2, "mt-4")} style={{ fontSize: "clamp(1.75rem,3.2vw,3rem)" }}>
                Amplifies
                <br />
                it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
