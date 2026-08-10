import Image from 'next/image'
import { Music, Trophy, Clock, ExternalLink } from 'lucide-react'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const items = [
  {
    icon: Clock,
    title: 'Horário',
    body: 'Concentração a partir das 08h, largada às 09h de 02 de maio.',
  },
  {
    icon: Music,
    title: 'DJ + Red Bull',
    body: 'Pista sonora durante toda a corrida com energia Red Bull e DJ ao vivo.',
  },
  {
    icon: Trophy,
    title: 'Competição',
    body: 'A atlética com mais participantes presentes leva o troféu Wings das Atléticas.',
  },
] as { icon: typeof Music; title: string; body: string; cta?: { label: string; href: string } }[]

export default function WingsEventInfo() {
  return (
    <section className="bg-white py-12 sm:py-24 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <p
          className="text-[10px] sm:text-sm font-semibold tracking-[0.3em] uppercase text-wfl-red"
          style={fontBody}
        >
          O Evento
        </p>
        <h2
          className="mt-2 text-3xl sm:text-6xl text-wfl-navy leading-none uppercase"
          style={fontDisplay}
        >
          Tudo que você precisa saber
        </h2>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          {items.map(({ icon: Icon, title, body, cta }) => (
            <div
              key={title}
              className="bg-wfl-card border border-wfl-border p-5 sm:p-8 flex flex-col"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-wfl-yellow flex items-center justify-center mb-4 sm:mb-5">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-wfl-navy" strokeWidth={2.5} />
              </div>
              <h3
                className="text-xl sm:text-3xl text-wfl-navy uppercase leading-none"
                style={fontDisplay}
              >
                {title}
              </h3>
              <p
                className="mt-2 sm:mt-3 text-sm sm:text-base text-wfl-dark/80 leading-relaxed flex-1"
                style={fontBody}
              >
                {body}
              </p>
              {cta && (
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 sm:mt-5 inline-flex items-center gap-2 text-sm font-semibold text-wfl-red hover:underline"
                  style={fontBody}
                >
                  {cta.label} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Partners */}
        <div className="mt-12 sm:mt-16 border-t border-wfl-border pt-8 sm:pt-10">
          <p
            className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-wfl-dark/50 text-center"
            style={fontBody}
          >
            Realização
          </p>

          <div className="mt-6 sm:mt-8 bg-wfl-navy py-6 sm:py-8 px-4 sm:px-10">
            <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-16 gap-y-4 sm:gap-y-6">
              <Image
                src="/Logo_Nova_Somma_Branca_Laranja.svg"
                alt="Somma Running Club"
                width={160}
                height={56}
                className="h-10 sm:h-14 w-auto"
              />
              <Image
                src="/RED BULL_ED_LATA_FL_BRANCO_ABERTA.png"
                alt="Red Bull"
                width={56}
                height={112}
                className="h-12 sm:h-20 w-auto"
              />
              <Image
                src="/wflwr-logo-white.svg"
                alt="Wings for Life World Run"
                width={160}
                height={56}
                className="h-10 sm:h-14 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
