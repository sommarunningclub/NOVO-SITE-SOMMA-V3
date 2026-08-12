"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Headline, Chapter, Section, cx, s } from "../_ui";

const ASKS = [
  { t: "Inventory de inscrições", d: "Um lote destinado às ações da Somma ao longo da jornada." },
  { t: "Códigos e condições exclusivas", d: "Vantagem real para quem vem pela comunidade." },
  { t: "Inscrições para desafios", d: "Prêmio das missões e dos desafios da Sunset 5." },
  { t: "Inscrições para insiders", d: "Quem produz conteúdo precisa estar na prova." },
  { t: "Premiações da comunidade", d: "Reconhecimento para quem completou a jornada." },
  { t: "Presença Somma no kit", d: "Possibilidade a ser avaliada com a organização." },
];

/**
 * Contrapartida.
 *
 * Os dois círculos se encontram: o SBT entra na comunidade antes da prova, a
 * Somma alcança os corredores da prova depois dela. A troca é o argumento — não
 * um pedido de cortesias.
 */
export function ValueBothWays() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    gsap
      .timeline({
        scrollTrigger: { trigger: q(".js-venn")[0], start: "top 82%", end: "bottom 60%", scrub: 0.6 },
      })
      .fromTo(q(".js-c-left"), { xPercent: -34, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "none" }, 0)
      .fromTo(q(".js-c-right"), { xPercent: 34, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "none" }, 0)
      .fromTo(q(".js-venn-mid"), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, ease: "none" }, 0.55);

    gsap.fromTo(
      q(".js-ask"),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.07,
        ease: EASE.soft,
        scrollTrigger: { trigger: q(".js-asks")[0], start: "top 82%", once: true },
      },
    );
  });

  return (
    <Section id="value" stage={5} className="pt-24 md:pt-32">
      <div ref={ref}>
        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="16" label="Contrapartida estratégica" />

          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <Headline level="h2">{"Let's build value\nboth ways."}</Headline>
            </div>
            <div className="flex items-end md:col-span-3 md:col-start-10" data-rise>
              <p className={s.body}>
                Não queremos somente cortesias. Queremos uma troca em que as duas bases crescem — antes e depois da
                corrida.
              </p>
            </div>
          </div>

          {/* ------------------------------------------------ encontro */}
          <div className="js-venn relative mx-auto mt-20 flex max-w-3xl items-center justify-center md:mt-32">
            <div className="relative flex w-full items-center justify-center" style={{ height: "clamp(220px,32vw,340px)" }}>
              <span
                className="js-c-left absolute aspect-square w-[52%] rounded-full"
                style={{
                  left: "10%",
                  border: "1px solid rgba(85,218,255,.5)",
                  background: "radial-gradient(circle at 40% 40%, rgba(20,102,224,.24), rgba(20,102,224,0) 70%)",
                }}
              />
              <span
                className="js-c-right absolute aspect-square w-[52%] rounded-full"
                style={{
                  right: "10%",
                  border: "1px solid rgba(255,44,4,.5)",
                  background: "radial-gradient(circle at 60% 40%, rgba(255,44,4,.2), rgba(255,44,4,0) 70%)",
                }}
              />

              <span
                className={cx(s.mono, "js-c-left absolute text-[0.6875rem] uppercase tracking-[0.24em]")}
                style={{ left: "17%", color: "var(--cyan)" }}
              >
                SBT
              </span>
              <span
                className={cx(s.mono, "js-c-right absolute text-[0.6875rem] uppercase tracking-[0.24em]")}
                style={{ right: "16%", color: "var(--somma)" }}
              >
                Somma
              </span>

              <span
                className={cx(s.mono, "js-venn-mid relative z-10 text-center text-[0.625rem] uppercase leading-[1.9] tracking-[0.2em]")}
                style={{ color: "var(--paper)" }}
              >
                Corredores
                <br />
                em comum
              </span>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:mt-16 md:grid-cols-2 md:gap-14" data-rise data-rise-children>
            <p className={cx(s.body, "border-t pt-6 !text-[0.9375rem] !text-white")} style={{ borderColor: "rgba(85,218,255,.32)" }}>
              O SBT acessa a comunidade Somma <span style={{ color: "var(--cyan)" }}>antes</span> da corrida.
            </p>
            <p className={cx(s.body, "border-t pt-6 !text-[0.9375rem] !text-white")} style={{ borderColor: "rgba(255,44,4,.32)" }}>
              A Somma acessa os corredores da Sunset Run <span style={{ color: "var(--somma)" }}>depois</span> dela.
            </p>
          </div>

          {/* ------------------------------------------------ pedidos */}
          <div className="js-asks mt-20 md:mt-32">
            <p className={cx(s.eyebrow, "mb-8")}>O que propomos</p>
            <ul className="grid gap-px md:grid-cols-2">
              {ASKS.map((a, i) => (
                <li
                  key={a.t}
                  className="js-ask flex gap-5 border-t py-6 md:pr-10"
                  style={{ borderColor: "var(--hair)" }}
                >
                  <span className={cx(s.mono, "mt-1 text-[0.5625rem] tracking-[0.22em]")} style={{ color: "var(--somma)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className={cx(s.h3, "!text-[clamp(1.05rem,1.6vw,1.3rem)]")} style={{ fontVariationSettings: '"wdth" 100' }}>
                      {a.t}
                    </p>
                    <p className={cx(s.body, "mt-2 !text-[0.875rem]")}>{a.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ------------------------------------------------ QR no kit */}
          <div
            className="mt-14 flex flex-col items-center gap-7 p-8 text-center md:mt-20 md:flex-row md:gap-10 md:p-12 md:text-left"
            style={{ border: "1px solid var(--hair)", background: "rgba(255,255,255,.028)" }}
            data-rise
          >
            {/* marca de QR desenhada, não escaneável: é uma representação */}
            <div
              aria-hidden
              className="grid h-24 w-24 shrink-0 grid-cols-5 grid-rows-5 gap-[3px] p-2.5"
              style={{ background: "#fff", borderRadius: "2px" }}
            >
              {[1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1].map((v, i) => (
                <span key={i} style={{ background: v ? "#04081a" : "transparent" }} />
              ))}
            </div>

            <div>
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--somma)" }}>
                Possibilidade no kit do atleta
              </p>
              <p className={cx(s.h3, "mt-3")}>Treine com a Somma para sua próxima prova</p>
              <p className={cx(s.body, "mt-3 max-w-[52ch] !text-[0.875rem]")}>
                Um cartão com QR dentro do kit transforma os 2.000 corredores da Sunset Run em entrada para a
                comunidade — e dá ao SBT um pós-evento que hoje não existe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
