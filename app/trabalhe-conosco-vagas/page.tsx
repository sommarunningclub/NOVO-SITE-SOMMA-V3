import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, GraduationCap, HeartHandshake, Rocket, Users } from "lucide-react";
import { SOMMA } from "@/lib/somma-data";
import { Reveal } from "@/components/reveal";
import { Footer } from "@/components/footer";
import Hyperspeed from "@/components/ui/hyperspeed";
import { VAGAS_ATIVAS } from "./_vagas";
import { VagasSection } from "./_vagas-section";

// Mesmo preset visual do hero da /assessoria — mantém as duas páginas na mesma língua.
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

const MOTIVOS = [
  {
    Icon: GraduationCap,
    titulo: "Aprendizado na pista",
    descricao:
      "Você acompanha planilha, avaliação e ajuste de treino na prática, ao lado de professores experientes.",
  },
  {
    Icon: Users,
    titulo: "A maior comunidade do DF",
    descricao:
      "Centenas de corredores, do primeiro 5K à maratona. Gente real para você aprender a cuidar de cada momento.",
  },
  {
    Icon: Rocket,
    titulo: "Espaço para crescer",
    descricao:
      "O Somma forma o próprio time por dentro. Quem se dedica encontra porta aberta.",
  },
  {
    Icon: HeartHandshake,
    titulo: "Ambiente que acolhe",
    descricao:
      "Sem pressão tóxica nem competição interna. Um time que estuda junto, corrige junto e comemora junto.",
  },
];

// Fotos do acervo usado na /assessoria (public/somma).
const GALERIA = [
  { src: "/somma/PDCSK217JAN-2433.jpg", alt: "Corredores do Somma Club em treino" },
  { src: "/somma/SMSPD-372.jpg", alt: "Grupo do Somma Club reunido antes da largada" },
  { src: "/somma/EXQTSMM-284.jpg", alt: "Professores acompanhando alunos no treino" },
];

export const metadata: Metadata = {
  title: "Vagas no Somma Club | Trabalhe Conosco",
  description:
    "Faça parte do time do maior running club do Distrito Federal. Confira as vagas abertas na Assessoria Somma e envie seu currículo.",
  alternates: { canonical: "/trabalhe-conosco-vagas" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Vagas no Somma Club | Trabalhe Conosco",
    description:
      "Vagas abertas no Somma Club. Venha aprender e crescer com o maior running club do DF.",
    siteName: "SOMMA Club",
  },
};

// JSON-LD de JobPosting: coloca as vagas no Google Jobs.
function jobPostingJsonLd() {
  return VAGAS_ATIVAS.map((vaga) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: vaga.titulo,
    description: [
      `<p>${vaga.sobre}</p>`,
      `<p><strong>O que você vai fazer:</strong></p><ul>${vaga.atividades.map((a) => `<li>${a}</li>`).join("")}</ul>`,
      `<p><strong>O que buscamos:</strong></p><ul>${vaga.requisitos.map((r) => `<li>${r}</li>`).join("")}</ul>`,
      `<p><strong>Benefícios:</strong></p><ul>${vaga.beneficios.map((b) => `<li>${b}</li>`).join("")}</ul>`,
    ].join(""),
    datePosted: vaga.publicadaEm,
    employmentType: "INTERN",
    hiringOrganization: {
      "@type": "Organization",
      name: "Somma Club",
      sameAs: "https://sommaclub.com.br",
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: { "@type": "Country", name: "BR" },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brasília",
        addressRegion: "DF",
        addressCountry: "BR",
      },
    },
    directApply: true,
    url: "https://sommaclub.com.br/trabalhe-conosco-vagas",
  }));
}

