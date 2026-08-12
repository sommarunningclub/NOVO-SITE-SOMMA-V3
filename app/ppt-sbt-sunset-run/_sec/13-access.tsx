"use client";

import Image from "next/image";
import { Headline, Chapter, Section, cx, s } from "../_ui";

/**
 * O que o SBT acessa.
 *
 * Composição editorial em vez de grade de quadradinhos: os ativos têm pesos
 * diferentes e a página mostra isso — a comunidade proprietária e os treinões
 * ocupam mais espaço do que uma linha de e-mail.
 */
export function Access() {
  return (
    <Section id="access" stage={5} className="pt-24 md:pt-32">
      <div className={cx(s.shell, "relative z-10")}>
        <Chapter n="13" label="O que o SBT acessa" />

        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <Headline level="h2">{"Access to a\nrunning community"}</Headline>
          </div>
          <div className="flex items-end md:col-span-3 md:col-start-10" data-rise>
            <p className={s.body}>
              Não é uma audiência alugada. É uma base que já treina junto todo sábado e responde quando a Somma chama.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------ composição */}
        <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-12 md:gap-5">
          {/* peça grande: a comunidade */}
          <article className={cx(s.card, "relative overflow-hidden md:col-span-7")} data-rise>
            <div className="relative aspect-[16/10] w-full md:aspect-[16/9]">
              <Image
                src="/sbt/kit/arena-aerial.jpg"
                alt="Vista aérea da arena da SBT Sunset Run na Esplanada dos Ministérios"
                fill
                sizes="(max-width: 900px) 100vw, 58vw"
                className="object-cover"
              />
              <span
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg,rgba(4,8,26,.25) 0%,rgba(4,8,26,.92) 82%)" }}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--somma)" }}>
                Ativo principal
              </p>
              <p className={cx(s.h2, "mt-3")} style={{ fontSize: "clamp(1.6rem,3vw,2.6rem)" }}>
                Comunidade
                <br />
                proprietária
              </p>
              <p className={cx(s.body, "mt-3 max-w-[42ch] !text-[0.875rem]")}>
                Base própria, relacionamento direto e presença física semanal em Brasília.
              </p>
            </div>
          </article>

          {/* coluna: presença e canais */}
          <div className="flex flex-col gap-4 md:col-span-5 md:gap-5">
            <article className={cx(s.card, "flex-1 p-7 md:p-8")} data-rise>
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--cyan)" }}>
                Presencial
              </p>
              <p className={cx(s.h3, "mt-3")}>Treinões semanais</p>
              <p className={cx(s.body, "mt-3 !text-[0.875rem]")}>
                Encontros de sábado com treinadores, pacers e operação própria — o palco onde a ativação acontece.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Treinadores", "Insiders", "Pacers", "Eventos"].map((t) => (
                  <span
                    key={t}
                    className={cx(s.mono, "rounded-full px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.16em]")}
                    style={{ border: "1px solid var(--hair)", color: "var(--dim)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>

            <article className={cx(s.card, "flex-1 p-7 md:p-8")} data-rise>
              <p className={cx(s.mono, "text-[0.625rem] uppercase tracking-[0.28em]")} style={{ color: "var(--cyan)" }}>
                Canais diretos
              </p>
              <p className={cx(s.h3, "mt-3")}>Fala com quem corre</p>
              <ul className="mt-4 flex flex-col gap-2">
                {[
                  ["WhatsApp", "Grupos ativos da comunidade"],
                  ["E-mail", "Disparos para a base cadastrada"],
                  ["Check-in", "Registro de presença nos treinos"],
                  ["CRM", "Histórico e segmentação"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-baseline gap-3 border-b pb-2" style={{ borderColor: "var(--hair)" }}>
                    <span className={cx(s.mono, "w-24 shrink-0 text-[0.6875rem] uppercase tracking-[0.14em] text-white")}>
                      {k}
                    </span>
                    <span className={cx(s.body, "!text-[0.8125rem]")}>{v}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* faixa: tecnologia e conteúdo */}
          <article className={cx(s.card, "p-7 md:col-span-4 md:p-8")} data-rise>
            <p className={cx(s.num, "!text-[2.4rem]")} style={{ color: "var(--somma)" }}>
              01
            </p>
            <p className={cx(s.h3, "mt-4")}>Tecnologia própria</p>
            <p className={cx(s.body, "mt-3 !text-[0.875rem]")}>
              Sistema de check-in, perfis, missões e progressão — a base do Sunset Pass já existe e roda.
            </p>
          </article>

          <article className={cx(s.card, "p-7 md:col-span-4 md:p-8")} data-rise>
            <p className={cx(s.num, "!text-[2.4rem]")} style={{ color: "var(--somma)" }}>
              02
            </p>
            <p className={cx(s.h3, "mt-4")}>Conteúdo nativo</p>
            <p className={cx(s.body, "mt-3 !text-[0.875rem]")}>
              Produção que nasce dentro do treino, com pessoas reais da comunidade — e não em estúdio.
            </p>
          </article>

          <article className={cx(s.card, "p-7 md:col-span-4 md:p-8")} data-rise>
            <p className={cx(s.num, "!text-[2.4rem]")} style={{ color: "var(--somma)" }}>
              03
            </p>
            <p className={cx(s.h3, "mt-4")}>Experiência presencial</p>
            <p className={cx(s.body, "mt-3 !text-[0.875rem]")}>
              Operação de evento própria: ponto de encontro, aquecimento, pacers e cobertura no Race Day.
            </p>
          </article>
        </div>
      </div>
    </Section>
  );
}
