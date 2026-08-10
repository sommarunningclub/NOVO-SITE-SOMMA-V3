import type { Metadata, Viewport } from 'next'
import { Anton, Barlow } from 'next/font/google'
import { ShakeoutClient } from './ShakeoutClient'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

const display = Anton({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body = Barlow({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-body', display: 'swap' })

const TITLE = 'Shake Out Somma + Centauro RJ | Somma Club'
const DESCRIPTION =
  'Confirme sua participação no Shake Out Somma + Centauro na Casa Dopa Rio durante a semana da Maratona do Rio. Corrida de 6km, recovery, coffee break e sorteios.'
const URL = 'https://www.sommaclub.com.br/shakeout-centauro-somma-rj'
const OG_IMAGE = 'https://www.sommaclub.com.br/og-image.jpg'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Shake Out Somma + Centauro RJ' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
}

export default function Page() {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <ShakeoutClient />
    </div>
  )
}
