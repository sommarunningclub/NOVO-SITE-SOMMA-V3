'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Users, TrendingUp, Car, Hand, Trophy } from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: Users,
    title: 'Todos largam ao mesmo tempo',
    text: 'Um sinal único. Todo mundo parte junto, no mesmo instante. Não importa seu ritmo, sua idade ou experiência. A corrida começa igual para todos.',
  },
  {
    num: '02',
    icon: TrendingUp,
    title: 'Sem linha de chegada',
    text: 'Aqui não existe 5km, 10km ou 42km pré-definidos. Você corre enquanto aguentar. Cada metro conta. O objetivo é simples: ir o mais longe possível.',
  },
  {
    num: '03',
    icon: Car,
    title: 'O Catcher Car entra em campo',
    text: '30 minutos após a largada, o Catcher Car sai atrás de todos. No evento oficial, é um carro. Começa devagar (14 km/h) e vai acelerando progressivamente.',
    highlight: true,
  },
  {
    num: '04',
    icon: Hand,
    title: 'Quando ele te alcança... acabou',
    text: 'Quando o Catcher Car ultrapassa você, sua corrida termina. A distância que você correu é seu resultado final. Simples assim.',
  },
  {
    num: '05',
    icon: Trophy,
    title: 'Vence quem correu mais longe',
    text: 'Não tem tempo pré-definido, não tem medida fixa. O campeão é simplesmente quem ficou mais tempo na frente do Catcher Car.',
  },
]

export default function CatcherCarSteps() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="como-funciona" ref={ref} className="bg-[#0D0D0D] py-20 sm:py-28 px-4 border-t border-zinc-900">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <p
            className="text-[#CC0000] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Entenda a mecânica
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-tight"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            A corrida que não tem fim.
            <br />
            <span className="italic text-[#F26522]">Até você ser pego.</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[27px] sm:left-[35px] top-10 bottom-10 w-px bg-gradient-to-b from-[#F26522] via-[#CC0000] to-zinc-800 opacity-30 hidden sm:block" />

          <div className="flex flex-col gap-8 sm:gap-10">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex gap-5 sm:gap-7 ${step.highlight ? 'relative' : ''}`}
                >
                  {/* Number + Icon badge */}
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className={`w-14 h-14 sm:w-[70px] sm:h-[70px] flex flex-col items-center justify-center border ${
                        step.highlight
                          ? 'bg-[#CC0000] border-[#CC0000]'
                          : 'bg-[#111111] border-zinc-800'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-black leading-none ${step.highlight ? 'text-white/70' : 'text-[#CC0000]'}`}
                        style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                      >
                        {step.num}
                      </span>
                      <Icon className={`w-5 h-5 mt-0.5 ${step.highlight ? 'text-white' : 'text-[#F26522]'}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 py-1 ${
                      step.highlight
                        ? 'border-l-2 border-[#CC0000] pl-5'
                        : ''
                    }`}
                  >
                    <h3
                      className="text-white text-xl sm:text-2xl font-black uppercase mb-2 leading-tight"
                      style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-zinc-400 text-sm sm:text-base leading-relaxed"
                      style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                    >
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
