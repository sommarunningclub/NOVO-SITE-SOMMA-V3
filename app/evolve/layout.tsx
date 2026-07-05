import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SOMMA Evolve',
  description:
    'Conheça o SOMMA Evolve, o programa de evolução e performance do SOMMA Running Club em Brasília.',
  alternates: { canonical: 'https://sommaclub.com.br/evolve' },
  openGraph: {
    title: 'SOMMA Evolve | SOMMA Running Club',
    description: 'Programa de evolução e performance do SOMMA Running Club em Brasília.',
    url: 'https://sommaclub.com.br/evolve',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
