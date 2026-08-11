'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Zap, User, BarChart2, Gift } from 'lucide-react'

const cards = [
  {
    icon: Zap,
    label: 'Largada',
    time: '07h30',
    text: 'Todo mundo larga junto no mesmo instante, organizado por pelotão. Primeiro o Ritmo Avançado, depois o Moderado e por último o Iniciante.',
  },
  {
    icon: User,
    label: 'O Catcher Car Saiu',
    time: '07h50',
    text: 'Alexandre Alves começa a correr atrás de todos. Ele sai devagar e vai acelerando. Quando te alcançar: acabou.',
    highlight: true,
  },
  {
    icon: BarChart2,
    label: 'Último Corredor Alcançado',
    time: '09h00',
    text: 'Fim da corrida. A distância que você correu antes de ser tocado é o seu resultado. Ranking revelado na hora.',
  },
  {
    icon: Gift,
    label: 'Pós-corre',
    time: '09h15+',
    text: 'Premiação, Red Bull pra todo mundo, café da manhã com BIG BOX e FitDance com a Evolve aquecendo a galera.',
  },
]

export default function EventSimulationSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="bg-[#080808] py-20 sm:py-28 px-4 border-t border-zinc-900">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-[#F26522] text-xs uppercase tracking-[0.3em] mb-3"
              style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
            >
              Somma Day especial
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-tight mb-6"
              style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            >
              O último Somma Day<br />
              de abril vai ser<br />
              <span className="text-[#CC0000]">diferente.</span>
            </h2>
            <p
              className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-5"
              style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
            >
              No dia 26 de abril, o nosso Somma Day de encerramento do mês
              vira palco de um evento especial com a Red Bull. Em vez de uma corrida
              comum, a gente vai simular o maior evento de corrida do mundo — o
              Wings for Life World Run.
            </p>
            <p
              className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-4"
              style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
            >
              Mesma energia de todo sábado na 106 Sul, mas com uma dinâmica que
              você nunca viveu: sem linha de chegada, sem tempo definido,
              com um Catcher Car humano atrás de você.
            </p>
            <p
              className="text-zinc-300 text-sm sm:text-base leading-relaxed"
              style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
            >
              Largada simultânea. Sem app. Sem tecnologia.<br />
              <strong className="text-white">100% presencial, 100% na raça.</strong>
            </p>

            {/* Photo */}
            <div className="relative mt-8 overflow-hidden">
              <img
                src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/PDCSK21FEV-1794.jpg"
                alt="Parque da Cidade com corredores"
                className="w-full h-48 sm:h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/60 to-transparent" />
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F26522] to-[#CC0000]"
              />
            </div>
          </motion.div>

          {/* Right: cards */}
          <div className="flex flex-col gap-4">
            {cards.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, x: 32 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`bg-[#1A1A1A] border-l-2 p-4 sm:p-5 ${
                    card.highlight ? 'border-[#CC0000]' : 'border-[#F26522]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${card.highlight ? 'text-[#CC0000]' : 'text-[#F26522]'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-white font-black text-sm uppercase"
                          style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                        >
                          {card.label}
                        </span>
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 ${
                            card.highlight ? 'bg-[#CC0000]/20 text-[#CC0000]' : 'bg-[#F26522]/10 text-[#F26522]'
                          }`}
                        >
                          {card.time}
                        </span>
                      </div>
                      <p
                        className="text-zinc-400 text-sm leading-relaxed"
                        style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                      >
                        {card.text}
                      </p>
                    </div>
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
