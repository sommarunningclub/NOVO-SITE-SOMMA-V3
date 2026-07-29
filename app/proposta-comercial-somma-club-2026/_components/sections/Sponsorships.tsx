"use client";

import { Check, ArrowRight, GitCompareArrows, Star, Lock } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi } from "../ui";
import { OpportunityCard } from "../OpportunityCard";
import { OPPORTUNITIES } from "../../_data/commercialPackages";
import { SPONSORSHIP_PLANS, SPONSORSHIP_NOTA } from "../../_data/sponsorshipPackages";
import { useCommercial } from "../CommercialContext";

function opp(id: string) {
  return OPPORTUNITIES.find((o) => o.id === id)!;
}

function PlanCard({ plan }: { plan: (typeof SPONSORSHIP_PLANS)[number] }) {
  const { openOpportunity, toggleCompare, isComparing, compareFull } = useCommercial();
  const selected = isComparing(plan.id);
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl border p-6 ${
        plan.destaque ? "border-[var(--somma-primary)]/50 bg-[var(--somma-highlight)]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {plan.destaque && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--somma-primary)] px-3 py-1 text-[11px] font-bold uppercase text-white">
          <Star className="h-3 w-3" /> Recomendado
        </span>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{plan.duracao}</p>
      <h3 className="mt-1 text-lg font-black text-white">{plan.nome}</h3>
      <p className="mt-4 text-2xl font-black leading-none text-[var(--somma-primary)]">{plan.mensal}</p>
      <p className="mt-1 text-sm text-white/55">{plan.total} no total</p>
      <p className="mt-4 text-sm leading-relaxed text-white/65">{plan.objetivo}</p>
      <ul className="mt-4 flex-1 space-y-1.5">
        {plan.entregas.map((e) => (
          <li key={e} className="flex items-start gap-2 text-[13px] text-white/70">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--somma-primary)]" />
            <span>{e}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => openOpportunity(plan.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20"
        >
          Detalhes <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => toggleCompare(plan.id)}
          disabled={!selected && compareFull}
          aria-label={`Comparar ${plan.nome}`}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
            selected ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white" : "border-white/20 text-white/70 disabled:opacity-40"
          }`}
        >
          {selected ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function Patrocinios() {
  return (
    <Section id="patrocinios" dark>
      <Container>
        <SectionTitle
          kicker="Patrocínios recorrentes"
          title={
            <>
              Presença que se constrói ao longo do <Hi>tempo</Hi>.
            </>
          }
          lead="Planos com duração definida para transformar presença pontual em recorrência, reconhecimento e relacionamento contínuo."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SPONSORSHIP_PLANS.map((p) => (
            <Reveal key={p.id}>
              <PlanCard plan={p} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="mt-6 text-xs leading-relaxed text-white/45">{SPONSORSHIP_NOTA}</p>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Assessoria() {
  return (
    <Section id="assessoria" className="bg-[var(--somma-surface)]">
      <Container>
        <SectionTitle
          kicker="Assessoria Somma Club"
          title={
            <>
              Conexão direta com quem leva a <Hi>performance</Hi> a sério.
            </>
          }
          lead="Comunicação e patrocínio dentro da assessoria esportiva, ideais para marcas de saúde, nutrição, performance, equipamentos, recuperação e qualidade de vida."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {["midia-assessoria", "patrocinio-assessoria"].map((id) => (
            <Reveal key={id}>
              <OpportunityCard opp={opp(id)} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function PatrociniosTopo() {
  const exclusivo = opp("patrocinio-exclusivo");
  return (
    <Section id="patrocinio-oficial" dark>
      <Container>
        <SectionTitle
          kicker="Patrocínio oficial e exclusivo"
          title={
            <>
              Faça parte, oficialmente, do <Hi>ecossistema Somma</Hi>.
            </>
          }
          lead="Da presença institucional contínua à exclusividade de uma categoria inteira dentro do Somma Club."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <OpportunityCard opp={opp("patrocinador-oficial")} />
          </Reveal>
          <Reveal delay={0.06}>
            <OpportunityCard opp={exclusivo} />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 rounded-3xl border border-[var(--somma-primary)]/30 bg-[var(--somma-highlight)] p-6 sm:p-7">
            <div className="flex items-center gap-2 text-[var(--somma-primary)]">
              <Lock className="h-5 w-5" />
              <h3 className="text-sm font-semibold uppercase tracking-wide">Como funciona a exclusividade</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Durante o período contratado, o Somma não fecha uma propriedade equivalente com um concorrente direto da
              categoria definida no contrato. Exemplos de categorias: academia, banco, laboratório, clínica, farmácia de
              manipulação, supermercado, marca esportiva, bebida, mobilidade ou recuperação. Sempre uma marca oficial
              por categoria.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Categoria bem definida", "Prazo determinado", "Limites de entrega", "Regras para eventos externos", "Condições comerciais específicas"].map(
                (t) => (
                  <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
