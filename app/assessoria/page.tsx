import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Dumbbell,
  UserCheck,
  GraduationCap,
  Gauge,
  HeartHandshake,
  CalendarDays,
  ShieldCheck,
  Flame,
  Quote,
} from "lucide-react";
import {
  SOMMA,
  ADVISORY_PLANS,
  ADVISORY_BENEFITS,
  ADVISORY_JOURNEY,
  ADVISORY_TESTIMONIALS,
  ADVISORY_FAQ,
} from "@/lib/somma-data";
import { Reveal } from "@/components/reveal";
import { QualitySeal } from "@/components/ui/award-badge";
import { SommaPricing } from "@/components/ui/somma-pricing";
import { Footer } from "@/components/footer";
import Hyperspeed from "@/components/ui/hyperspeed";

const BENEFIT_ICONS: Record<string, typeof Dumbbell> = {
  treino: Dumbbell,
  acompanhamento: UserCheck,
  professores: GraduationCap,
  niveis: Gauge,
  comunidade: HeartHandshake,
  domingo: CalendarDays,
  seguranca: ShieldCheck,
  energia: Flame,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HYPERSPEED_FX: any = {
  distortion: "turbulentDistortion",
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xff2c03,
    brokenLines: 0xfb4c00,
    leftCars: [0xff2c03, 0xfb4c00, 0xc41f00],
    rightCars: [0xff6a3a, 0xff2c03, 0x7a2a12],
    sticks: 0xff2c03,
  },
};

export const metadata: Metadata = {
  title: "Assessoria Somma — Corra com acompanhamento de verdade",
  description:
    "Treino personalizado, professores especialistas, comunidade acolhedora e treinos aos domingos. A Assessoria Somma acompanha você de perto, do primeiro passo à performance.",
  alternates: { canonical: "/assessoria" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Assessoria Somma — Corra com acompanhamento de verdade",
    description:
      "Treino, acolhimento, orientação e uma comunidade que corre junto com você. Planos a partir de R$ 180/mês.",
    siteName: "SOMMA Club",
  },
};

