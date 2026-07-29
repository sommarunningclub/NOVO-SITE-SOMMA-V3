"use client";

import { CalendarClock } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi } from "../ui";
import { OpportunityCard } from "../OpportunityCard";
import { OPPORTUNITIES } from "../../_data/commercialPackages";

function opp(id: string) {
  return OPPORTUNITIES.find((o) => o.id === id)!;
}

/** Mockup da Agenda Somma Club. */
function AgendaMock() {
  const rows = [
    { d: "SÁB 11", t: "Encontro de sábado", brand: false },
    { d: "SÁB 18", t: "Somma Day", brand: false },
    { d: "SÁB 25", t: "Ação · SUA MARCA", brand: true },
  ];
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[var(--somma-surface-2)] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-white/50">
        <CalendarClock className="h-3.5 w-3.5 text-[var(--somma-primary)]" /> Julho 2026 · Agenda Somma
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div
            key={r.d}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              r.brand ? "bg-[var(--somma-highlight)] ring-1 ring-[var(--somma-primary)]/40" : "bg-white/[0.04]"
            }`}
          >
            <span className={`h-8 w-1 rounded-full ${r.brand ? "bg-[var(--somma-primary)]" : "bg-white/25"}`} />
            <div className="leading-tight">
              <div className="text-[10px] font-semibold text-white/45">{r.d}</div>
              <div className={`text-sm font-bold ${r.brand ? "text-[var(--somma-primary)]" : "text-white/85"}`}>{r.t}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MidiaInstagram() {
  return (
    <Section id="midia-instagram" dark>
      <Container>
        <SectionTitle
          kicker="Mídia digital"
          title={
            <>
              Frequência, posicionamento e <Hi>descoberta</Hi>.
            </>
          }
          lead="Do Instagram à base própria: canais para lançar, convidar, distribuir e gerar tráfego com a audiência do Somma."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {["instagram-stories", "instagram-completo", "disparo-email"].map((id) => (
            <Reveal key={id}>
              <OpportunityCard opp={opp(id)} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function MidiaAgendaSite() {
  return (
    <Section id="midia-agenda-site" className="bg-[var(--somma-surface)]">
      <Container>
        <SectionTitle
          kicker="Mídia própria"
          title={
            <>
              Presença que mora na <Hi>rotina</Hi> da comunidade.
            </>
          }
          lead="A Agenda Somma Club, o site e a área de check-in são pontos de contato próprios. É a mídia que o Somma controla e ativa quando faz sentido para a marca."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-bold text-white">Como a Agenda aparece</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                A empresa entra como parceira de uma atividade, benefício ou experiência e passa a ocupar um espaço
                dentro do calendário dos membros, não apenas uma publicação isolada.
              </p>
              <div className="mt-5">
                <AgendaMock />
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-1">
            {["agenda-somma", "popup-site", "popup-checkin"].map((id) => (
              <Reveal key={id}>
                <OpportunityCard opp={opp(id)} />
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
