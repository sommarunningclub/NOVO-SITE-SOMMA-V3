"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

/** Números da edição 2025 — fonte: relatório de pós-venda SBT Sunset Run. */
const STATS = [
  { v: 2000, fmt: "int", label: "atletas na edição 2025", note: "5 km e 10 km · Esplanada dos Ministérios" },
  { v: 2, fmt: "mm", label: "telespectadores alcançados", note: "Cobertura em TV aberta no período" },
  { v: 142, fmt: "mil", label: "visualizações em Feed", note: "Conteúdo da corrida nas redes do SBT" },
  { v: 144, fmt: "mil", label: "visualizações em Stories", note: "Cobertura multiplataforma do evento" },
];

/**
 * Por que a parceria faz sentido.
 *
 * Os números da edição passada entram um por vez numa moldura fixa, contando
 * durante a própria rolagem. O ponto não é a tabela: é chegar na conclusão de
 * que mídia o SBT já tem de sobra.
 */
export function PorQue() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);
    const cards = q<HTMLElement>(".js-stat");

    const tl = gsap.timeline({
      scrollTrigger: { trigger: q(".js-stats-wrap")[0], start: "top top", end: "bottom bottom", scrub: 0.45 },
    });

    cards.forEach((card, i) => {
      const at = i * 1;
      const numEl = card.querySelector<HTMLElement>(".js-stat-num");
      const target = Number(card.dataset.value);
      const kind = card.dataset.fmt;

      const format = (n: number) => {
        if (kind === "mm") return `+${n.toFixed(1).replace(".", ",")} MM`;
        if (kind === "mil") return `${Math.round(n)} MIL`;
        return Math.round(n).toLocaleString("pt-BR");
      };

      if (i > 0) {
        tl.fromTo(card, { opacity: 0, yPercent: 12 }, { opacity: 1, yPercent: 0, duration: 0.34, ease: EASE.out }, at);
      }
      if (numEl) {
        const counter = { v: 0 };
        tl.to(
          counter,
          {
            v: target,
            duration: 0.55,
            ease: "power2.out",
            onUpdate: () => {
              numEl.textContent = format(counter.v);
            },
          },
          at,
        );
      }
      if (i < cards.length - 1) {
        tl.to(card, { opacity: 0, yPercent: -12, duration: 0.34, ease: "power2.in" }, at + 0.66);
      }
    });

    // conclusão: duas batidas separadas, a segunda entra depois da primeira sumir
    const closer = gsap.timeline({
      scrollTrigger: { trigger: q(".js-closer-wrap")[0], start: "top top", end: "bottom bottom", scrub: 0.5 },
    });
    closer
      .to(q(".js-closer-a"), { opacity: 0, yPercent: -18, filter: "blur(8px)", duration: 0.4 }, 0.42)
      .fromTo(
        q(".js-closer-b"),
        { opacity: 0, yPercent: 22 },
        { opacity: 1, yPercent: 0, duration: 0.5, ease: EASE.out },
        0.52,
      )
      .fromTo(q(".js-closer-line"), { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, 0.72);
  });

  return (
    <Section id="porque" stage={0} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="03" label="Por que isso faz sentido" />
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <Headline level="h2">{"O SBT já tem mídia.\nA Somma tem\ncomunidade."}</Headline>
            </div>
            <div className="flex items-end md:col-span-3 md:col-start-10" data-rise>
              <p className={s.body}>
                A Sunset Run já provou que enche a Esplanada e ocupa a grade. O que ainda não existe é o que acontece
                nas semanas anteriores.
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------ números */}
        <div className="js-stats-wrap js-pin-track relative mt-16 h-[400vh] md:mt-28">
          <div className="js-pin-frame sticky top-0 flex h-[100svh] items-center overflow-hidden">
            <div className={cx(s.shell, "relative w-full")}>
              {STATS.map((st, i) => (
                <div
                  key={st.label}
                  data-value={st.v}
                  data-fmt={st.fmt}
                  className={cx("js-stat", i > 0 && cx(s.swap, s.mHide))}
                >
                  <span className={cx(s.bib, "mb-6 block")}>
                    {String(i + 1).padStart(2, "0")} / {String(STATS.length).padStart(2, "0")}
                  </span>
                  <p
                    className={cx(s.num, "js-stat-num")}
                    style={{ fontSize: "clamp(3.75rem,12vw,12rem)", fontVariationSettings: '"wdth" 112' }}
                  >
                    0
                  </p>
                  <div className="mt-7 flex flex-col gap-2 border-t pt-6" style={{ borderColor: "var(--hair)" }}>
                    <p
                      className={cx(s.h3, "!text-[clamp(1.15rem,2.4vw,2rem)]")}
                      style={{ fontVariationSettings: '"wdth" 100' }}
                    >
                      {st.label}
                    </p>
                    <p className={cx(s.mono, "text-[0.6875rem] uppercase tracking-[0.2em]")} style={{ color: "var(--dim-2)" }}>
                      {st.note}
                    </p>
                  </div>
                </div>
              ))}

            </div>

            {/* fora do fluxo dos cards: eles trocam de lugar, a fonte não */}
            <p
              className={cx(
                s.mono,
                "absolute bottom-8 left-[var(--gut)] text-[0.5625rem] uppercase tracking-[0.22em]",
              )}
              style={{ color: "rgba(255,255,255,.22)" }}
            >
              Fonte: relatório de pós-venda SBT Sunset Run 2025
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------ conclusão */}
        <div className="js-closer-wrap js-pin-track relative h-[200vh]">
          <div className="js-pin-frame sticky top-0 flex h-[100svh] items-center overflow-hidden">
            <div className={cx(s.shell, "relative w-full")}>
              <div className="js-closer-a">
                <p className={cx(s.eyebrow, "mb-7")}>A leitura</p>
                <h3 className={s.h2} style={{ color: "var(--dim)" }}>
                  A oportunidade não está
                  <br />
                  em adicionar mais mídia.
                </h3>
              </div>

              <div className={cx("js-closer-b", s.swap, s.mHide)}>
                <p className={cx(s.eyebrow, "mb-7")} style={{ color: "var(--somma)" }}>
                  Está aqui
                </p>
                <h3 className={s.h2}>
                  Está em construir
                  <br />a <span style={{ color: "var(--somma)" }}>jornada do corredor.</span>
                </h3>
                <div
                  className="js-closer-line mt-10 h-px w-full origin-left"
                  style={{ background: "linear-gradient(90deg,var(--somma),rgba(255,255,255,0))" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
