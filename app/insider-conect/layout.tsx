import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Insider Connect',
  description: 'Área restrita do SOMMA Insider Connect.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://sommaclub.com.br/insider-conect' },
}

// Mesmo tratamento do /checkout: comportamento "padrão app", sem zoom.
// (o wrapper .insider-app força 16px nos campos no mobile — evita o auto-zoom do iOS)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="insider-app">{children}</div>
}
