'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const WFL_BRASILIA_URL = 'https://www.wingsforlifeworldrun.com/pt-br/locations/brasilia-esplanada'

export default function WingsFloatingCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total <= 0) return
      const ratio = scrolled / total
      setVisible(ratio >= 0.15)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={WFL_BRASILIA_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Inscreva-se na corrida Wings for Life World Run — Brasília"
      className={`fixed z-40 bottom-3 right-3 sm:bottom-8 sm:right-8 group transition-all duration-500 max-w-[calc(100vw-1.5rem)] ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <span className="relative flex items-center gap-2 sm:gap-3 bg-wfl-red hover:bg-wfl-red/90 text-white pl-2 pr-3 py-2 sm:pl-3 sm:pr-5 sm:py-3 shadow-2xl shadow-wfl-red/30">
        {/* Pulse ring */}
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-sm border-2 border-wfl-red animate-ping opacity-40"
        />
        <span className="relative flex items-center gap-2 sm:gap-3">
          <span className="bg-white p-1 sm:p-1.5 flex items-center justify-center flex-shrink-0">
            <Image
              src="/wflwr-logo-pos.CJlzM-_-.svg"
              alt=""
              width={32}
              height={32}
              className="h-5 sm:h-8 w-auto"
            />
          </span>
          <span
            className="font-bold tracking-wider uppercase text-[10px] sm:text-sm leading-tight"
            style={{ fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }}
          >
            <span className="block text-wfl-yellow">Inscreva-se na</span>
            <span className="block">Wings for Life Run</span>
          </span>
        </span>
      </span>
    </a>
  )
}
