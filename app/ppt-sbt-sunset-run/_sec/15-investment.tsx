"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Chapter, Section, cx, s } from "../_ui";

const PILLARS = ["Estratégia", "Comunidade", "Experiência", "Tecnologia", "Conteúdo", "Operação"];

export function Investment() {
  const ref = useScope<HTMLDivElement>(({ root }) => {
    const q = gsap.utils.selector(root);

    const el = q<HTMLElement>(".js-value")[0];
    if (el) {
      const o = { v: 0 };
      gsap.to(o, {
        v: 15000,
        duration: 1.9,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(o.v).toLocaleString("pt-BR");
        },
        scrollTrigger: { trigger: el, start: "top 80%", once: true },
      });
    }

    gsap.fromTo(
      q(".js-pillar"),
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: EASE.soft,
        scrollTrigger: { trigger: q(".js-pillars")[0], start: "top 86%", once: true },
      },
    );

    gsap.fromTo(
      q(".js-inv-glow"),
      { opacity: 0, scale: 0.7 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: { trigger: root, start: "top 62%", once: true },
      },
    );
  });

  return (
    <Section id="investment" stage={5} className="pt-24 md:pt-32">
      <div ref={ref} className="relative overflow-hidden">
        {/* brasa do pôr do sol atrás do número */}
        <div
          aria-hidden
          className="js-inv-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[110vw] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(255,44,4,.2) 0%, rgba(122,59,224,.13) 42%, rgba(4,8,26,0) 72%)",
          }}
        />

        <div className={cx(s.shell, "relative z-10")}>
          <Chapter n="15" label="Investimento" />

          <div className="flex flex-col items-center py-10 text-center md:py-20">
            <p className={cx(s.eyebrow, "mb-8")} style={{ color: "var(--cyan)" }}>
              Community Experience Partnership
            </p>

            <div className="flex items-start gap-3 md:gap-5">
              <span
                className={cx(s.num, "mt-[0.5em] !text-[clamp(1.15rem,2.4vw,2.2rem)]")}
                style={{ color: "var(--dim)" }}
              >
                R$
              </span>
              <span className={cx(s.num, "js-value")} style={{ fontSize: "clamp(4.5rem,15vw,15rem)" }}>
                0
              </span>
            </div>

            <div
              className="mt-10 h-px w-full max-w-3xl"
              style={{ background: "linear-gradient(90deg,rgba(255,255,255,0),var(--somma) 50%,rgba(255,255,255,0))" }}
            />

            <p className={cx(s.lead, "mt-10 max-w-[46ch] !text-white")}>
              Estratégia, comunidade, experiência, tecnologia, conteúdo e operação Somma.
            </p>

            <ul className="js-pillars mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 md:gap-x-10">
              {PILLARS.map((p) => (
                <li
                  key={p}
                  className={cx(s.mono, "js-pillar text-[0.6875rem] uppercase tracking-[0.24em]")}
                  style={{ color: "var(--dim)" }}
                >
                  {p}
                </li>
              ))}
            </ul>

            <p
              className={cx(s.mono, "mt-16 max-w-[52ch] text-[0.625rem] uppercase leading-[1.8] tracking-[0.14em]")}
              style={{ color: "rgba(255,255,255,.3)" }}
            >
              Produções especiais e custos extraordinários são orçados separadamente.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
