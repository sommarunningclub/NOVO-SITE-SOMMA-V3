import type { Metadata } from 'next'

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

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
