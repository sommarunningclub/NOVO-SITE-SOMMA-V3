import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowDown, ArrowRight, ArrowUpRight, Instagram } from "lucide-react"
import { altone } from "@/components/bora/fonte"
import { ContatoBora } from "@/components/bora/contato-bora"
import { RegistrarVisita } from "@/components/bora/registrar-visita"
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores"
import {
  CHECKOUT_BORA_URL,
  PROMO,
  cupomDoProfessor,
  promoValendo,
  reais,
  type PlanoBora,
} from "@/lib/nova-assessoria/promo"
import { CupomDoProfessor } from "./CupomDoProfessor"

/**
 * Link de um professor BORA (sommaclub.com.br/<professor>), o que vai na bio
 * do Instagram dele.
 *
 * Os quatro links são a mesma tela com o professor trocado, então ela mora
 * aqui e cada rota só diz de quem é. A assinatura é no checkout da BORA na
 * Runy (lib/nova-assessoria/promo); aqui ficam os planos, o cupom do
 * professor enquanto a promo do mês vale e o contato direto com ele no
 * WhatsApp, sem passar pelo rodízio de /assessoria. Visita e contato ficam
 * registrados com a página `bio-<slug>`.
 */

function professorPeloNome(nome: string) {
  return PROFESSORES_BORA.find((p) => p.nome === nome) ?? null
}

export function metadataDoProfessor(nome: string): Metadata {
  const professor = professorPeloNome(nome)
  return {
    title: `${nome} | Professor BORA Assessoria`,
    description:
      professor?.bio?.chamada ??
      `${nome} é professor da BORA Assessoria, a assessoria oficial do SOMMA Club. Fale com ele no WhatsApp.`,
    robots: { index: false, follow: false },
  }
}

/** O que a pessoa paga, em parcelas quando o plano é parcelado. */
function condicao(plano: PlanoBora, valor: number, comPromo: boolean): string {
  if (plano.parcelas > 1) return `${plano.parcelas}x de ${reais(valor / plano.parcelas)}`
  return comPromo ? `no 1º mês, depois ${reais(plano.cheio)}/mês` : "por mês"
}

function CartaoDoPlano({ plano, comPromo }: { plano: PlanoBora; comPromo: boolean }) {
  const valor = comPromo ? plano.promo : plano.cheio
  return (
    <li className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-bora text-2xl font-black uppercase italic">{plano.nome}</h3>
      {comPromo && <p className="mt-4 text-sm text-white/50 line-through">de {reais(plano.cheio)}</p>}
      <p className={`font-bora text-4xl font-black italic text-bora ${comPromo ? "mt-1" : "mt-4"}`}>{reais(valor)}</p>
      <p className="mt-2 text-sm text-white/70">{condicao(plano, valor, comPromo)}</p>
    </li>
  )
}

