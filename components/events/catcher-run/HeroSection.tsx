'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Clock, ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import CountdownTimer from './CountdownTimer'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: delay + 1.6, ease: [0.22, 1, 0.36, 1] as const },
})

const titleLines = [
  { text: 'VOCÊ', color: '#fff', style: 'normal' as const },
  { text: 'CONSEGUE', color: '#fff', style: 'normal' as const },
  { text: 'FUGIR DO', color: '#F26522', style: 'normal' as const },
  { text: 'CATCHER', color: '#fff', style: 'italic' as const },
  { text: 'CAR?', color: '#CC0000', style: 'italic' as const },
]

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const titleSlideIn = useCallback(() => {
    if (!titleRef.current) return
    const words = titleRef.current.querySelectorAll('.hero-word')
    words.forEach((word, wi) => {
      const chars = word.querySelectorAll('.hero-char')
      chars.forEach((char, ci) => {
        gsap.fromTo(
          char,
          { opacity: 0, x: 80 },
          {
            opacity: 1,
            x: 0,
            ease: 'elastic.out(1.1, 0.7)',
            duration: 1.2,
            delay: 0.3 + wi * 0.15 + ci * 0.025,
          }
        )
      })
    })
  }, [])

  useEffect(() => {
    const blob = blobRef.current
    const section = sectionRef.current
    if (!blob || !section) return

    // Blob rotation
    const tl = gsap.timeline({ repeat: -1, ease: 'none' })
    tl.to(blob, { rotation: 180, scaleX: 1.6, duration: 8.5 })
      .to(blob, { rotation: 360, scaleX: 1, duration: 8.5 })

    // Mouse follow
    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      if (e.clientY > rect.bottom || e.clientY < rect.top) return
      gsap.to(blob, { left: e.clientX, top: e.clientY - rect.top, duration: 2, ease: 'power2.out' })
    }
    window.addEventListener('mousemove', onMove)

    // Title animation
    titleSlideIn()

    return () => {
      window.removeEventListener('mousemove', onMove)
      tl.kill()
    }
  }, [titleSlideIn])

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex flex-col overflow-hidden bg-[#0a0a0a]">

      {/* === LAYER 0: Image background === */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://img.redbull.com/images/c_crop,x_0,y_0,h_4000,w_6000/c_fill,w_2200,h_1467/q_auto:low,f_jpg/redbullcom/2025/5/5/vvdfr8kkjllrmsife5uf/corrida-wings-for-life-2025-brasilia-duda-ana-patricia-brasil"
          alt="Wings for Life World Run Brasília"
          className="w-full h-full object-cover object-center"
        />
        {/* Soft dark overlays */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-transparent to-transparent" style={{ height: '35%' }} />
      </div>

      {/* === LAYER 1: Blob + Blur === */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div
          ref={blobRef}
          className="absolute"
          style={{
            height: '34vmax',
            aspectRatio: '1',
            background: 'linear-gradient(135deg, #7a3300, #CC0000, #F26522)',
            borderRadius: '50%',
            opacity: 0.5,
            left: '50%',
            top: '50%',
            translate: '-50% -50%',
            willChange: 'transform, left, top',
          }}
        />
        <div className="absolute inset-0" style={{ backdropFilter: 'blur(6vmax)', WebkitBackdropFilter: 'blur(6vmax)' }} />
      </div>

      {/* === LAYER 2: Grain === */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.035] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '180px' }}
      />

      {/* === Top brand bar === */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-4 sm:pt-5 px-4 sm:px-8 flex justify-center">
        <div
          className="flex items-center justify-center gap-3 sm:gap-8 flex-wrap"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.06) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderTop: '1px solid rgba(255,255,255,0.20)',
            borderRadius: '999px',
            padding: '8px 20px 10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <motion.img src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png" alt="Somma Running Club" className="h-4 sm:h-7 object-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(242,101,34,0.4))' }} />
          <span className="text-zinc-600 text-xs sm:text-base font-thin select-none">×</span>
          <motion.img src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/RED_BULL_ED_MOLHADO_LATA_IR_ABERTA_ILUSTRADA_1.png?v=1776108610" alt="Red Bull" className="object-contain" style={{ height: 'clamp(36px, 7vw, 70px)', filter: 'drop-shadow(0 0 10px rgba(204,0,0,0.4))' }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />
          <span className="text-zinc-600 text-xs sm:text-base font-thin select-none">×</span>
          <motion.img src="/wfl-logo.svg" alt="Wings for Life World Run" className="h-4 sm:h-8 object-contain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(204,0,0,0.3))' }} />
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-28 sm:pt-32 pb-32 sm:pb-28">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-[#F26522] text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-5 sm:mb-6"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          Somma × Red Bull Apresentam
        </motion.p>

        {/* Title */}
        <div ref={titleRef} className="flex flex-col items-center mb-6 sm:mb-8">
          {titleLines.map((line, wi) => (
            <div
              key={wi}
              className="hero-word flex justify-center overflow-hidden"
              style={{
                fontFamily: 'var(--font-barlow-condensed, sans-serif)',
                color: line.color,
                fontSize: 'clamp(3.2rem, 12vw, 10rem)',
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: '-0.03em',
                fontStyle: line.style,
              }}
            >
              {line.text.split('').map((ch, ci) => (
                <span
                  key={ci}
                  className="hero-char inline-block"
                  style={{ opacity: 0, minWidth: ch === ' ' ? '0.25em' : undefined }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0)}
          className="text-zinc-300/70 text-xs sm:text-base max-w-lg text-center leading-relaxed mb-6"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          O Somma Day de abril vai ser especial. A Red Bull chega na 106 Sul pra
          transformar o nosso sábado numa simulação do Wings for Life World Run.
          Café da manhã com BIG BOX, pós-treino animado com a Evolve no FitDance e muito mais parceiros te esperando.
        </motion.p>

        {/* Event details */}
        <motion.div {...fadeUp(0.1)} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-6 sm:mb-8">
          {[
            { icon: Calendar, text: '26 de Abril de 2026' },
            { icon: Clock, text: 'Concentração 06h30, largada 07h30' },
            { icon: MapPin, text: '106 Sul, Brasília DF' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-zinc-400 text-[11px] sm:text-sm" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F26522] flex-shrink-0" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* Countdown */}
        <motion.div {...fadeUp(0.2)} className="mb-7 sm:mb-8">
          <CountdownTimer />
        </motion.div>

        {/* CTAs */}
        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <button
            onClick={() => scrollTo('inscricao')}
            className="bg-zinc-800 text-zinc-400 font-black text-sm sm:text-lg px-7 py-3.5 sm:py-4 uppercase tracking-wider cursor-not-allowed border border-zinc-700"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            disabled
          >
            Inscrições encerradas
          </button>
          <button
            onClick={() => scrollTo('como-funciona')}
            className="border-2 border-white/80 text-white font-black text-sm sm:text-lg px-7 py-3.5 sm:py-4 uppercase tracking-wider hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            Entenda o Evento ↓
          </button>
        </motion.div>

        <motion.p
          {...fadeUp(0.4)}
          className="mt-3 text-zinc-600 text-[10px] sm:text-xs uppercase tracking-[0.2em]"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          Inscrições encerradas · 26 de abril
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
          <ChevronDown className="w-5 h-5 text-white/20" />
        </motion.div>
      </div>

      {/* Bottom hard fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent z-[3] pointer-events-none" />
    </section>
  )
}
