'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { MapPin, Navigation } from 'lucide-react'

export default function MapSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="bg-[#080808] py-20 sm:py-28 px-4 border-t border-zinc-900">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <p
            className="text-[#F26522] text-xs uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Localização
          </p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white leading-none mb-3"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            106 Sul
          </h2>
          <p
            className="text-zinc-400 text-sm sm:text-base"
            style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            106 Sul, Brasília DF
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          {/* Map embed */}
          <div className="relative w-full overflow-hidden border border-zinc-800" style={{ height: 'clamp(300px, 45vw, 480px)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d230!2d-47.8968315!3d-15.8140469!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTXCsDQ4JzUwLjYiUyA0N8KwNTMnNDguNiJX!5e1!3m2!1spt-BR!2sbr!4v1713200000000"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.3) brightness(0.7)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="106 Sul, Brasília DF"
            />
            {/* Dark overlay on edges */}
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px 20px rgba(8,8,8,0.6)' }} />
          </div>

          {/* Info bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#111] border border-zinc-800 border-t-0 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#F26522]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#F26522]" />
              </div>
              <div>
                <p
                  className="text-white font-bold text-sm uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                >
                  106 Sul, Brasília DF
                </p>
                <p
                  className="text-zinc-500 text-xs mt-0.5"
                  style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  106 Sul · Brasília, DF · 26 de abril · Concentração 06h30, largada 07h30
                </p>
              </div>
            </div>
            <a
              href="https://www.google.com/maps/place//@-15.8139033,-47.8967623,230m/data=!3m1!1e3!4m6!1m5!3m4!2zMTXCsDQ4JzUwLjYiUyA0N8KwNTMnNDguNiJX!8m2!3d-15.8140469!4d-47.8968315?hl=pt-BR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#CC0000] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-5 py-3 transition-colors duration-200 cursor-pointer flex-shrink-0"
              style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            >
              <Navigation className="w-4 h-4" />
              Abrir no Maps
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
