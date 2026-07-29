"use client";

import { Check, ShieldAlert } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi } from "../ui";
import OpportunityExplorer from "../OpportunityExplorer";
import Simulator from "../Simulator";
import { SOMMA_ENTREGA, PROCESSO } from "../../_data/sommaMetrics";

export function TabelaGeral() {
  return (
    <Section id="investimentos" dark>
      <Container>
        <SectionTitle
          kicker="Tabela geral de investimentos"
          title={
            <>
              Todas as oportunidades, <Hi>filtráveis</Hi> e comparáveis.
            </>
          }
          lead="Filtre por tipo, abra os detalhes de cada cota e selecione até três para comparar lado a lado. Todos os valores são “a partir de”."
        />
        <Reveal delay={0.05}>
          <div className="mt-8">
            <OpportunityExplorer />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function SimuladorSection() {
  return (
    <Section id="simulador" className="bg-[var(--somma-surface)]">
      <Container>
        <SectionTitle
          kicker="Simulador comercial"
          title={
            <>
              Monte uma <Hi>estimativa inicial</Hi>.
            </>
          }
          lead="Escolha uma ativação, o número de meses e os adicionais para ver uma estimativa baseada nos valores mínimos. É um ponto de partida, não uma proposta definitiva."
        />
        <Reveal delay={0.05}>
          <div className="mt-8">
            <Simulator />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Entregas() {
  return (
    <Section id="entregas" dark>
      <Container>
        <SectionTitle
          kicker="O que o Somma entrega"
          title={
            <>
              Uma plataforma completa de <Hi>presença e relacionamento</Hi>.
            </>
          }
        />
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOMMA_ENTREGA.map((e, i) => (
            <Reveal key={e} delay={i * 0.03}>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <Check className="h-5 w-5 shrink-0 text-[var(--somma-primary)]" />
                <span className="text-sm font-medium text-white/85">{e}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function Transparencia() {
  return (
    <Section id="transparencia" className="bg-[var(--somma-surface)]">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="flex items-center gap-2 text-[var(--somma-primary)]">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Transparência comercial</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Alinhamento de expectativas</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-white/70">
              <p className="font-semibold text-white">
                O Somma Club não garante vendas, faturamento, leads ou conversões.
              </p>
              <p>
                Nossa entrega está relacionada ao escopo contratado, incluindo presença, mídia, conteúdo, experiência,
                acesso à comunidade, branding e relacionamento.
              </p>
              <p>
                Resultados comerciais dependem de fatores controlados pela empresa parceira, como produto, oferta, preço,
                atendimento, posicionamento e jornada de compra.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function Processo() {
  return (
    <Section id="processo" dark>
      <Container>
        <SectionTitle
          kicker="Como construímos uma parceria"
          title={
            <>
              Do diagnóstico à <Hi>evolução</Hi>.
            </>
          }
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESSO.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.04}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <span className="text-3xl font-black text-[var(--somma-primary)]/40">{p.n}</span>
                <h3 className="mt-2 text-lg font-bold text-white">{p.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{p.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
