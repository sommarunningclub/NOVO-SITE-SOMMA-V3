"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

/** Edição 2025. Fonte: relatório de pós-venda SBT Sunset Run. */
const SBT = [
  { n: 2000, fmt: "int", label: "atletas", note: "5 km e 10 km" },
  { n: 2, fmt: "mm", label: "telespectadores", note: "TV aberta" },
  { n: 142, fmt: "mil", label: "views em Feed", note: "redes SBT" },
  { n: 144, fmt: "mil", label: "views em Stories", note: "redes SBT" },
];

/** O outro lado da mesa. */
const SOMMA = ["O maior running club do Distrito Federal", "Encontros todos os sábados", "Uma comunidade democrática"];

/**
 * Por que a parceria faz sentido.
 *
 * Os quatro números do SBT entram juntos, numa linha só: o argumento não é cada
 * um deles, é o conjunto provando que mídia já existe de sobra. Do outro lado, a
 * base da Somma. A conclusão vem riscada, sem precisar de texto para explicar.
 */
export function PorQue() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    // contadores disparam juntos quando a linha entra
    q<HTMLElement>(".js-num").forEach((el) => {
      const to = Number(el.dataset.n);
      const kind = el.dataset.fmt;
      const fmt = (v: number) =>
        kind === "mm"
          ? `+${v.toFixed(1).replace(".", ",")} MM`
          : kind === "mil"
            ? `${Math.round(v)} MIL`
            : Math.round(v).toLocaleString("pt-BR");
      const o = { v: 0 };
      el.textContent = fmt(0);
      gsap.to(o, {
        v: to,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = fmt(o.v);
        },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    gsap.fromTo(
      q(".js-stat"),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: EASE.soft,
        scrollTrigger: { trigger: q(".js-stats")[0], start: "top 84%", once: true },
      },
    );

    // a base Somma responde aos números do SBT
    const somma = q<HTMLElement>(".js-somma-num")[0];
    if (somma) {
      const o = { v: 0 };
      gsap.to(o, {
        v: 6000,
        duration: 1.7,
        ease: "power2.out",
        onUpdate: () => {
          somma.textContent = `+${Math.round(o.v).toLocaleString("pt-BR")}`;
        },
        scrollTrigger: { trigger: somma, start: "top 85%", once: true },
      });
    }

    gsap.fromTo(
      q(".js-fact"),
      { opacity: 0, x: -14 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.09,
        ease: EASE.soft,
        scrollTrigger: { trigger: q(".js-somma")[0], start: "top 80%", once: true },
      },
    );

    // o risco corta a frase que deixou de valer
    gsap.fromTo(
      q(".js-strike-out"),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.7,
        ease: "power2.inOut",
        scrollTrigger: { trigger: q(".js-verdict")[0], start: "top 72%", once: true },
      },
    );
  });

  return (
    <Section id="porque" stage={0} className="pt-24 md:pt-32">
      <div ref={ref} className={cx(s.shell, "relative z-10")}>
        <Chapter n="03" label="Por que isso faz sentido" />

        <Headline level="h2" className="max-w-[18ch]">
          {"O SBT já tem mídia.\nA Somma tem comunidade."}
        </Headline>

        {/* ------------------------------------------------ o que o SBT tem */}
        <div className="js-stats mt-16 md:mt-24">
          <div className="mb-8 flex items-baseline gap-4">
            <span className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--cyan)" }}>
              SBT Sunset Run · 2025
            </span>
            <span className={cx(s.rule, "js-rule flex-1")} />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-8">
            {SBT.map((st) => (
              <div key={st.label} className="js-stat">
                <p
                  className={cx(s.num, "js-num")}
                  data-n={st.n}
                  data-fmt={st.fmt}
                  style={{ fontSize: "clamp(2.1rem,5vw,4.5rem)" }}
                >
                  0
                </p>
                <p className={cx(s.mono, "mt-3 text-[0.6875rem] uppercase tracking-[0.16em] text-white")}>{st.label}</p>
                <p className={cx(s.mono, "mt-1 text-[0.5625rem] uppercase tracking-[0.2em]")} style={{ color: "var(--dim-2)" }}>
                  {st.note}
                </p>
              </div>
            ))}
          </div>

          <p className={cx(s.mono, "mt-8 text-[0.5625rem] uppercase tracking-[0.2em]")} style={{ color: "rgba(255,255,255,.24)" }}>
            Fonte: pós-venda SBT Sunset Run 2025
          </p>
        </div>

        {/* ------------------------------------------------ o que a Somma tem */}
        <div className="js-somma mt-20 md:mt-28">
          <div className="mb-8 flex items-baseline gap-4">
            <span className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--somma)" }}>
              Somma Club · hoje
            </span>
            <span className={cx(s.rule, "js-rule flex-1")} />
          </div>

          <div className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-4">
              <p className={cx(s.num, "js-somma-num")} style={{ fontSize: "clamp(3rem,8vw,7rem)" }}>
                0
              </p>
              <p className={cx(s.mono, "mt-3 text-[0.6875rem] uppercase tracking-[0.16em] text-white")}>
                membros em Brasília
              </p>
            </div>

            <ul className="flex flex-col gap-3.5 md:col-span-7 md:col-start-6">
              {SOMMA.map((f) => (
                <li key={f} className="js-fact flex items-center gap-4">
                  <span
                    aria-hidden
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem]"
                    style={{ border: "1px solid rgba(255,44,4,.5)", color: "var(--somma)" }}
                  >
                    ✓
                  </span>
                  <span className={cx(s.h3, "!text-[clamp(1rem,1.6vw,1.3rem)]")} style={{ fontVariationSettings: '"wdth" 100' }}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ------------------------------------------------ o veredito */}
        <div className="js-verdict mt-20 border-t pt-12 md:mt-28 md:pt-16" style={{ borderColor: "var(--hair)" }}>
          <div className="relative inline-block">
            <p className={s.h2} style={{ color: "var(--dim-2)", fontSize: "clamp(1.4rem,3vw,2.6rem)" }}>
              Mais mídia
            </p>
            {/* o risco diz o que um parágrafo diria */}
            <span
              aria-hidden
              // 44% e não 50%: a caixa de linha reserva espaço para descendentes
              // que a palavra em caixa alta não usa, então o meio real sobe
              className="js-strike-out absolute left-[-2%] top-[44%] h-[3px] w-[104%] origin-left"
              style={{ background: "var(--somma)" }}
            />
          </div>

          <p className={cx(s.h2, "mt-5")} style={{ fontSize: "clamp(1.75rem,4.4vw,4rem)" }}>
            A jornada do <span style={{ color: "var(--somma)" }}>corredor.</span>
          </p>
        </div>
      </div>
    </Section>
  );
}
