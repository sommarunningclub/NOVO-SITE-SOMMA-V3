"use client";

import Image from "next/image";
import { MessageCircle, Mail, ArrowRight, Instagram } from "lucide-react";
import { Container, Section, SectionTitle, Reveal, Hi, PrimaryButton, GhostButton } from "../ui";
import ProposalForm from "../ProposalForm";
import { CONFIG, whatsappLink, emailLink } from "../../_data/config";

export function Formulario() {
  return (
    <Section id="contato" dark>
      <Container>
        <SectionTitle
          center
          kicker="Formulário comercial"
          title={
            <>
              Vamos desenhar a <Hi>sua proposta</Hi>.
            </>
          }
          lead="Conte um pouco sobre a marca e o que você busca. Nosso time comercial retorna com uma proposta personalizada."
        />
        <Reveal delay={0.05}>
          <div className="mt-10">
            <ProposalForm />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Encerramento() {
  return (
    <section id="encerramento" data-section="encerramento" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0">
        <Image src="/midiakit/eixao3.jpg" alt="Comunidade do Somma Club" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-[var(--somma-background)]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--somma-background)] via-transparent to-[var(--somma-background)]" />
      </div>
      <Container className="relative z-10 text-center">
        <Reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CONFIG.logo} alt="Somma Club" className="mx-auto h-9 w-auto opacity-90" />
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
            Sua marca pode fazer parte da <Hi>experiência</Hi>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Marcas não entram no Somma apenas para vender. Entram para construir relevância, relacionamento e presença
            dentro do universo wellness. Vamos construir uma parceria capaz de gerar presença, experiência e conexão real
            com a comunidade.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton href="#contato">
              Solicitar proposta <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
            <GhostButton href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Falar com o time comercial
            </GhostButton>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function Regras() {
  return (
    <Section id="regras" className="bg-[var(--somma-surface)] py-14">
      <Container>
        <details className="group mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white/70">
            Regras comerciais
            <span className="text-xs text-white/40 transition-transform group-open:rotate-45">+</span>
          </summary>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/55">
            {CONFIG.regras.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--somma-primary)]" />
                <span>{r}</span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--somma-primary)]" />
              <span>As informações e métricas podem ser atualizadas facilmente nos arquivos de dados.</span>
            </li>
          </ul>
        </details>
      </Container>
    </Section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--somma-background)] py-10">
      <Container className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CONFIG.logo} alt="Somma Club" className="h-6 w-auto opacity-80" />
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/50">
          <a href={`https://${CONFIG.site}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            {CONFIG.site}
          </a>
          <span className="inline-flex items-center gap-1.5">
            <Instagram className="h-4 w-4" /> {CONFIG.instagram}
          </span>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a href={emailLink()} className="inline-flex items-center gap-1.5 hover:text-white">
            <Mail className="h-4 w-4" /> {CONFIG.email}
          </a>
        </div>
      </Container>
      <p className="mt-6 text-center text-xs text-white/30">
        Consumo responsável. Apresentação comercial · {new Date().getFullYear()}.
      </p>
    </footer>
  );
}
