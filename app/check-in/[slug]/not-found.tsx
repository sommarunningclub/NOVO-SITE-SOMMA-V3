import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { BarraNav } from '../_components/ios'

export default function CheckInEventoNaoEncontrado() {
  return (
    <main className="flex min-h-[100dvh] flex-col">
      <BarraNav voltar={{ rotulo: 'Eventos', href: '/check-in' }} titulo="Check-in" />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pt-10 text-center sm:px-6">
        <Calendar className="mx-auto h-8 w-8 text-[var(--ck-ter)]" />
        <p className="mt-3 text-[17px] font-semibold">Encontro não encontrado</p>
        <p className="mt-1 text-[15px] text-[var(--ck-sec)]">Esse link não bate com nenhum check-in aberto.</p>
        <Link
          href="/check-in"
          className="ck-toque mt-6 inline-flex h-[44px] items-center justify-center rounded-[12px] bg-white px-5 text-[15px] font-semibold text-black"
        >
          Ver encontros
        </Link>
      </div>
    </main>
  )
}
