"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, KmTick, cx, s } from "../_ui";

const WEEKS = [
  {
    n: "01",
    name: "Kickoff Run",
    km: "KM 00",
    lead: "O lançamento da jornada.",
    items: ["Apresentação da Sunset Run à comunidade", "Primeiro treino oficial da série", "Ativação SBT no ponto de encontro", "Abertura do Sunset Pass"],
  },
  {
    n: "02",
    name: "5K Challenge",
    km: "KM 05",
    lead: "A distância vira meta coletiva.",
    items: ["Treino específico para os 5 km", "Desafio lançado para toda a base", "Conteúdo com quem corre pela primeira vez", "Primeiras missões concluídas"],
  },
  {
    n: "03",
    name: "Pace Lab",
    km: "KM 10",
    lead: "Ritmo, estratégia e pacers.",
    items: ["Treino de ritmo com os treinadores", "Formação dos grupos de pace", "Preparação específica 5K e 10K", "Definição do pelotão Somma"],
  },
  {
    n: "04",
    name: "Shakeout",
    km: "KM 21",
    lead: "O último encontro antes da largada.",
    items: ["Treino leve de soltura", "Entrega simbólica ao grupo", "Conteúdo final da série", "Briefing de Race Day"],
  },
];

/**
 * Training Series.
 *
 * No desktop as quatro semanas correm na horizontal puxadas pelo scroll
 * vertical — a leitura anda para a frente igual à jornada. No mobile viram
 * cartões empilhados, porque arrastar lateralmente dentro de uma página que já
 * rola é um gesto que briga com o polegar.
 */
export function Road() {
  const ref = useScope<HTMLDivElement>(({ root, mm }) => {
    const q = gsap.utils.selector(root);

    mm.add("(min-width: 768px)", () => {
      const track = q<HTMLElement>(".js-track")[0];
      const wrap = q<HTMLElement>(".js-track-wrap")[0];
      if (!track || !wrap) return;

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      // a barra de progresso da série acompanha o mesmo movimento
      gsap.fromTo(
        q(".js-track-fill"),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.fromTo(
        q(".js-week"),
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: EASE.soft,
          stagger: 0.12,
          scrollTrigger: { trigger: q(".js-track")[0], start: "top 80%", once: true },
        },
      );
    });
  });

  return (
    <Section id="road" stage={2} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="05" label="Road to Sunset" />

          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h2">{"4 semanas.\nUma comunidade.\nUma largada."}</Headline>
            </div>

            <div className="flex flex-col justify-end gap-5 md:col-span-4 md:col-start-9" data-rise data-rise-children>
              <div>
                <p className={cx(s.h3, "!text-[clamp(1.05rem,1.9vw,1.5rem)]")}>SBT Sunset Run Training Series</p>
                <p className={cx(s.mono, "mt-2 text-[0.6875rem] uppercase tracking-[0.24em]")} style={{ color: "var(--somma)" }}>
                  powered by Somma Club
                </p>
              </div>
              <p className={s.body}>
                Os treinões que a Somma já realiza todo sábado passam a ser a preparação oficial da corrida. Cada
                semana vira um capítulo — e a Esplanada deixa de ser o começo para virar o destino.
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- trilho horizontal */}
        <div className="js-track-wrap js-pin-track relative mt-14 md:mt-24 md:h-[420vh]">
          <div className="js-pin-frame md:sticky md:top-0 md:flex md:h-[100svh] md:flex-col md:justify-center md:overflow-hidden">
            {/* cabeçalho do trilho, fixo enquanto as semanas passam */}
            <div className={cx(s.shell, "hidden items-end justify-between pb-10 md:flex")}>
              <p className={cx(s.eyebrow)}>A série · 4 sábados</p>
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.24em]")} style={{ color: "var(--dim-2)" }}>
                Role para avançar →
              </p>
            </div>

            <div className="js-track flex flex-col gap-4 px-[var(--gut)] md:flex-row md:gap-6 md:px-0 md:pl-[var(--gut)] md:pr-[12vw]">
              {WEEKS.map((w, i) => (
                <article
                  key={w.n}
                  className={cx(s.card, "js-week relative flex flex-col p-6 md:w-[clamp(340px,30vw,460px)] md:shrink-0 md:p-9")}
                >
                  {/* número da semana como marca d'água tipográfica */}
                  <span
                    aria-hidden
                    className={cx(s.num, "pointer-events-none absolute right-5 top-3 select-none md:right-7")}
                    style={{
                      fontSize: "clamp(4.5rem,9vw,8rem)",
                      color: "transparent",
                      WebkitTextStroke: `1px ${i === 3 ? "rgba(255,44,4,.34)" : "rgba(255,255,255,.11)"}`,
                    }}
                  >
                    {w.n}
                  </span>

                  <KmTick km={w.km} />

                  <p
                    className={cx(s.mono, "mt-7 text-[0.625rem] uppercase tracking-[0.3em]")}
                    style={{ color: i === 3 ? "var(--somma)" : "var(--cyan)" }}
                  >
                    Week {w.n}
                  </p>

                  <h3 className={cx(s.h3, "mt-2.5")}>{w.name}</h3>
                  <p className={cx(s.lead, "mt-3 !text-[1.0625rem]")}>{w.lead}</p>

                  <ul className="mt-7 flex flex-col gap-2.5 border-t pt-6" style={{ borderColor: "var(--hair)" }}>
                    {w.items.map((it) => (
                      <li key={it} className={cx(s.body, "flex gap-3 !text-[0.875rem] !leading-[1.45]")}>
                        <span className="mt-[0.5em] h-px w-3 shrink-0" style={{ background: "var(--somma)" }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              {/* fecho do trilho: a série desemboca no dia da prova */}
              <article className="js-week relative flex shrink-0 flex-col justify-center p-6 md:w-[clamp(300px,24vw,380px)] md:p-9">
                <KmTick km="FINISH" />
                <p className={cx(s.h2, "mt-6")} style={{ fontSize: "clamp(2.1rem,4.4vw,3.6rem)" }}>
                  Race
                  <br />
                  <span style={{ color: "var(--somma)" }}>Day</span>
                </p>
                <p className={cx(s.body, "mt-4")}>
                  Quatro semanas depois, a comunidade chega na Esplanada já conectada — e correndo junta.
                </p>
              </article>
            </div>

            {/* progresso da série */}
            <div className={cx(s.shell, "mt-10 hidden md:block")}>
              <div className="relative h-px w-full" style={{ background: "var(--hair)" }}>
                <span
                  className="js-track-fill absolute inset-0 h-px origin-left"
                  style={{ background: "linear-gradient(90deg,var(--cyan),var(--somma))" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