export function PaginaDoProfessor({ nome }: { nome: string }) {
  const professor = professorPeloNome(nome)
  if (!professor) notFound()

  const { bio, primeiroNome, slug } = professor
  const pagina = `bio-${slug}`
  const cupom = cupomDoProfessor(slug)
  const comPromo = promoValendo() && cupom !== null

  return (
    <main className={`${altone.variable} min-h-screen overflow-x-hidden bg-black pb-28 text-white sm:pb-0`}>
      <RegistrarVisita pagina={pagina} />

      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Image src="/bora/logo-white.png" alt="BORA" width={640} height={164} className="h-6 w-auto" priority />
        <span className="text-right font-bora text-[11px] font-bold uppercase leading-tight tracking-[0.2em] text-bora">
          Assessoria oficial
          <br className="sm:hidden" /> do SOMMA Club
        </span>
      </header>

      {/* Abertura */}
      <section className="relative mx-auto grid max-w-5xl gap-10 px-4 pb-16 pt-6 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:pb-24 md:pt-10">
        <Image
          src="/bora/pattern-bora-white.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={1000}
          className="pointer-events-none absolute -left-40 -top-10 w-[560px] opacity-[0.07]"
        />
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[28px] bg-bora" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white">
            <Image src={professor.foto} alt={nome} fill priority sizes="(min-width: 768px) 384px, 90vw" className="object-cover object-top" />
          </div>
        </div>

        <div className="relative">
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Professor BORA</p>
          <h1 className="mt-4 font-bora text-5xl font-black uppercase italic leading-[0.9] sm:text-7xl">{nome}</h1>
          {professor.apelido && (
            <p className="mt-3 font-bora text-xl font-bold uppercase italic text-white/50">{professor.apelido}</p>
          )}
          {bio && <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">{bio.chamada}</p>}
          {bio && bio.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {bio.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-bora/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-bora"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-9 hidden flex-wrap items-center gap-5 sm:flex">
            <a
              href="#planos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-bora px-7 py-4 font-bora text-base font-bold uppercase tracking-wide text-black transition-transform hover:bg-white active:scale-[0.98]"
            >
              {comPromo ? `Ver planos com ${PROMO.desconto}% OFF` : "Ver planos"}
              <ArrowDown className="h-5 w-5" aria-hidden="true" />
            </a>
            <ContatoBora pagina={pagina} professor={primeiroNome} rotulo={`Falar com ${primeiroNome}`} variante="contorno" />
            <a
              href={professor.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
            >
              <Instagram className="h-5 w-5" /> Instagram
            </a>
          </div>
          <a
            href={professor.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white sm:hidden"
          >
            <Instagram className="h-5 w-5" /> Instagram
          </a>
        </div>
      </section>

      {/* Planos e promo do mês */}
      <section id="planos" className="scroll-mt-4 border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20">
          {comPromo ? (
            <>
              <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">
                Promo do mês · até {PROMO.validaAteTexto.slice(0, 5)}
              </p>
              <h2 className="mt-4 font-bora text-4xl font-black uppercase italic leading-[0.95] sm:text-6xl">
                {PROMO.nome} <span className="text-bora">{PROMO.desconto}% OFF</span>
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/70">
                Na primeira compra, com o cupom do {primeiroNome}.
              </p>
            </>
          ) : (
            <>
              <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Planos</p>
              <h2 className="mt-4 font-bora text-4xl font-black uppercase italic leading-[0.95] sm:text-6xl">
                Treine com o {primeiroNome}
              </h2>
            </>
          )}

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {PROMO.planos.map((plano) => (
              <CartaoDoPlano key={plano.nome} plano={plano} comPromo={comPromo} />
            ))}
          </ul>

          {comPromo && cupom && (
            <div className="mt-8">
              <CupomDoProfessor cupom={cupom} primeiroNome={primeiroNome} />
            </div>
          )}

          <a
            href={CHECKOUT_BORA_URL}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bora px-7 py-5 font-bora text-lg font-bold uppercase tracking-wide text-black transition-transform hover:bg-white active:scale-[0.98] sm:w-auto"
          >
            {comPromo ? "Assinar com o cupom" : "Assinar"}
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </a>

          {comPromo && (
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/50">
              Válido até {PROMO.validaAteTexto}, na primeira compra. No Anual o desconto vale nas 12 parcelas, no
              Semestral nas 6 e no Mensal no primeiro mês.
            </p>
          )}
        </div>
      </section>

      {/* Números ou pilares */}
      {bio?.numeros && bio.numeros.length > 0 && (
        <section className="border-t border-white/10">
          <ul className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-4 py-12 sm:px-6 md:py-16">
            {bio.numeros.map((n) => (
              <li key={n.label}>
                <p className="font-bora text-4xl font-black italic text-bora sm:text-6xl">
                  {n.valor}
                  {n.sufixo}
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">{n.label}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {bio?.destaques && bio.destaques.length > 0 && (
        <section className="border-t border-white/10">
          <ul className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 md:py-16">
            {bio.destaques.map((d) => (
              <li key={d.titulo} className="border-t-2 border-bora pt-5">
                <h2 className="font-bora text-2xl font-black uppercase italic">{d.titulo}</h2>
                <p className="mt-2 text-white/65">{d.texto}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sobre */}
      {bio && bio.paragrafos.length > 0 && (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
            <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Sobre {primeiroNome}</p>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-white/80">
              {bio.paragrafos.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fechamento */}
      <section className="bg-bora text-black">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bora text-3xl font-black uppercase italic leading-none md:text-5xl">letz BORA</h2>
            <p className="mt-3 max-w-md text-black/70">
              A BORA Assessoria é a assessoria oficial do SOMMA Club. Os mesmos professores, agora com uma estrutura
              nacional.
            </p>
          </div>
          <Link
            href="/assessoria"
            className="inline-flex items-center gap-2 font-bora text-sm font-bold uppercase tracking-wider underline-offset-4 hover:underline"
          >
            Conheça a BORA no SOMMA <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* No celular, os botões ficam sempre à mão. */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 bg-black/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
        <a
          href="#planos"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-bora px-5 py-4 font-bora text-base font-bold uppercase tracking-wide text-black active:scale-[0.98]"
        >
          {comPromo ? `Planos ${PROMO.desconto}% OFF` : "Ver planos"}
        </a>
        <ContatoBora pagina={pagina} professor={primeiroNome} rotulo="Falar" variante="contorno" className="px-5" />
      </div>
    </main>
  )
}
