import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans } from 'next/font/google'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans-wfl',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wings das Atléticas 2026 | Atléticas Day — Wings For Life',
  description:
    'Inscreva sua atlética no Atléticas Day — Wings For Life — 02 de maio de 2026, Pista de Atletismo CO UnB, Brasília. Somma × Wings for Life × Red Bull.',
  alternates: { canonical: 'https://sommaclub.com.br/wings-das-atleticas-2026' },
  openGraph: {
    title: 'Wings das Atléticas 2026',
    description: 'Atléticas Day — Wings For Life — UnB e CEUB no Centro Olímpico.',
    url: 'https://sommaclub.com.br/wings-das-atleticas-2026',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wings das Atléticas 2026',
    description: 'Atléticas Day — Wings For Life — 02 de maio de 2026, Pista de Atletismo CO UnB.',
  },
}

export default function WingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bebas.variable} ${dmSans.variable}`}>
      {children}
    </div>
  )
}
