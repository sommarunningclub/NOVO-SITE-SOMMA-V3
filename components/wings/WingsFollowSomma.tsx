import Image from 'next/image'
import { Instagram, ArrowUpRight } from 'lucide-react'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const INSTAGRAM_URL = 'https://www.instagram.com/somma.club/'

export default function WingsFollowSomma() {
  return (
    <section className="bg-white py-10 sm:py-16 px-4 sm:px-8" style={fontBody}>
      <div className="max-w-4xl mx-auto">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="group block bg-wfl-navy hover:bg-wfl-navy/95 text-white p-5 sm:p-10 transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
            {/* Logo Somma */}
            <div className="flex-shrink-0 bg-white/5 border border-white/10 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-center">
              <Image
                src="/Logo_Nova_Somma_Branca_Laranja.svg"
                alt="Somma Running Club"
                width={140}
                height={48}
                className="h-10 sm:h-14 w-auto"
              />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-wfl-yellow">
                Siga a comunidade
              </p>
              <h3
                className="mt-1 sm:mt-2 text-3xl sm:text-5xl uppercase leading-none break-all"
                style={fontDisplay}
              >
                @somma.club
              </h3>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/70 max-w-md">
                Acompanhe os treinos semanais, eventos e a comunidade de 4.300+
                corredores no Instagram do Somma Club.
              </p>
            </div>

            {/* Ícone CTA */}
            <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 self-end sm:self-center">
              <span
                aria-hidden="true"
                className="w-10 h-10 sm:w-14 sm:h-14 bg-wfl-red text-white flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Instagram className="w-5 h-5 sm:w-7 sm:h-7" />
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold tracking-[0.2em] uppercase text-white/80 group-hover:text-wfl-yellow transition-colors">
                Seguir <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
