import type { Metadata } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Catcher Run Brasília 2026 | Somma × Red Bull | Simulação Wings for Life',
  description:
    'O Somma Running Club e a Red Bull simulam o Wings for Life World Run na 106 Sul em Brasília. 26 de abril, largada 07h30. Inscrição gratuita. Você consegue fugir do Catcher Car?',
  openGraph: {
    title: 'Catcher Run Brasília 2026 | Somma × Red Bull',
    description:
      'Simulação do Wings for Life World Run. 26/04 • 106 Sul, Brasília • Gratuito',
    images: [
      {
        url: 'https://cdn.shopify.com/s/files/1/0788/1932/8253/files/PDCSK21FEV-1794.jpg',
        width: 1200,
        height: 630,
        alt: 'Catcher Run Brasília 2026 | Somma × Red Bull',
      },
    ],
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catcher Run Brasília 2026 | Somma × Red Bull',
    description: 'Simulação do Wings for Life World Run. 26/04 • 106 Sul, Brasília • Gratuito',
  },
  keywords: [
    'Wings for Life World Run',
    'Somma Running Club',
    'Red Bull',
    'Brasília',
    'corrida',
    '106 Sul',
    'Catcher Car',
    'corrida Brasília 2026',
  ],
}

export default function CatcherRunLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${barlowCondensed.variable} ${dmSans.variable}`}>
      {children}
    </div>
  )
}
