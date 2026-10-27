import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { altone } from "@/components/bora/fonte";
import { CabecalhoBora } from "@/components/bora/cabecalho-bora";
import { FormularioRio } from "./_components/FormularioRio";

/**
 * /assessoria/maratona-rio-2027: a galera da assessoria diz se vai para a
 * Maratona do Rio 2027 e qual distância pretende correr. Não é inscrição na
 * prova; a lista serve para a assessoria se organizar. Grava em
 * `maratona_rio_2027_intencoes` (ver app/api/maratona-rio-2027/intencao).
 */

export const metadata: Metadata = {
  title: "Maratona do Rio 2027 | Assessoria SOMMA Club × BORA",
  description: "Vai correr a Maratona do Rio 2027 com a assessoria? Deixe seus dados e escolha a sua distância.",
  alternates: { canonical: "/assessoria/maratona-rio-2027" },
  // Link da assessoria, não página de busca.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMMA Club",
    title: "Maratona do Rio 2027 com a assessoria",
    description: "Deixe seus dados e escolha a sua distância.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function MaratonaRio2027Page() {
  return (
    <main className={`${altone.variable} min-h-screen overflow-x-hidden bg-black text-white`}>
      {/* O body do site é branco: sem isso, o "quique" do scroll no iOS mostra branco. */}
      <style>{"html,body{background:#000}"}</style>

      <section className="relative">
        <Image
          src="/bora/pattern-bora-white.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={1000}
          className="pointer-events-none absolute -right-40 top-0 w-[520px] opacity-[0.08] sm:-right-24 sm:w-[760px]"
          priority
        />
        <CabecalhoBora />
        <div className="relative mx-auto max-w-2xl px-4 pb-10 pt-8 sm:px-6 md:pt-14">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Assessoria · Rio de Janeiro</p>
          <h1 className="mt-4 font-bora text-[44px] font-black uppercase italic leading-[0.92] sm:text-7xl">
            Maratona do Rio <span className="text-bora">2027</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            Vai correr com a gente no Rio? Deixe seus dados e escolha a distância que pretende correr. Assim a assessoria
            organiza o grupo, os treinos e a viagem.
          </p>
          <p className="mt-3 text-sm text-white/50">Isto não é a inscrição na prova. A inscrição oficial é feita depois.</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <FormularioRio />
      </section>

      <footer className="mx-auto flex max-w-2xl flex-col gap-4 border-t border-white/10 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/assessoria" className="inline-flex items-center gap-2 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Assessoria
        </Link>
        <Image
          src="/bora/sticker-letz-bora-green.webp"
          alt="letz BORAAA!!"
          width={720}
          height={336}
          className="h-12 w-auto"
        />
      </footer>
    </main>
  );
}
