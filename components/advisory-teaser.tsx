import Image from "next/image";
import { ArrowUpRight, ImagePlus, Users, Handshake, Sparkles, MessageCircle } from "lucide-react";
import { ADVISORY_PILLARS, ADVISORY_PLANS } from "@/lib/somma-data";
import { Reveal } from "./reveal";
import { SommaPricing } from "./ui/somma-pricing";
import Hyperspeed from "./ui/hyperspeed";

const ICONS = [Users, Handshake, Sparkles, MessageCircle];

// Imagem principal do bloco (à esquerda). Deixe "" para exibir o placeholder editável.
const MAIN_IMAGE = "/somma/IMG_1479_JPG.jpg";

// Efeito Hyperspeed — tema preto + laranja Somma (constante p/ identidade estável do prop).
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

export function AdvisoryTeaser() {
  return (
    <section id="assessoria" className="relative isolate overflow-hidden bg-black py-20 text-white md:py-28">
      {/* Background animado (Hyperspeed) — passivo, atrás do conteúdo */}
      <Hyperspeed effectOptions={HYPERSPEED_FX} />
      {/* Véu para legibilidade do conteúdo */}
      <div className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

      <div className="container-somma relative z-10">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
          {/* Esquerda — imagem */}
          <Reveal className="w-full md:w-1/2">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
              {MAIN_IMAGE ? (
                <Image
                  src={MAIN_IMAGE}
                  alt="Assessoria Somma"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 text-white/60">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Adicionar imagem · Assessoria</span>
                </div>
              )}
            </div>
          </Reveal>

          {/* Direita — textos e elementos */}
          <div className="w-full space-y-8 md:w-1/2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Assessoria Somma
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
                Quer evoluir com método? Conheça a Assessoria Somma.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                O braço técnico do Somma para quem busca acompanhamento profissional, planejamento de
                treinos e evolução com suporte mais próximo.
              </p>
            </Reveal>

            {/* Pilares */}
            <div className="space-y-6">
              {ADVISORY_PILLARS.map((pilar, i) => {
                const Icon = ICONS[i] ?? Sparkles;
                return (
                  <Reveal key={pilar.grupo} delay={i * 0.1}>
                    <div className="flex items-start gap-5">
                      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-white">{pilar.grupo}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/70">{pilar.descricao}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* CTA */}
            <Reveal delay={0.2}>
              <a
                href="/assessoria"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Conhecer a Assessoria
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Reveal>
          </div>
        </div>

        {/* Planos da Assessoria */}
        <Reveal className="mt-16">
          <SommaPricing plans={ADVISORY_PLANS} dark />
        </Reveal>
      </div>
    </section>
  );
}
