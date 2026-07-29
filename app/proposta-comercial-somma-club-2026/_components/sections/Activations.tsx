"use client";

import Image from "next/image";
import { Trophy } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi } from "../ui";
import { OpportunityCard } from "../OpportunityCard";
import { OPPORTUNITIES } from "../../_data/commercialPackages";

const ACT_IDS = ["ativacao-sabado", "ativacao-tres-sabados", "mes-somma-day"];

export function Ativacoes() {
  const cards = ACT_IDS.map((id) => OPPORTUNITIES.find((o) => o.id === id)!).filter(Boolean);
  return (
    <Section id="ativacoes" dark>
      <Container>
        <SectionTitle
          kicker="Ativações presenciais"
          title={
            <>
              Sua marca vivida <Hi>ao vivo</Hi>, todo sábado.
            </>
          }
          lead="Presença física da marca nos encontros do Somma Club. Do primeiro contato à narrativa de um mês inteiro, com o Somma Day como ponto alto."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((o) => (
            <Reveal key={o.id}>
              <OpportunityCard opp={o} />
            </Reveal>
          ))}
        </div>

        {/* Explicação do Somma Day */}
        <Reveal delay={0.1}>
          <div className="mt-8 grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] md:grid-cols-2 md:items-stretch">
            <div className="relative h-60 overflow-hidden sm:h-72 md:h-auto">
              <Image data-parallax="5" src="/midiakit/specialday.jpg" alt="Somma Day, o ponto alto mensal da comunidade" fill sizes="(max-width: 768px) 100vw, 560px" className="object-cover object-center" />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-9">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--somma-primary)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                <Trophy className="h-3.5 w-3.5" /> Somma Day
              </p>
              <p className="mt-4 text-base leading-relaxed text-white/75">
                O Somma Day é o principal encontro mensal da comunidade. Tem programação ampliada, maior concentração de
                participantes, experiências, parceiros, entretenimento, conteúdo e ativações especiais. É o momento ideal
                para encerrar o ciclo de uma marca com o maior impacto.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
