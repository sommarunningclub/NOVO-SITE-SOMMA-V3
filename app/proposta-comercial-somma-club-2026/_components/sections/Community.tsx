"use client";

import Image from "next/image";
import { Database, ShieldCheck, CalendarDays } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi, Card, Pill } from "../ui";
import { MetricCard } from "../MetricCard";
import {
  BIG_NUMBERS,
  BIG_NUMBERS_NOTA,
  BASE_DADOS,
  BASE_POSSIBILIDADES,
  BASE_AVISO,
  PRESENCA_FISICA,
} from "../../_data/sommaMetrics";

export function Numeros() {
  return (
    <Section id="numeros" dark>
      <Container>
        <SectionTitle
          kicker="O Somma em números"
          title={
            <>
              Comunidade que <Hi>acontece</Hi> — no digital e na rua.
            </>
          }
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BIG_NUMBERS.map((m, i) => (
            <MetricCard key={m.label} metric={m} delay={i * 0.04} />
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="mt-6 text-xs leading-relaxed text-white/40">{BIG_NUMBERS_NOTA}</p>
        </Reveal>
      </Container>
    </Section>
  );
}

export function BasePropria() {
  return (
    <Section id="base-propria" className="bg-[var(--somma-surface)]">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              kicker="Base própria"
              title={
                <>
                  Mais do que seguidores, uma <Hi>comunidade identificada</Hi>.
                </>
              }
              lead="O Somma Club possui uma base própria com mais de 6 mil pessoas cadastradas."
            />
            <Reveal delay={0.1}>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Informações disponíveis</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BASE_DADOS.map((d) => (
                    <Pill key={d}>{d}</Pill>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <Card>
              <div className="flex items-center gap-2 text-[var(--somma-primary)]">
                <Database className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">A base possibilita</span>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {BASE_POSSIBILIDADES.map((p) => (
                  <li key={p} className="text-sm text-white/75">
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--somma-primary)]" />
                <p className="text-sm leading-relaxed text-white/60">{BASE_AVISO}</p>
              </div>
            </Card>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function PresencaFisica() {
  const cards = [
    { label: "Todo sábado", valor: PRESENCA_FISICA.sabado },
    { label: "Por mês", valor: PRESENCA_FISICA.mes },
    { label: "Por ano", valor: PRESENCA_FISICA.ano },
  ];
  return (
    <Section id="presenca-fisica" className="relative overflow-hidden" dark>
      <div className="absolute inset-0">
        <Image data-parallax="8" src="/midiakit/crowd.jpg" alt="Centenas de corredores no encontro de sábado" fill sizes="100vw" className="object-cover object-center opacity-30" />
        <div className="absolute inset-0 bg-[var(--somma-background)]/80" />
      </div>
      <Container className="relative z-10">
        <SectionTitle
          kicker="Presença física"
          title={
            <>
              Uma comunidade que se <Hi>encontra</Hi> todas as semanas.
            </>
          }
          lead="Todos os sábados, o Somma Club realiza encontros presenciais de corrida com público entre 200 e 350 pessoas."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.06}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center gap-2 text-[var(--somma-primary)]">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">{c.label}</span>
                </div>
                <p className="mt-3 text-xl font-black leading-tight text-white sm:text-2xl">{c.valor}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-3xl border-l-2 border-[var(--somma-primary)] pl-5 text-lg font-semibold leading-snug text-white sm:text-2xl">
            {PRESENCA_FISICA.destaque}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
