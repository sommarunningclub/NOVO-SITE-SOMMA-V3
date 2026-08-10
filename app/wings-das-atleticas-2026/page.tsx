import Link from 'next/link'
import { Trophy } from 'lucide-react'
import WingsHero from '@/components/wings/WingsHero'
import WingsLocationSection from '@/components/wings/WingsLocationSection'
import WingsEventInfo from '@/components/wings/WingsEventInfo'
import WingsSchedule from '@/components/wings/WingsSchedule'
import WingsCompetition from '@/components/wings/WingsCompetition'
import WingsCadastroEquipe from '@/components/wings/WingsCadastroEquipe'
import WingsAddToCalendar from '@/components/wings/WingsAddToCalendar'
import WingsFollowSomma from '@/components/wings/WingsFollowSomma'

export const dynamic = 'force-dynamic'

const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

export default function WingsPage() {
  return (
    <main className="bg-white text-wfl-dark min-h-screen" style={fontBody}>
      {/* Banner de evento encerrado */}
      <div className="bg-wfl-navy text-white border-b-4 border-wfl-yellow">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg sm:text-xl">🏁</span>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-wfl-yellow font-bold leading-tight">
                Evento encerrado
              </p>
              <p className="text-xs sm:text-sm leading-tight">
                Wings das Atléticas 2026 — realizado em 02/05/2026.
              </p>
            </div>
          </div>
          <Link
            href="/wings/ranking"
            className="inline-flex items-center gap-1.5 bg-wfl-yellow hover:bg-wfl-yellow/90 text-wfl-navy px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] transition-colors flex-shrink-0"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Resultado final
          </Link>
        </div>
      </div>

      <WingsHero />
      <WingsLocationSection />
      <WingsEventInfo />
      <WingsSchedule />
      <WingsCompetition />
      <WingsCadastroEquipe />
      <WingsAddToCalendar />
      <WingsFollowSomma />

      <footer className="bg-wfl-navy text-white/70 py-8 sm:py-10 px-4 sm:px-8" style={fontBody}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs">
          <p className="tracking-[0.2em] uppercase">Somma × Wings for Life × Red Bull</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
            <a
              href="/wings/ranking"
              className="tracking-[0.2em] uppercase text-wfl-yellow hover:text-white transition-colors"
            >
              Resultado final →
            </a>
            <p>© 2026 Somma Running Club</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
