import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CheckInApp } from '../_components/CheckInApp'
import { buscarEventoPublicoPorSlug, lpSegura } from '@/lib/check-in/eventos'
import { decodificaSlug } from '@/lib/check-in/slug'

export const revalidate = 15

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const evento = await buscarEventoPublicoPorSlug(slug)

  if (!evento) {
    return {
      title: 'Encontro não encontrado',
      robots: { index: false, follow: false },
    }
  }

  const url = `https://sommaclub.com.br/check-in/${encodeURIComponent(evento.slug)}`
  const description =
    evento.descricao ||
    `Confirme sua presença em ${evento.titulo}. ${evento.dataFormatada}${evento.horarioInicio ? ` · ${evento.horarioInicio}` : ''}.`

  return {
    title: `Check-in · ${evento.titulo}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${evento.titulo} | Check-in SOMMA`,
      description,
      url,
      type: 'website',
      locale: 'pt_BR',
    },
  }
}

export default async function CheckInEventoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const evento = await buscarEventoPublicoPorSlug(slug)
  if (!evento) notFound()

  if (decodificaSlug(slug) !== evento.slug) {
    redirect(`/check-in/${evento.slug}`)
  }

  const lp = lpSegura(evento.lpUrl)
  if (lp) redirect(lp)

  return <CheckInApp slug={evento.slug} eventoInicial={evento} />
}
