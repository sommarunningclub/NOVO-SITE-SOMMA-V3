"use client";

import { gsap, useScope, EASE } from "../_motion";
import { Chapter, Section, cx, s } from "../_ui";

const PILLARS = ["Estratégia", "Comunidade", "Experiência", "Tecnologia", "Conteúdo", "Operação"];

/** Escopo por frente. Fonte única: o que não estiver aqui não está no acordo. */
const ESCOPO: { frente: string; entrega: string; status: string }[] = [
  {
    frente: "Estratégia e plataforma",
    entrega: "Conceito Road to SBT Sunset Run, Training Series de 4 encontros e ativações da marca nos treinões",
    status: "Incluso",
  },
  {
    frente: "Tecnologia",
    entrega: "Sunset Pass versão base, Sunset 5 Challenge e check-in com registro de participação",
    status: "Incluso",
  },
  {
    frente: "Comunicação",
    entrega: "Base Somma, disparos de e-mail, grupos de WhatsApp, stories de sustentação e 1 Reel em Collab",
    status: "Incluso",
  },
  {
    frente: "Pessoas e conteúdo",
    entrega: "Conteúdo da jornada, treinadores, insiders, pacers e Somma Sunset Crew no Race Day",
    status: "Incluso",
  },
  {
    frente: "Fechamento",
    entrega: "Relatório final com dados de participação e engajamento",
    status: "Incluso",
  },
  {
    frente: "Produções especiais",
    entrega: "Cenografia, brindes, estruturas, materiais gráficos, audiovisual extraordinário e tecnologia adicional",
    status: "Sob orçamento",
  },
];

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
      q(".js-row"),
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.06,
        ease: EASE.soft,
        scrollTrigger: { trigger: q(".js-table")[0], start: "top 84%", once: true },
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
          <Chapter n="14" label="Entregáveis e investimento" />

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

            <ul className="js-pillars mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 md:gap-x-10">
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

          </div>

          {/* ------------------------------------------------ resumo em tabela */}
          <div className="js-table pb-8 text-left md:pb-16">
            <div className="mb-8 flex items-baseline gap-4 md:mb-10">
              <span className={cx(s.mono, "text-[0.6875rem] uppercase tracking-[0.28em]")} style={{ color: "var(--cyan)" }}>
                O que está incluído
              </span>
              <span className={cx(s.rule, "js-rule flex-1")} />
            </div>

            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption className="sr-only">
                  Escopo da Community Experience Partnership e investimento total
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[26%]">
                      Frente
                    </th>
                    <th scope="col">Entrega</th>
                    <th scope="col" className="w-[16%]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ESCOPO.map((r) => {
                    const fora = r.status !== "Incluso";
                    return (
                      <tr key={r.frente} className={cx("js-row", fora && s.tableOut)}>
                        <td data-label="Frente">
                          <span
                            className={cx(s.mono, "text-[0.8125rem] uppercase tracking-[0.1em]")}
                            style={{ color: fora ? "var(--dim)" : "#fff" }}
                          >
                            {r.frente}
                          </span>
                        </td>
                        <td data-label="Entrega">
                          <span className={cx(s.body, "!text-[0.875rem] !leading-[1.5]")}>{r.entrega}</span>
                        </td>
                        <td data-label="Status">
                          <span
                            className={cx(s.mono, "inline-flex items-center gap-2 whitespace-nowrap text-[0.625rem] uppercase tracking-[0.16em]")}
                            style={{ color: fora ? "var(--somma)" : "var(--cyan)" }}
                          >
                            {/* o sinal responde antes da palavra */}
                            <span aria-hidden className="text-[0.8rem] leading-none">
                              {fora ? "+" : "✓"}
                            </span>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className={s.tableTotal}>
                    <td data-label="Total">
                      <span className={cx(s.mono, "text-[0.8125rem] uppercase tracking-[0.1em] text-white")}>
                        Investimento total
                      </span>
                    </td>
                    <td>
                      <span className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.16em]")} style={{ color: "var(--dim-2)" }}>
                        Community Experience Partnership
                      </span>
                    </td>
                    <td data-label="Valor">
                      <span className={cx(s.num, "!text-[clamp(1.6rem,3vw,2.4rem)]")} style={{ color: "var(--somma)" }}>
                        R$ 15.000
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
