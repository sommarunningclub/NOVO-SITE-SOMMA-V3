import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { altone } from "@/components/bora/fonte";
import { CabecalhoBora } from "@/components/bora/cabecalho-bora";
import { ContatoBora } from "@/components/bora/contato-bora";
import { RegistrarVisita } from "@/components/bora/registrar-visita";
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores";

/**
 * /assessoria: a BORA é a assessoria oficial do SOMMA Club.
 *
 * O site não vende mais planos. O único caminho daqui é "falar com um
 * professor": nome e WhatsApp, e o rodízio do servidor escolhe quem atende
 * (ver app/api/nova-assessoria/contato). Os cards dos professores não têm
 * link de propósito: link direto para um deles furaria a fila.
 */

export const metadata: Metadata = {
  title: "BORA Assessoria | Assessoria oficial do SOMMA Club",
  description:
    "A BORA Assessoria é a assessoria oficial do SOMMA Club. Os mesmos professores, o mesmo cuidado, agora com uma estrutura nacional. Fale com um professor no WhatsApp.",
  alternates: { canonical: "/assessoria" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "BORA Assessoria | Assessoria oficial do SOMMA Club",
    description: "Os mesmos professores, o mesmo cuidado, agora com uma estrutura nacional.",
    siteName: "SOMMA Club",
  },
};

const PASSOS = [
  { titulo: "Deixe seu contato", texto: "Nome e WhatsApp. Leva dez segundos." },
  { titulo: "Fale com um professor", texto: "A conversa abre direto no WhatsApp de um professor BORA." },
  { titulo: "Comece a treinar", texto: "Vocês montam juntos o plano para o seu momento e o seu objetivo." },
];

export default function AssessoriaPage() {
  return (
    <main className={`${altone.variable} min-h-screen overflow-x-hidden bg-black text-white`}>
      {/* O body do site é branco: sem isso, o "quique" do scroll no iOS mostra branco. */}
      <style>{"html,body{background:#000}"}</style>
      <RegistrarVisita pagina="assessoria" />

      {/* Abertura */}
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
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-20">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">
            Assessoria oficial do SOMMA Club
          </p>
          <h1 className="mt-5 max-w-4xl font-bora text-[44px] font-black uppercase italic leading-[0.92] sm:text-7xl md:text-8xl">
            A assessoria do SOMMA agora é <span className="text-bora">BORA</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
            A BORA Assessoria é a assessoria oficial do SOMMA Club. Os mesmos professores, o mesmo cuidado, agora com
            uma estrutura nacional.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ContatoBora pagina="assessoria" rotulo="Quero treinar com a BORA" />
            <p className="text-sm text-white/50">Você fala direto com um professor no WhatsApp.</p>
          </div>
        </div>
      </section>

      {/* Professores */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Professores BORA</p>
          <h2 className="mt-4 max-w-3xl font-bora text-4xl font-black uppercase italic leading-[0.95] md:text-6xl">
            Quem treina você
          </h2>
          <p className="mt-5 max-w-xl text-white/65">
            Os professores que você já conhece do SOMMA seguem com você, agora como professores BORA.
          </p>

          <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {PROFESSORES_BORA.map((p) => (
              <li key={p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                  <Image
                    src={p.foto}
                    alt={p.nome}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover object-top grayscale transition duration-500 group-hover:grayscale-0"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <p className="font-bora text-lg font-black uppercase italic leading-none sm:text-2xl">{p.nome}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-widest text-bora">
                    Professor BORA{p.apelido ? ` · ${p.apelido}` : ""}
                  </p>
                  {p.bio && <p className="mt-3 hidden text-sm leading-snug text-white/60 sm:block">{p.bio.chamada}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Como funciona</p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="border-t-2 border-bora pt-6">
                <span className="font-bora text-5xl font-black italic text-bora">{i + 1}</span>
                <h3 className="mt-3 font-bora text-2xl font-black uppercase italic">{passo.titulo}</h3>
                <p className="mt-2 text-white/65">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fechamento */}
      <section className="relative overflow-hidden bg-bora text-black">
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between md:py-24">
          <div>
            <p className="font-bora text-sm font-bold uppercase tracking-[0.2em]">A comunidade continua</p>
            <h2 className="mt-4 max-w-2xl font-bora text-4xl font-black uppercase italic leading-[0.95] md:text-6xl">
              Você não precisa estar pronto. Só precisa começar.
            </h2>
            <p className="mt-5 max-w-xl text-black/70">
              Os treinos do SOMMA Club seguem abertos a todos. O que muda é a assessoria, que agora é BORA.
            </p>
          </div>
          <ContatoBora
            pagina="assessoria"
            rotulo="Falar com um professor"
            variante="preto"
            className="shrink-0"
          />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar para o SOMMA Club
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
