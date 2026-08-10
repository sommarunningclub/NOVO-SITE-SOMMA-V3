'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

const TARGET = new Date('2026-05-02T09:00:00-03:00').getTime()
const ZERO = { days: 0, hours: 0, mins: 0, secs: 0 }

function diff() {
  const now = Date.now()
  const ms = Math.max(0, TARGET - now)
  // Conta dias inteiros pelo calendário (arredonda pra cima): se faltam 3d 13h até a largada,
  // mostra "4 dias" — alinhado ao senso comum de "faltam X dias até o evento".
  const days = Math.ceil(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  const secs = Math.floor((ms % 60_000) / 1000)
  return { days, hours, mins, secs }
}

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

export default function WingsHero() {
  const [t, setT] = useState(ZERO)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setT(diff())
    const id = setInterval(() => setT(diff()), 1000)
    return () => clearInterval(id)
  }, [])

  const scrollToForm = () => {
    document.getElementById('wings-inscricao')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative bg-wfl-navy text-white overflow-hidden">
      {/* Diagonal accent */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-wfl-red/10 -skew-x-12 origin-top-right pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-px left-0 right-0 h-12 bg-white"
        style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-24 sm:pt-24 sm:pb-40">
        {/* Top brand row — empilha em mobile, em linha no desktop */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6 mb-8 sm:mb-10"
          style={fontBody}
        >
          <Image
            src="/wflwr-logo-white.svg"
            alt="Wings for Life World Run"
            width={140}
            height={48}
            priority
            className="h-8 sm:h-12 w-auto"
          />
          <span className="text-white/40 text-lg sm:text-xl">×</span>
          <Image
            src="/Logo_Nova_Somma_Branca_Laranja.svg"
            alt="Somma Running Club"
            width={140}
            height={48}
            priority
            className="h-8 sm:h-12 w-auto"
          />
          <span className="text-white/40 text-lg sm:text-xl">×</span>
          <Image
            src="/RED BULL_ED_MOLHADO_LATA_IR_ABERTA_ILUSTRADA (1) 2.png"
            alt="Red Bull"
            width={48}
            height={96}
            priority
            className="h-10 sm:h-16 w-auto"
          />
        </div>

        {/* Title */}
        <h1
          className="font-normal leading-[0.85] tracking-tight uppercase"
          style={{
            ...fontDisplay,
            fontSize: 'clamp(48px, 13vw, 156px)',
          }}
        >
          Wings <br className="sm:hidden" />
          <span className="text-wfl-red">das</span> Atléticas
        </h1>

        <p
          className="mt-3 sm:mt-6 text-sm sm:text-xl font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white/80"
          style={fontBody}
        >
          Atléticas Day — Wings For Life
        </p>

        {/* Date badge — quebra em duas linhas no mobile */}
        <div className="mt-6 sm:mt-8 inline-block max-w-full">
          <span
            className="block bg-wfl-yellow text-wfl-navy px-3 py-2 sm:px-5 sm:py-3 font-bold text-xs sm:text-base tracking-wider uppercase leading-tight"
            style={fontBody}
          >
            <span className="block sm:inline">02 de maio de 2026</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">Pista de Atletismo — CO UnB</span>
          </span>
        </div>

        {/* Countdown */}
        <div className="mt-8 sm:mt-10 grid grid-cols-4 gap-1.5 sm:gap-4 max-w-xl">
          {[
            { v: t.days, l: 'Dias' },
            { v: t.hours, l: 'Horas' },
            { v: t.mins, l: 'Min' },
            { v: t.secs, l: 'Seg' },
          ].map(({ v, l }) => (
            <div
              key={l}
              className="bg-white/5 border border-white/15 backdrop-blur-sm px-1.5 py-2.5 sm:px-4 sm:py-5 text-center"
            >
              <div
                className="text-2xl sm:text-5xl text-wfl-yellow leading-none tabular-nums"
                style={fontDisplay}
                suppressHydrationWarning
              >
                {mounted ? String(v).padStart(2, '0') : '--'}
              </div>
              <div
                className="mt-1 text-[9px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white/60"
                style={fontBody}
              >
                {l}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={scrollToForm}
          className="mt-8 sm:mt-10 w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-wfl-red hover:bg-wfl-red/90 active:bg-wfl-red/80 text-white px-6 py-4 sm:px-10 sm:py-5 text-sm sm:text-lg font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors"
          style={fontBody}
        >
          Inscreva-se agora
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </section>
  )
}
