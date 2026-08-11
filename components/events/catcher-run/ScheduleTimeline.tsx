'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Tent, Footprints, Coffee, Dumbbell, Megaphone, Flag, AlertTriangle, Wind, Trophy, PartyPopper, Music, CheckCircle } from 'lucide-react'
import { TracingBeam } from '@/components/ui/tracing-beam'

const schedule = [
  { time: '06:00', icon: Tent,          label: 'Abertura & Estrutura',        text: 'Parceiros montados, Red Bull station ativa.', accent: false },
  { time: '06:30', icon: Footprints,    label: 'Concentração e Recepção',     text: 'Chegada dos participantes, credenciamento e distribuição de número de peito.', accent: false },
  { time: '07:00', icon: Dumbbell,      label: 'Aquecimento Coletivo',        text: 'Guiado pela equipe Somma. Todo mundo junto.', accent: false },
  { time: '07:15', icon: Megaphone,     label: 'Briefing Oficial',            text: 'Regras explicadas. Alexandre Alves é apresentado como o Catcher Car. Percurso revelado.', accent: false },
  { time: '07:30', icon: Flag,          label: 'LARGADA!',                    text: 'Todos saem ao mesmo tempo, organizados por pelotão. Primeiro sai o Ritmo Avançado (8km), depois o Ritmo Moderado (6km) e por último o Ritmo Iniciante (4km). Escolha o pelotão que combina com o seu ritmo na hora da inscrição.', accent: 'orange' },
  { time: '07:50', icon: AlertTriangle, label: 'CATCHER CAR SAIU!',           text: '20 minutos após a largada, Alexandre Alves começa a correr atrás de todos. Ele começa devagar e vai acelerando. Quando te alcançar, sua corrida acabou. A distância que você percorreu é o seu resultado.', accent: 'red' },
  { time: '08:00', icon: Wind,          label: 'Corrida em Andamento',        text: 'Eliminações progressivas. Tensão total.', accent: false },
  { time: '09:00', icon: Trophy,        label: 'Último Corredor Alcançado',   text: 'Fim da corrida. Ranking revelado.', accent: 'orange' },
  { time: '09:15', icon: PartyPopper,   label: 'Premiação & Celebração',      text: 'Top corredores reconhecidos. Red Bull para todos.', accent: false },
  { time: '09:30', icon: Coffee,        label: 'Café da Manhã com BIG BOX',   text: 'Café especial pós corrida pra recarregar as energias.', accent: false },
  { time: '10:00', icon: Music,         label: 'FitDance com Evolve',         text: 'Encerramento animado. Música, energia e descontração.', accent: false },
  { time: '11:00', icon: CheckCircle,   label: 'Fim do Evento',               text: 'Até a próxima!', accent: false },
]

export default function ScheduleTimeline() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="bg-[#0D0D0D] py-20 sm:py-28 px-4 border-t border-zinc-900">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p
            className="text-[#F26522] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            26 de abril de 2026
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-none"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            O que vai rolar no dia
          </h2>
        </motion.div>

        <TracingBeam className="px-2 sm:px-6">
          <div className="flex flex-col gap-0">
            {schedule.map((item, i) => {
              const Icon = item.icon
              const isAccentOrange = item.accent === 'orange'
              const isAccentRed = item.accent === 'red'
              const isAccent = isAccentOrange || isAccentRed

              return (
                <motion.div
                  key={item.time}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex gap-4 sm:gap-5 py-5 sm:py-6 ${i < schedule.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
                >
                  {/* Time */}
                  <div
                    className="w-[48px] sm:w-[56px] flex-shrink-0 text-right text-xs font-mono pt-[3px]"
                    style={{
                      color: isAccentOrange ? '#F26522' : isAccentRed ? '#CC0000' : '#52525b',
                      fontFamily: 'var(--font-dm-sans, sans-serif)',
                    }}
                  >
                    {item.time}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 relative z-10 mt-[2px]">
                    <div
                      className={`w-7 h-7 flex items-center justify-center ${
                        isAccentOrange
                          ? 'bg-[#F26522]'
                          : isAccentRed
                          ? 'bg-[#CC0000]'
                          : 'bg-[#1A1A1A] border border-zinc-800'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isAccent ? 'text-white' : 'text-zinc-500'}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-black text-sm sm:text-base uppercase leading-tight mb-0.5 ${
                        isAccentOrange ? 'text-[#F26522]' : isAccentRed ? 'text-[#CC0000]' : 'text-white'
                      }`}
                      style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-zinc-500 text-xs sm:text-sm leading-relaxed"
                      style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                    >
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </TracingBeam>
      </div>
    </section>
  )
}