export default function TrabalheConoscoPage() {
  const vagas = VAGAS_ATIVAS;

  return (
    <>
      {vagas.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd()) }}
        />
      )}

      {/* Header simples — mesmo padrão da /assessoria */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="container-somma flex h-16 items-center justify-between md:h-20">
          <Link href="/" aria-label="SOMMA Club">
            <Image
              src="/logo-somma.svg"
              alt="SOMMA Club"
              width={120}
              height={32}
              className="h-7 w-auto md:h-8"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden items-center gap-2 text-sm font-medium text-white/80 hover:text-white sm:flex"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao site
            </Link>
            <a
              href="#vagas"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Ver vagas
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden bg-black text-white">
          <Hyperspeed effectOptions={HYPERSPEED_FX} />
          <div className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-black/70 via-black/40 to-black/85" />
          <div className="container-somma relative z-10 py-28">
            <Reveal className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Trabalhe Conosco
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Corra com a gente. Profissionalmente.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/80">
                O Somma Club é o maior running club do Distrito Federal. Se você quer aprender na
                prática como se cuida de um corredor e construir carreira no esporte, seu lugar é
                aqui.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#vagas"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  Ver vagas abertas <ArrowUpRight className="h-4 w-4" />
                </a>
                <Link
                  href="/assessoria"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Conhecer a Assessoria
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* POR QUE TRABALHAR NO SOMMA */}
        <section className="bg-white py-20 md:py-28">
          <div className="container-somma grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
                <Image
                  src="/somma/IMG_0888_JPG.jpg"
                  alt="Time da Assessoria Somma em treino"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Por que o Somma
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Um time que trata corrida como profissão
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-muted md:text-lg">
                <p>
                  Aqui a corrida não é hobby de fim de semana. É método, dado e acompanhamento. Quem
                  entra no time do Somma aprende a olhar para o corredor por inteiro: o treino, a
                  rotina, a cabeça e o objetivo.
                </p>
                <p>
                  Você vai trabalhar ao lado de quem faz isso acontecer todos os dias, com espaço
                  para perguntar, errar, aprender e assumir responsabilidade de verdade.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* MOTIVOS */}
        <section className="bg-light py-20 md:py-28">
          <div className="container-somma">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                O que você encontra aqui
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
                Mais do que uma linha no currículo
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {MOTIVOS.map(({ Icon, titulo, descricao }, i) => (
                <Reveal key={titulo} delay={(i % 4) * 0.08}>
                  <div className="h-full rounded-3xl border border-black/5 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-ink">{titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{descricao}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAIXA DE FOTOS — mesmas imagens da /assessoria */}
        <section className="bg-white pb-4 md:pb-8">
          <div className="container-somma">
            <div className="grid gap-4 sm:grid-cols-3">
              {GALERIA.map(({ src, alt }, i) => (
                <Reveal key={src} delay={i * 0.08}>
                  <div
                    className={`relative w-full overflow-hidden rounded-3xl ${
                      i === 1 ? "aspect-[4/5] sm:-mt-8" : "aspect-[4/5]"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* VAGAS + MODAL */}
        <VagasSection vagas={vagas} />

        {/* DESTAQUE */}
        <section className="bg-ink py-20 text-white md:py-24">
          <div className="container-somma">
            <Reveal className="mx-auto max-w-3xl text-center">
              <p className="text-2xl font-semibold leading-snug md:text-3xl">
                A gente não procura currículo perfeito.{" "}
                <span className="text-primary">Procura gente que gosta de gente e de correr.</span>
              </p>
              <p className="mt-6 text-white/70">
                Se você se identificou com a vaga mas acha que falta experiência, candidate-se mesmo
                assim. Aqui, vontade de aprender pesa mais que uma lista de cursos.
              </p>
            </Reveal>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-primary py-16 text-white">
          <div className="container-somma flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Não encontrou sua vaga?</h2>
            <p className="max-w-xl text-white/90">
              Siga o Somma no Instagram: é lá que cada nova oportunidade é anunciada primeiro.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#vagas"
                className="rounded-full bg-white px-7 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-white/90"
              >
                Ver vagas abertas
              </a>
              <a
                href={SOMMA.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/60 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Seguir no Instagram
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
