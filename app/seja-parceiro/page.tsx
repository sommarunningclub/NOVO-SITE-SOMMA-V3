import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { PartnerForm } from "@/components/partner-form";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Seja parceiro do SOMMA Club",
  description:
    "Conecte sua marca à maior comunidade de corrida do Distrito Federal. Preencha o formulário e nosso time comercial entra em contato.",
  alternates: { canonical: "/seja-parceiro" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Seja parceiro do SOMMA Club",
    description:
      "Conecte sua marca à maior comunidade de corrida do Distrito Federal.",
    siteName: "SOMMA Club",
  },
};

export default function SejaParceiroPage() {
  return (
    <>
      {/* Header simples */}
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
          <Link
            href="/"
            className="hidden items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white sm:flex"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-black text-white">
          <div className="hero-spotlight pointer-events-none absolute inset-0 -z-[1]" />
          <div className="container-somma py-28 md:py-32">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Parcerias
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                Seja parceiro do Somma Club.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/80">
                Conecte sua marca à maior comunidade de corrida do Distrito Federal — mais de 5.000
                membros que se encontram todo sábado, às 7h, no Parque da Cidade. Preencha o
                formulário e nosso time comercial entra em contato.
              </p>
            </Reveal>
          </div>
        </section>

        {/* FORMULÁRIO */}
        <section className="bg-light py-16 md:py-20">
          <div className="container-somma">
            <Reveal>
              <PartnerForm />
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
