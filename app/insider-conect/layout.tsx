import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insider Connect',
  description: 'Área restrita do SOMMA Insider Connect.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://sommaclub.com.br/insider-conect' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
