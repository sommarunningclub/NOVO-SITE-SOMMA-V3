import type { Metadata, Viewport } from 'next'
import { Anton, Bagel_Fat_One, Barlow_Condensed } from 'next/font/google'
import localFont from 'next/font/local'
import './check-in.css'

/**
 * Fontes das identidades dos parceiros, só para os ingressos da agenda
 * (as mesmas do carrossel de novembro). O resto da página usa a fonte do
 * sistema, que no iPhone é a SF: é ela que faz a página parecer app.
 */
const bagel = Bagel_Fat_One({ subsets: ['latin'], weight: '400', variable: '--font-ck-bagel', display: 'swap' })
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '800', variable: '--font-ck-barlow', display: 'swap' })
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-ck-anton', display: 'swap' })
const altone = localFont({
  src: './fonts/Altone-HeavyOblique.ttf',
  weight: '900',
  style: 'italic',
  variable: '--font-ck-altone',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Check-in dos encontros',
  description:
    'Faça seu check-in nos encontros do SOMMA Running Club. Toda semana no Parque da Cidade, em Brasília.',
  alternates: { canonical: 'https://sommaclub.com.br/check-in' },
  openGraph: {
    title: 'Check-in | SOMMA Running Club',
    description: 'Faça seu check-in nos encontros do SOMMA Running Club em Brasília.',
    url: 'https://sommaclub.com.br/check-in',
    type: 'website',
    locale: 'pt_BR',
  },
}

// viewport-fit=cover libera a área do notch e da barra de início; a página
// devolve esse espaço com env(safe-area-inset-*) onde precisa.
export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  viewportFit: 'cover',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ck ${bagel.variable} ${barlow.variable} ${anton.variable} ${altone.variable}`}>
      {/* O body do site é branco: sem isso, o "quique" do scroll no iOS mostra branco. */}
      <style>{'html,body{background:#000}'}</style>
      {children}
    </div>
  )
}