export default function AssessoriaPage() {
  return (
    <>
      {/* Header simples */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="container-somma flex h-16 items-center justify-between md:h-20">
          <Link href="/" aria-label="SOMMA Club">
            <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-7 w-auto md:h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden items-center gap-2 text-sm font-medium text-white/80 hover:text-white sm:flex">
              <ArrowLeft className="h-4 w-4" /> Voltar ao site
            </Link>
            <a
              href="#planos"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Começar agora
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden bg-black text-white">
          <Hyperspeed effectOptions={HYPERSPEED_FX} />
          <div className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-black/70 via-black/40 to-black/85" />
          <div className="container-somma relative z-10 py-28">
            <Reveal className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Assessoria Somma
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Corra com acompanhamento de verdade.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/80">
                Não importa se você está começando agora ou se já corre há anos. Aqui você encontra
                treino, acolhimento, orientação e uma comunidade que corre junto com você.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#planos"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  Começar agora <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={SOMMA.links.whatsappAssessoria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Falar no WhatsApp
                </a>
              </div>

              {/* Selo de qualidade */}
              <div className="mt-10">
                <QualitySeal
                  eyebrow="MAIOR RUNNING CLUB"
                  title="do Distrito Federal"
                  link={SOMMA.links.instagram}
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* POR QUE ESCOLHER */}
        <section className="bg-white py-20 md:py-28">
          <div className="container-somma grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
                <Image
                  src="/somma/IMG_1479_JPG.jpg"
                  alt="Treino da Assessoria Somma"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Por que escolher a Assessoria Somma?
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Para quem está começando, evoluindo ou buscando performance
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-muted md:text-lg">
                <p>
                  A Assessoria Somma é a extensão do Somma Club para quem quer viver a corrida com mais
                  acompanhamento, segurança e evolução. Aqui, você não recebe apenas uma planilha — você
                  entra em uma jornada com professores especialistas, uma comunidade acolhedora e treinos
                  pensados para o seu momento.
                </p>
                <p>
                  Seja para dar os primeiros passos, voltar a correr com constância, melhorar seu pace ou
                  se preparar para uma prova, a Assessoria Somma te acompanha de perto.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* BENEFÍCIOS (8 cards) */}
        <section className="bg-light py-20 md:py-28">
          <div className="container-somma">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">O que você recebe</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Muito além de uma planilha
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ADVISORY_BENEFITS.map((b, i) => {
                const Icon = BENEFIT_ICONS[b.icon] ?? Flame;
                return (
                  <Reveal key={b.titulo} delay={(i % 4) * 0.08}>
                    <div className="h-full rounded-3xl border border-black/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-5 text-lg font-semibold text-ink">{b.titulo}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{b.descricao}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* JORNADA (6 passos) */}
        <section className="bg-white py-20 md:py-28">
          <div className="container-somma">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Como funciona</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Sua jornada na Assessoria Somma
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ADVISORY_JOURNEY.map((step, i) => (
                <Reveal key={step.titulo} delay={(i % 3) * 0.08}>
                  <div className="h-full rounded-3xl border border-black/5 bg-light p-7">
                    <span className="text-3xl font-bold text-primary tabular-nums">0{i + 1}</span>
                    <h3 className="mt-4 text-lg font-semibold text-ink">{step.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{step.descricao}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* DESTAQUE (versão forte) */}
        <section className="bg-ink py-20 text-white md:py-24">
          <div className="container-somma">
            <Reveal className="mx-auto max-w-3xl text-center">
              <p className="text-2xl font-semibold leading-snug md:text-3xl">
                Aqui, evolução não é sobre pressão.{" "}
                <span className="text-primary">É sobre constância, direção e boas pessoas ao redor.</span>
              </p>
              <p className="mt-6 text-white/70">
                Não importa se você está começando agora ou se já corre há anos — na Assessoria Somma
                você encontra treino, acolhimento, orientação e uma comunidade que corre junto com você.
              </p>
            </Reveal>
          </div>
        </section>

        {/* DEPOIMENTOS — oculto por enquanto (trocar `false` por `true` para reexibir) */}
        {false && (
        <section className="bg-light py-20 md:py-28">
          <div className="container-somma">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Quem treina, recomenda</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Gente real, evolução real
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {ADVISORY_TESTIMONIALS.map((t, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  {/* TODO(conteúdo): substituir por depoimentos e fotos reais de alunos. */}
                  <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-sm">
                    <Quote className="h-7 w-7 text-primary" />
                    <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-ink">“{t.frase}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {t.nome.charAt(0)}
                      </span>
                      <span>
                        <span className="block font-medium text-ink">{t.nome}</span>
                        <span className="block text-sm text-muted">{t.contexto}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* PLANOS */}
        <section id="planos" className="relative isolate overflow-hidden bg-black py-20 text-white md:py-28">
          <Hyperspeed effectOptions={HYPERSPEED_FX} />
          <div className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-black/75 via-black/45 to-black/85" />
          <div className="container-somma relative z-10">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Planos</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
                Escolha seu plano e seu professor
              </h2>
              <p className="mt-4 text-white/70">Pague no cartão, parcelado ou PIX. Sem complicação.</p>
            </Reveal>
            <Reveal className="mt-14">
              <SommaPricing plans={ADVISORY_PLANS} dark />
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-20 md:py-28">
          <div className="container-somma max-w-3xl">
            <Reveal className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Dúvidas</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Perguntas frequentes
              </h2>
            </Reveal>
            <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
              {ADVISORY_FAQ.map((item, i) => (
                <details key={i} className="group py-5" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="text-primary transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-primary py-16 text-white">
          <div className="container-somma flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Sua corrida começa com acompanhamento de verdade</h2>
            <p className="max-w-xl text-white/90">
              Escolha seu professor, entre para a Assessoria Somma e treine com quem entende o seu momento.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#planos" className="rounded-full bg-white px-7 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90">
                Começar agora
              </a>
              <a
                href={SOMMA.links.whatsappAssessoria}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/60 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
