"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"
import {
  ArrowDown,
  CalendarDays,
  Dumbbell,
  Instagram,
  MessageCircle,
  Plus,
  ShieldCheck,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react"
import type { Bio } from "../_lib/bios"
import type { Professor } from "@/components/checkout-form"

/**
 * A apresentação que abre o link dedicado do professor: quem ele é, o que o
 * cliente leva na prática e como a coisa começa. O checkout continua logo
 * abaixo; isto aqui é o que faz alguém querer rolar até ele.
 *
 * Tudo que se move respeita `prefers-reduced-motion`: quem pediu menos
 * movimento vê os mesmos números e os mesmos textos, parados.
 */

/** Conta de 0 até o valor quando o número entra na tela. */
function Contador({ valor, sufixo = "" }: { valor: number; sufixo?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const emTela = useInView(ref, { once: true, margin: "-40px" })
  const semMovimento = useReducedMotion()
  const [atual, setAtual] = useState(0)

  useEffect(() => {
    if (!emTela) return
    if (semMovimento) {
      setAtual(valor)
      return
    }

    const duracao = 900
    const inicio = performance.now()
    let frame = 0

    const passo = (agora: number) => {
      const t = Math.min((agora - inicio) / duracao, 1)
      // Desacelera no fim: o número "assenta" em vez de parar seco.
      setAtual(Math.round(valor * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(passo)
    }

    frame = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(frame)
  }, [emTela, valor, semMovimento])

  return (
    <span ref={ref}>
      {atual}
      {sufixo}
    </span>
  )
}

const BENEFICIOS = [
  {
    icone: Dumbbell,
    titulo: "Planilha feita para você",
    resumo: "Treino montado a partir do seu nível, da sua rotina e do seu objetivo.",
    naPratica:
      "Quem nunca correu 5 km e quem está fechando uma maratona não treinam igual. A planilha sai do seu ponto de partida, não de um modelo pronto.",
  },
  {
    icone: MessageCircle,
    titulo: "Seu professor no WhatsApp",
    resumo: "Contato direto desde o primeiro dia da assinatura.",
    naPratica:
      "Dormiu mal, viajou a trabalho, sentiu uma fisgada no joelho? Manda mensagem e a semana é ajustada. A planilha se mexe junto com a sua vida.",
  },
  {
    icone: CalendarDays,
    titulo: "Treino presencial todo domingo",
    resumo: "Encontro completo da Assessoria, conduzido pelos professores.",
    naPratica:
      "É onde o professor vê você correndo de verdade: postura, respiração, ritmo. Coisa que nenhuma planilha corrige sozinha, por melhor que seja.",
  },
  {
    icone: ShieldCheck,
    titulo: "Evolução sem se machucar",
    resumo: "Progressão na medida, com atenção à prevenção de lesões.",
    naPratica:
      "Correr mais rápido é fácil por uma semana. O trabalho é aumentar carga no ritmo que o seu corpo aguenta, para você ainda estar correndo daqui a um ano.",
  },
  {
    icone: Users,
    titulo: "Grupo exclusivo da Assessoria",
    resumo: "Você entra no grupo dos alunos assim que a assinatura sai.",
    naPratica:
      "Avisos, orientações, dúvidas respondidas e gente no mesmo barco que o seu. Ninguém treina sozinho aqui.",
  },
  {
    icone: Shirt,
    titulo: "Camiseta da Assessoria",
    resumo: "Nos planos Semestral e Anual você escolhe o tamanho no checkout.",
    naPratica:
      "O tamanho é perguntado logo ali embaixo, junto com os seus dados. Chegou domingo, você já corre vestindo o time.",
  },
]

const JORNADA = [
  {
    titulo: "Você assina",
    texto: "Escolhe o plano aqui embaixo e entra oficialmente para a Assessoria Somma.",
  },
  {
    titulo: "O professor te chama",
    texto: "Assim que a assinatura é confirmada, a conversa já começa no WhatsApp.",
  },
  {
    titulo: "Entrevista inicial",
    texto: "Uma conversa de diagnóstico sobre seu histórico, sua rotina, sua experiência e seus objetivos.",
  },
  {
    titulo: "Formulário do atleta",
    texto: "Você preenche as informações que deixam o acompanhamento mais certeiro e mais seguro.",
  },
  {
    titulo: "Entrada no grupo",
    texto: "Você cai no grupo exclusivo da Assessoria, com avisos, suporte e comunidade.",
  },
  {
    titulo: "Treino na rua",
    texto: "Seus treinos chegam, os domingos começam a fazer parte da rotina e a evolução aparece.",
  },
]

export function Apresentacao({ bio, professor }: { bio: Bio; professor?: Professor }) {
  const [aberto, setAberto] = useState<number | null>(null)
  const [etapa, setEtapa] = useState(0)
  const instagram = professor?.instagram
  const arroba = instagram ? instagram.split("/").filter(Boolean).pop() : null

  return (
    <div className="mb-10 sm:mb-14 lg:mb-20">
      {/* ── Quem é o professor ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,420px)_1fr]">
          {professor?.link_foto && (
            <div className="relative aspect-[4/5] w-full sm:aspect-[3/2] lg:aspect-auto lg:h-full lg:min-h-[420px]">
              <Image
                src={professor.link_foto}
                alt={professor.nome}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                // O rosto fica no terço de cima da foto: recortar pelo centro
                // corta a cabeça no celular, onde o quadro é mais estreito.
                className="object-cover object-[50%_28%]"
              />
              {/* O preto por baixo do texto do mobile, onde a foto vira fundo. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/60" />
            </div>
          )}

          <div className="p-5 sm:p-8 lg:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#ff4f2d]">
              Seu professor na Assessoria Somma
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {professor?.nome ?? bio.primeiroNome}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {bio.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60"
                >
                  {tag}
                </span>
              ))}
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4f2d] px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-[#e6452a]"
                >
                  <Instagram className="h-3.5 w-3.5" />@{arroba}
                </a>
              )}
            </div>

            <p className="mt-6 text-lg leading-snug text-white sm:text-xl">{bio.chamada}</p>

            {/* Os números, contando sozinhos quando aparecem. */}
            <div className="mt-7 grid grid-cols-3 gap-3">
              {bio.numeros.map((numero) => (
                <div
                  key={numero.label}
                  className="rounded-2xl border border-white/10 bg-black/40 px-3 py-4 text-center"
                >
                  <p className="text-2xl font-semibold text-[#ff4f2d] sm:text-3xl">
                    <Contador valor={numero.valor} sufixo={numero.sufixo} />
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-white/50 sm:text-xs">
                    {numero.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-4 text-sm leading-relaxed text-white/60 sm:text-base">
              {bio.paragrafos.map((paragrafo) => (
                <p key={paragrafo.slice(0, 24)}>{paragrafo}</p>
              ))}
            </div>

            <a
              href="#planos"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              Quero treinar com o {bio.primeiroNome}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── O que você leva ────────────────────────────────────────────── */}
      <section className="mt-10 sm:mt-14">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#ff4f2d]" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/50 sm:text-sm">
            O que você leva na Assessoria
          </h2>
        </div>
        <p className="mt-2 text-sm text-white/40">Toque em um card para ver como funciona na prática.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((beneficio, i) => {
            const Icone = beneficio.icone
            const estaAberto = aberto === i
            return (
              <button
                key={beneficio.titulo}
                type="button"
                onClick={() => setAberto(estaAberto ? null : i)}
                aria-expanded={estaAberto}
                className={`rounded-2xl border p-5 text-left transition-colors ${
                  estaAberto
                    ? "border-[#ff4f2d]/60 bg-[#ff4f2d]/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff4f2d]/10 text-[#ff4f2d]">
                    <Icone className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <Plus
                    className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 ${
                      estaAberto ? "rotate-45" : ""
                    }`}
                  />
                </div>
                <h3 className="mt-4 text-base font-medium text-white">{beneficio.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{beneficio.resumo}</p>

                <AnimatePresence initial={false}>
                  {estaAberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/70">
                        {beneficio.naPratica}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Como começa ────────────────────────────────────────────────── */}
      <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:mt-14 sm:p-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-white/50 sm:text-sm">
          Como começa, passo a passo
        </h2>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {JORNADA.map((passo, i) => (
            <button
              key={passo.titulo}
              type="button"
              onClick={() => setEtapa(i)}
              aria-current={etapa === i}
              aria-label={`Passo ${i + 1}: ${passo.titulo}`}
              className={`h-10 w-10 shrink-0 rounded-full border text-sm font-medium transition-colors ${
                etapa === i
                  ? "border-[#ff4f2d] bg-[#ff4f2d] text-black"
                  : i < etapa
                    ? "border-[#ff4f2d]/40 text-[#ff4f2d]"
                    : "border-white/15 text-white/40 hover:border-white/30"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-5 min-h-[92px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={etapa}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-medium text-white sm:text-xl">{JORNADA[etapa].titulo}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
                {JORNADA[etapa].texto}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
