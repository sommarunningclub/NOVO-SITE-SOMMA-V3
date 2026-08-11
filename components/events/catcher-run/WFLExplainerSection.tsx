'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Globe, Heart, Flag } from 'lucide-react'

const cards = [
  {
    icon: Globe,
    number: '+195 países',
    title: 'O Evento',
    text: 'O Wings for Life World Run é o maior evento de corrida do mundo. No dia 10 de maio de 2026, milhões correm simultaneamente ao redor do globo pelo mesmo objetivo: financiar pesquisas sobre lesões na medula espinhal.',
  },
  {
    icon: Heart,
    number: '100%',
    title: 'A Causa',
    text: '100% de todas as inscrições e doações vão diretamente para pesquisas de cura para lesões na medula espinhal, pela fundação Wings for Life.',
  },
  {
    icon: Flag,
    number: '1,8M+',
    title: 'A Corrida',
    text: 'Mais de 1,8 milhão de participantes em todo o mundo. Mas tem um detalhe: nessa corrida, não existe linha de chegada. Existe o Catcher Car.',
  },
]

export default function WFLExplainerSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-[#080808] py-20 sm:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="flex justify-center mb-5">
            <img
              src="/wfl-logo.svg"
              alt="Wings for Life World Run"
              className="h-10 sm:h-12 object-contain brightness-0 invert"
            />
          </div>
          <p
            className="text-[#F26522] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            O evento original
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-none"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            O que é o Wings for Life<br />
            <span className="text-[#CC0000]">World Run?</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="group relative bg-[#111111] border border-zinc-800 p-6 sm:p-8 hover:border-[#F26522]/50 transition-colors duration-300 cursor-default"
              >
                {/* Top orange accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F26522] to-[#CC0000] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: '0 0 40px rgba(242,101,34,0.06) inset' }} />

                <Icon className="w-7 h-7 text-[#F26522] mb-4" />

                <p
                  className="text-[#CC0000] text-3xl sm:text-4xl font-black uppercase mb-2 leading-none"
                  style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                >
                  {card.number}
                </p>
                <p
                  className="text-white font-semibold text-sm uppercase tracking-widest mb-3"
                  style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  {card.title}
                </p>
                <p
                  className="text-zinc-400 text-sm leading-relaxed"
                  style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  {card.text}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
