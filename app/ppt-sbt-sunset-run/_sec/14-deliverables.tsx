"use client";

import { Headline, Chapter, Section, cx, s } from "../_ui";

const BLOCKS: { g: string; items: string[] }[] = [
  {
    g: "Estratégia e plataforma",
    items: [
      "Road to SBT Sunset Run: conceito e narrativa da jornada",
      "SBT Sunset Run Training Series: 4 encontros",
      "Ativações da marca nos treinões selecionados",
    ],
  },
  {
    g: "Tecnologia",
    items: [
      "Sunset Pass: versão base",
      "Sunset 5 Challenge: missões e progressão",
      "Check-in e registro de participação",
    ],
  },
  {
    g: "Comunicação",
    items: [
      "Comunicação na base Somma",
      "Disparos de e-mail",
      "Comunicação nos grupos de WhatsApp",
      "Stories de sustentação ao longo das 4 semanas",
      "1 Reel principal em Collab",
    ],
  },
  {
    g: "Pessoas e conteúdo",
    items: [
      "Conteúdo da jornada",
      "Treinadores, insiders e pacers",
      "Somma Sunset Crew no Race Day",
    ],
  },
  {
    g: "Fechamento",
    items: ["Relatório final da parceria", "Dados de participação e engajamento"],
  },
];

const OUT = [
  "Produções físicas especiais e cenografia",
  "Brindes, estruturas e materiais gráficos",
  "Produção audiovisual extraordinária",
  "Desenvolvimentos adicionais de tecnologia",
];

export function Deliverables() {
  return (
    <Section id="deliverables" stage={5} className="pt-24 md:pt-32">
      <div className={cx(s.shell, "relative z-10")}>
        <Chapter n="14" label="Entregáveis" />

        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <Headline level="h2">{"Community\nExperience\nPartnership."}</Headline>
          </div>
          <div className="flex items-end md:col-span-4 md:col-start-9" data-rise>
            <p className={s.body}>
              O escopo abaixo é o que a Somma entrega dentro do investimento proposto, da estratégia à operação no dia
              da prova.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------ escopo */}
        <div className="mt-16 flex flex-col md:mt-24">
          {BLOCKS.map((b, gi) => (
            <div
              key={b.g}
              className="grid gap-4 border-t py-8 md:grid-cols-12 md:gap-8 md:py-10"
              style={{ borderColor: "var(--hair)" }}
              data-rise
            >
              <div className="flex items-start gap-4 md:col-span-4">
                <span className={cx(s.mono, "text-[0.625rem] tracking-[0.22em]")} style={{ color: "var(--somma)" }}>
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <p className={cx(s.h3, "!text-[clamp(1.15rem,1.9vw,1.6rem)]")}>{b.g}</p>
              </div>

              <ul className="flex flex-col gap-2.5 md:col-span-7 md:col-start-6">
                {b.items.map((it) => (
                  <li key={it} className="flex gap-3.5">
                    <span className="mt-[0.62em] h-px w-4 shrink-0" style={{ background: "var(--cyan)" }} />
                    <span className="text-[0.9375rem] leading-[1.5] text-white/90">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------ fora do escopo */}
        <div
          className="mt-14 p-7 md:mt-20 md:p-10"
          style={{ border: "1px solid rgba(255,44,4,.26)", background: "rgba(255,44,4,.045)" }}
          data-rise
        >
          <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--somma)" }}>
            Não incluído
          </p>
          <p className={cx(s.h3, "mt-4 !text-[clamp(1.15rem,1.8vw,1.5rem)]")}>
            Itens que podem ser contratados separadamente
          </p>
          <ul className="mt-6 grid gap-2.5 md:grid-cols-2 md:gap-x-10">
            {OUT.map((o) => (
              <li key={o} className={cx(s.body, "flex gap-3.5 !text-[0.875rem]")}>
                <span className="mt-[0.62em] h-px w-4 shrink-0" style={{ background: "rgba(255,44,4,.6)" }} />
                {o}
              </li>
            ))}
          </ul>
          <p className={cx(s.mono, "mt-7 text-[0.625rem] uppercase leading-[1.7] tracking-[0.14em]")} style={{ color: "var(--dim-2)" }}>
            Custos extraordinários de produção são orçados à parte, mediante escopo definido em conjunto.
          </p>
        </div>
      </div>
    </Section>
  );
}
