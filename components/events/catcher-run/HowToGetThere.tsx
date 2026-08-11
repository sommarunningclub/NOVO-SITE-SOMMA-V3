'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Train, Car, MapPin, FootprintsIcon, ParkingSquare, Navigation } from 'lucide-react'

type Mode = 'metro' | 'carro'

const metroSteps = [
  {
    icon: Train,
    label: 'Embarque no Metrô',
    detail: 'Pegue o metrô no sentido Central. Desça na estação 106 Sul.',
    time: null,
    color: '#F26522',
  },
  {
    icon: FootprintsIcon,
    label: 'Caminhada de ~5 minutos',
    detail: 'Da saída da estação, caminhe pela W3 Sul até a 106 Sul. São poucos minutos a pé.',
    time: '~5 min a pé',
    color: '#fff',
  },
  {
    icon: MapPin,
    label: 'Chegou! Local do evento',
    detail: 'Concentração às 06h30. Largada às 07h30. Procure a estrutura do Somma Running Club.',
    time: '06h30',
    color: '#CC0000',
    accent: true,
  },
]

const carroSteps = [
  {
    icon: Car,
    label: 'Siga para a 106 Sul',
    detail: 'Entre pela Asa Sul via Eixo Rodoviário Sul (Epia) ou pelo Eixão do Lazer.',
    time: null,
    color: '#F26522',
  },
  {
    icon: ParkingSquare,
    label: 'Estacione na SQS 106',
    detail: 'Há estacionamento gratuito nas quadras internas da 106 Sul e na via L2 Sul. Chegando cedo você encontra vaga fácil.',
    time: 'Gratuito',
    color: '#F26522',
  },
  {
    icon: FootprintsIcon,
    label: 'Caminhada curta',
    detail: 'Do estacionamento até o ponto de encontro são poucos minutos a pé. Siga os participantes com número de peito.',
    time: '~3 min a pé',
    color: '#fff',
  },
  {
    icon: MapPin,
    label: 'Chegou! Local do evento',
    detail: 'Concentração às 06h30. Largada às 07h30. Procure a estrutura do Somma Running Club.',
    time: '06h30',
    color: '#CC0000',
    accent: true,
  },
]

function StepItem({ step, index, active, total }: { step: typeof metroSteps[0], index: number, active: boolean, total: number }) {
  const Icon = step.icon
  const isLast = index === total - 1

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-4"
    >
      {/* Icon + line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
            step.accent ? 'bg-[#CC0000]' : 'bg-[#1A1A1A] border border-zinc-700'
          }`}
        >
          <Icon className="w-4 h-4" style={{ color: step.accent ? '#fff' : step.color }} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1 min-h-[32px]" style={{ background: 'linear-gradient(to bottom, rgba(242,101,34,0.3), rgba(242,101,34,0.05))' }} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p
            className="text-white font-black text-sm sm:text-base uppercase"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            {step.label}
          </p>
          {step.time && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 ${
                step.accent
                  ? 'bg-[#CC0000]/20 text-[#CC0000]'
                  : 'bg-[#F26522]/10 text-[#F26522]'
              }`}
            >
              {step.time}
            </span>
          )}
        </div>
        <p
          className="text-zinc-400 text-xs sm:text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          {step.detail}
        </p>
      </div>
    </motion.div>
  )
}

export default function HowToGetThere() {
  const [mode, setMode] = useState<Mode>('metro')
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (inView) setVisible(true)
  }, [inView])

  // Reset animation on tab change
  const [key, setKey] = useState(0)
  const handleMode = (m: Mode) => {
    setMode(m)
    setKey(k => k + 1)
  }

  const steps = mode === 'metro' ? metroSteps : carroSteps

  return (
    <section ref={ref} className="bg-[#0D0D0D] py-20 sm:py-28 px-4 border-t border-zinc-900">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-14"
        >
          <p
            className="text-[#F26522] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Como chegar
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-none mb-3"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            Chegando na 106 Sul
          </h2>
          <p
            className="text-zinc-400 text-sm sm:text-base max-w-lg"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            A concentração começa às 06h30 e a largada é às 07h30. Planeje seu trajeto com antecedência. A estação de metrô 106 Sul é a mais próxima do evento.
          </p>
        </motion.div>

        {/* Mode tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex gap-2 mb-10"
        >
          {([
            { id: 'metro', icon: Train, label: 'De Metrô' },
            { id: 'carro', icon: Car, label: 'De Carro' },
          ] as const).map(tab => {
            const Icon = tab.icon
            const active = mode === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleMode(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-[#F26522] text-white'
                    : 'bg-[#1A1A1A] border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </motion.div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <div key={key} className="space-y-0">
            {steps.map((step, i) => (
              <StepItem key={i} step={step} index={i} active={visible} total={steps.length} />
            ))}
          </div>
        </AnimatePresence>

        {/* CTA maps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <p
            className="text-zinc-600 text-[10px] uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Abrir no seu app favorito
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Google Maps */}
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=-15.8140469,-47.8968315"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 bg-[#1A1A1A] border border-zinc-700 hover:border-[#4285F4] hover:bg-[#4285F4]/5 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-3.5 transition-all duration-200 cursor-pointer flex-1"
              style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            >
              <img
                src="https://cdn.simpleicons.org/googlemaps/4285F4"
                alt="Google Maps"
                className="w-4 h-4 flex-shrink-0"
              />
              Google Maps
            </a>

            {/* Waze */}
            <a
              href="https://waze.com/ul?ll=-15.8140469,-47.8968315&navigate=yes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 bg-[#1A1A1A] border border-zinc-700 hover:border-[#33CCFF] hover:bg-[#33CCFF]/5 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-3.5 transition-all duration-200 cursor-pointer flex-1"
              style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            >
              <img
                src="https://cdn.simpleicons.org/waze/33CCFF"
                alt="Waze"
                className="w-4 h-4 flex-shrink-0"
              />
              Waze
            </a>

            {/* Apple Maps */}
            <a
              href="https://maps.apple.com/?daddr=-15.8140469,-47.8968315&dirflg=d"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 bg-[#1A1A1A] border border-zinc-700 hover:border-zinc-400 hover:bg-zinc-400/5 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-3.5 transition-all duration-200 cursor-pointer flex-1"
              style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            >
              <img
                src="https://cdn.simpleicons.org/apple/ffffff"
                alt="Apple Maps"
                className="w-4 h-4 flex-shrink-0"
              />
              Apple Maps
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
