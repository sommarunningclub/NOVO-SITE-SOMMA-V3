'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const partners = [
  {
    name: 'Red Bull',
    logo: 'https://cdn.shopify.com/s/files/1/0788/1932/8253/files/RED_BULL_ED_MOLHADO_LATA_IR_ABERTA_ILUSTRADA_1.png?v=1776108610',
    role: 'Patrocinador Oficial',
    description: 'A Red Bull está junto desde o primeiro sinal. Energético gelado pra todo mundo que cruzar a linha de largada — e pra quem ficar de pé até o fim.',
    color: '#CC0000',
    noInvert: true,
    logoClass: 'h-20 sm:h-24',
    url: null,
  },
  {
    name: 'BIG BOX',
    logo: 'https://institucional.bigbox.com.br/wp-content/uploads/2018/09/cropped-logo-1.png',
    role: 'Café da Manhã',
    description: 'O BIG BOX chega com café especial pós-corrida pra você recarregar as energias depois de dar tudo na pista. Porque correr com barriga vazia não é com a gente.',
    color: '#F26522',
    noInvert: true,
    logoClass: 'h-10 sm:h-12',
    url: 'https://www.instagram.com/bigboxsupermercados/',
  },
  {
    name: 'Evolve',
    logo: '/evolve-logo.svg',
    role: 'FitDance no pós-corre',
    description: 'A Evolve toma conta do encerramento com FitDance pra aquecer a galera e animar o pós-treino. Quem disse que corrida não tem música?',
    color: '#df271d',
    noInvert: false,
    logoClass: 'h-8 sm:h-10',
    url: 'https://www.instagram.com/academiaevolve/',
  },
  {
    name: 'Wings for Life World Run',
    logo: '/wfl-logo.svg',
    role: 'Evento Oficial',
    description: 'A maior corrida do mundo acontece no dia 10 de maio de 2026. A gente simula 14 dias antes. Aqui é o seu aquecimento oficial.',
    color: '#fff',
    noInvert: true,
    logoClass: 'h-10 sm:h-12',
    url: null,
  },
  {
    name: 'Estamina Recovery',
    logo: '/estamina_logo.jpg',
    role: 'Recovery',
    description: 'A Estamina Recovery cuida do seu corpo depois do esforço. Recuperação de verdade pra quem treina de verdade.',
    color: '#7b9cc4',
    noInvert: true,
    logoClass: 'h-10 sm:h-12',
    url: 'https://www.instagram.com/estaminarecovery/',
  },
]

const soon: { name: string; role: string }[] = []

export default function PartnersSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="bg-[#080808] py-20 sm:py-28 px-4 border-t border-zinc-900">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 sm:mb-16"
        >
          <p
            className="text-[#F26522] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Parceiros
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-none mb-3"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            Quem faz isso<br />acontecer
          </h2>
          <p
            className="text-zinc-500 text-sm sm:text-base max-w-lg"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Esse evento só existe porque essas marcas acreditaram na ideia. Cada uma traz algo especial pro dia 26.
          </p>
        </motion.div>

        {/* Main partners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {partners.map((partner, i) => {
            const inner = (
              <>
                {/* Color accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to right, ${partner.color}, transparent)` }}
                />
                {/* Logo */}
                <div className="mb-5 h-14 flex items-center">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={`object-contain ${partner.logoClass} ${
                      partner.noInvert ? 'opacity-90' : 'brightness-0 invert opacity-80'
                    } group-hover:opacity-100 transition-opacity duration-300`}
                  />
                </div>
                {/* Role badge */}
                <span
                  className="inline-block text-[10px] uppercase tracking-widest px-2 py-1 mb-3 border"
                  style={{
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                    color: partner.color,
                    borderColor: `${partner.color}40`,
                    background: `${partner.color}10`,
                  }}
                >
                  {partner.role}
                </span>
                {/* Description */}
                <p
                  className="text-zinc-400 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors duration-300"
                  style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  {partner.description}
                </p>
              </>
            )

            const cardClass = "group relative bg-[#111] border border-zinc-800 p-6 sm:p-8 hover:border-zinc-600 transition-colors duration-300 overflow-hidden"

            return (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer" className={cardClass + " block"}>
                    {inner}
                  </a>
                ) : (
                  <div className={cardClass}>{inner}</div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Soon placeholders */}
        {soon.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {soon.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                className="bg-[#0D0D0D] border border-zinc-900 p-5 flex flex-col items-center justify-center gap-2 opacity-30"
              >
                <span
                  className="text-zinc-500 text-xl sm:text-2xl font-black uppercase"
                  style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                >
                  {item.name}
                </span>
                <span
                  className="text-zinc-700 text-[10px] uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  {item.role}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mt-8 text-zinc-700 text-xs"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          Mais parceiros sendo confirmados. Fique de olho.
        </motion.p>
      </div>
    </section>
  )
}
