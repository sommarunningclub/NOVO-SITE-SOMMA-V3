import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import WingsLocationMap from './WingsLocationMap'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const MAPS_URL = 'https://maps.app.goo.gl/8hLYd9ULSM76Ffeh8'

export default function WingsLocationSection() {
  return (
    <section className="bg-wfl-navy text-white py-12 sm:py-24 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start sm:items-end justify-between flex-wrap gap-4 mb-6 sm:mb-8">
          <div>
            <p
              className="text-[10px] sm:text-sm font-semibold tracking-[0.3em] uppercase text-wfl-yellow"
              style={fontBody}
            >
              Onde acontece
            </p>
            <h2
              className="mt-2 text-4xl sm:text-6xl uppercase leading-none"
              style={fontDisplay}
            >
              Local
            </h2>
          </div>

          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-wfl-red hover:bg-wfl-red/90 text-white px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors"
            style={fontBody}
          >
            <Navigation className="w-4 h-4" /> Como chegar
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Mapa — altura adaptável: menor mobile, alta desktop */}
          <div className="lg:col-span-2 bg-wfl-navy border border-white/10 overflow-hidden h-[280px] sm:h-[400px] lg:h-[480px]">
            <WingsLocationMap height="100%" />
          </div>

          {/* Card de info */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-5 sm:p-8 flex flex-col" style={fontBody}>
            <div className="w-12 h-12 bg-wfl-yellow flex items-center justify-center mb-5">
              <MapPin className="w-6 h-6 text-wfl-navy" strokeWidth={2.5} />
            </div>

            <h3
              className="text-3xl sm:text-4xl uppercase leading-none text-wfl-yellow"
              style={fontDisplay}
            >
              Pista de Atletismo
            </h3>
            <p className="mt-1 text-base sm:text-lg text-white/90">
              Centro Olímpico — CO UnB · Brasília, DF
            </p>

            <div className="mt-6 space-y-3 text-sm text-white/70 flex-1">
              <p>
                Estacionamento gratuito no campus. Linha de ônibus interna do
                metrô Ceilândia / Asa Norte chega direto ao Centro Olímpico.
              </p>
              <p className="text-white/60">
                Concentração a partir das <span className="text-wfl-yellow font-semibold">08h</span>.
                Largada oficial às <span className="text-wfl-yellow font-semibold">09h</span> de
                02 de maio de 2026.
              </p>
            </div>

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-wfl-yellow hover:underline"
            >
              Abrir no Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
