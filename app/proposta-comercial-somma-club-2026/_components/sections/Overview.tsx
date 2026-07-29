"use client";

import Image from "next/image";
import { ArrowRight, ArrowDown, Sparkles, HandHeart, Users } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi, PrimaryButton, GhostButton } from "../ui";
import { PILARES, POSICIONAMENTO_OBS } from "../../_data/presentationSections";

export function Hero() {
  return (
    <section id="capa" data-section="capa" className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/midiakit/capa.jpg" alt="Comunidade do Somma Club correndo em Brasília" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--somma-background)] via-[var(--somma-background)]/85 to-[var(--somma-background)]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--somma-background)] via-transparent to-[var(--somma-background)]/50" />
      </div>

      <Container className="relative z-10 pt-24">
        <div className="max-w-3xl">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--somma-highlight)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--somma-primary)]">
              <Sparkles className="h-3.5 w-3.5" /> Apresentação comercial · 2026
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl md:text-8xl">
              Somma <Hi>Club</Hi>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-xl text-lg font-light leading-snug text-white/85 sm:text-2xl">
              Comunidade, experiência e conexão com o universo wellness.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-3 text-sm uppercase tracking-[0.15em] text-white/45">
              Oportunidades de parceria
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mt-8 max-w-lg border-l-2 border-[var(--somma-primary)] pl-4 text-base font-medium leading-snug text-white/90 sm:text-lg">
              Marcas relevantes não apenas aparecem. Elas fazem parte da experiência.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="#investimentos">
                Ver oportunidades <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
              <GhostButton href="#contato">Solicitar proposta</GhostButton>
            </div>
          </Reveal>
        </div>
      </Container>

      <a
        href="#numeros"
        aria-label="Avançar para a comunidade"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/50 transition-colors hover:text-white"
      >
        <ArrowDown className="h-7 w-7 animate-bounce" />
      </a>
    </section>
  );
}

export function QuemSomos() {
  return (
    <Section id="quem-somos" dark>
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              kicker="Quem é o Somma Club"
              title={
                <>
                  Mais do que um grupo de corrida, uma <Hi>comunidade</Hi> de lifestyle.
                </>
              }
            />
            <Reveal delay={0.1}>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-white/70">
                <p>
                  O Somma Club é uma comunidade esportiva e de lifestyle que conecta pessoas por meio da corrida, da
                  saúde, do bem-estar e de experiências sociais.
                </p>
                <p>
                  Mais do que um grupo de corrida, o Somma desenvolve encontros semanais, eventos, desafios, conteúdos,
                  produtos, campanhas e ativações em parceria com marcas.
                </p>
                <p>
                  Nossa estrutura combina{" "}
                  <strong className="text-white">comunidade, presença física, mídia, tecnologia e relacionamento</strong>{" "}
                  direto com uma base própria de participantes.
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10">
              <Image src="/midiakit/comunidade.jpg" alt="Comunidade do Somma Club reunida" fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--somma-background)]/50 to-transparent" />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

const PILAR_ICONS = [Sparkles, HandHeart, Users];

export function Posicionamento() {
  return (
    <Section id="posicionamento" className="bg-[var(--somma-surface)]">
      <Container>
        <SectionTitle
          kicker="Posicionamento comercial"
          title={
            <>
              Não somos uma empresa de <Hi>vendas</Hi>
            </>
          }
          lead="O Somma Club é uma plataforma de comunidade, experiências e mídia para marcas que desejam se conectar com o universo wellness."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-4 text-base leading-relaxed text-white/70">
              <p>Nosso papel é gerar presença, alcance, relacionamento, experimentação e construção de marca.</p>
              <p className="font-semibold text-white">
                Não garantimos vendas, faturamento, leads ou conversões comerciais.
              </p>
              <p>
                Criamos o ambiente, a audiência e os pontos de contato para que uma marca seja conhecida, experimentada e
                lembrada.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {PILARES.map((p, i) => {
                const Icon = PILAR_ICONS[i];
                return (
                  <div key={p.titulo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--somma-highlight)] text-[var(--somma-primary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-white">{p.titulo}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{p.texto}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-white/55">
            {POSICIONAMENTO_OBS}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
