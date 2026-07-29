"use client";

import { Container, Section, SectionTitle, Reveal, Hi } from "../ui";
import { ECOSSISTEMA } from "../../_data/sommaMetrics";

const GRUPOS = ["Digital", "Relacionamento", "Dados", "Presencial", "Tecnologia", "Conteúdo"];

export function Ecossistema() {
  return (
    <Section id="ecossistema" dark>
      <Container>
        <SectionTitle
          kicker="Ecossistema Somma Club"
          title={
            <>
              Sua marca entra em <Hi>diferentes momentos</Hi> da jornada.
            </>
          }
          lead="Do primeiro contato digital à experiência presencial recorrente — o Somma conecta vários pontos, e a marca escolhe onde e como estar."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRUPOS.map((g, i) => {
            const itens = ECOSSISTEMA.filter((e) => e.grupo === g);
            if (!itens.length) return null;
            return (
              <Reveal key={g} delay={i * 0.05}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--somma-primary)]" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{g}</h3>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {itens.map((e) => (
                      <li
                        key={e.nome}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/80"
                      >
                        {e.nome}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
