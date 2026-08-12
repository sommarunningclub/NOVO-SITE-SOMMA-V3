"use client";

import { gsap, useScope } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

/** O que a operação mede — não é promessa de resultado, é o que passa a existir. */
const METRICS = [
  { k: "Cadastros no Sunset Pass", u: "por atleta identificado" },
  { k: "Check-ins nos treinões", u: "presença real, com data e hora" },
  { k: "Treinos realizados", u: "frequência ao longo das 4 semanas" },
  { k: "Quilômetros acumulados", u: "volume gerado pela comunidade" },
  { k: "Missões concluídas", u: "progressão da Sunset 5" },
  { k: "Cliques para inscrição", u: "tráfego atribuído à jornada" },
  { k: "Inscrições convertidas", u: "com código ou link rastreado" },
  { k: "Conteúdo gerado", u: "stories, reels e menções da base" },
];

/** Curva de participação semana a semana — usada só como forma, não como projeção. */
const CURVE = [12, 26, 34, 48, 61, 74, 88, 100];

export function DataSection() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    gsap.fromTo(
      q(".js-metric"),
      { opacity: 0, x: -14 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.055,
        ease: "power2.out",
        scrollTrigger: { trigger: q(".js-metrics")[0], start: "top 78%", once: true },
      },
    );

    // a linha se desenha da esquerda para a direita
    const path = q<SVGPathElement>(".js-curve")[0];
    if (path) {
      const len = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: q(".js-chart")[0], start: "top 85%", end: "bottom 55%", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        q(".js-bar"),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          stagger: 0.06,
          scrollTrigger: { trigger: q(".js-chart")[0], start: "top 85%", end: "bottom 55%", scrub: 0.6 },
        },
      );
    }
  });

  // polilinha da curva em coordenadas do viewBox
  const pts = CURVE.map((v, i) => `${(i / (CURVE.length - 1)) * 100},${44 - (v / 100) * 38}`).join(" ");

  return (
    <Section id="data" stage={3} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="08" label="Community data" />

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <Headline level="h2">{"From engagement\nto data"}</Headline>
            </div>
            <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
              <p className={s.body}>
                Cada etapa da jornada acontece dentro de um sistema. Isso significa que ela pode ser medida — e que o
                SBT recebe um retrato de comportamento, não uma estimativa de alcance.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------ visualização */}
          <div className="js-chart mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7">
              <p className={cx(s.eyebrow, "mb-6")}>Curva de participação · 4 semanas</p>

              <div className="relative">
                <svg viewBox="0 0 100 48" preserveAspectRatio="none" className="h-[180px] w-full md:h-[260px]">
                  {/* barras de apoio */}
                  {CURVE.map((v, i) => (
                    <rect
                      key={i}
                      className="js-bar"
                      x={(i / CURVE.length) * 100 + 1.5}
                      y={44 - (v / 100) * 38}
                      width={100 / CURVE.length - 3}
                      height={(v / 100) * 38}
                      fill="rgba(85,218,255,.11)"
                      style={{ transformOrigin: "center bottom", transformBox: "fill-box" }}
                    />
                  ))}
                  {/* linha */}
                  <polyline className="js-curve" points={pts} fill="none" stroke="url(#dataGrad)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="44" x2="100" y2="44" stroke="rgba(255,255,255,.14)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
                  <defs>
                    <linearGradient id="dataGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#55DAFF" />
                      <stop offset="100%" stopColor="#FF2C04" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="mt-3 flex justify-between">
                  {["W1", "W2", "W3", "W4", "RACE"].map((w) => (
                    <span key={w} className={cx(s.mono, "text-[0.5625rem] uppercase tracking-[0.2em]")} style={{ color: "var(--dim-2)" }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              <p className={cx(s.mono, "mt-6 text-[0.5625rem] uppercase tracking-[0.2em]")} style={{ color: "rgba(255,255,255,.24)" }}>
                Forma ilustrativa da progressão · não é projeção de resultado
              </p>
            </div>

            {/* ------------------------------------------------ métricas */}
            <div className="js-metrics md:col-span-5 md:col-start-8">
              <p className={cx(s.eyebrow, "mb-6")}>O que passa a ser mensurável</p>
              <ul className="flex flex-col">
                {METRICS.map((m, i) => (
                  <li
                    key={m.k}
                    className="js-metric flex items-baseline gap-4 border-b py-3.5"
                    style={{ borderColor: "var(--hair)" }}
                  >
                    <span className={cx(s.mono, "text-[0.5625rem] tracking-[0.2em]")} style={{ color: "var(--somma)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[0.9375rem] text-white">{m.k}</span>
                      <span className={cx(s.mono, "mt-0.5 block text-[0.625rem] uppercase tracking-[0.14em]")} style={{ color: "var(--dim-2)" }}>
                        {m.u}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ------------------------------------------------ fecho */}
          <div className="mt-20 border-t pt-12 md:mt-32" style={{ borderColor: "var(--hair)" }}>
            <Headline level="h2" className="max-w-[18ch]">
              {"Não entregamos apenas alcance.\nEntregamos comportamento."}
            </Headline>
          </div>
        </div>
      </div>
    </Section>
  );
}
