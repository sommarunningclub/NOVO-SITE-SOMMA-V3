'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin } from 'lucide-react'

function CheckInSucessoContent() {
  const searchParams = useSearchParams()
  const dataEvento = searchParams.get('data') || ''
  const nomeEvento = searchParams.get('evento') || ''
  const horario = searchParams.get('horario') || '07:00'
  const local = searchParams.get('local') || 'Parque da Cidade — Brasília, DF'
  const localUrl = searchParams.get('local_url') || ''
  const descricao = searchParams.get('descricao') || ''
  const pelotao = searchParams.get('pelotao') || ''
  const pelotaoLabel = searchParams.get('pelotao_label') || ''

  const formatarHorario = (h: string) => {
    const [hr, min] = h.split(':')
    return `A partir das ${hr}h${min === '00' ? '00' : min}`
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4">
        <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">

          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">Check-in confirmado</p>
          <h1 className="text-3xl font-bold text-white mb-3">Você está dentro!</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-10">
            Sua vaga para <span className="text-white font-medium">{nomeEvento}</span> foi reservada.
            {descricao ? ` ${descricao}` : ' Nos vemos lá!'}
          </p>

          {/* Detalhes */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Data</p>
                <p className="text-white text-sm font-medium">{dataEvento}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Horário</p>
                <p className="text-white text-sm font-medium">{formatarHorario(horario)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Local</p>
                {localUrl ? (
                  <a
                    href={localUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-sm font-medium hover:text-orange-400 underline underline-offset-2 transition-colors"
                  >
                    {local}
                  </a>
                ) : (
                  <p className="text-white text-sm font-medium">{local}</p>
                )}
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-orange-950/40 border border-primary/30 rounded-xl p-4 mb-8 text-left">
            <p className="text-orange-300 text-xs font-semibold uppercase tracking-wide mb-1">Importante</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Salve o seu CPF cadastrado ou tire um print desta tela. Ele será usado para identificar sua presença no evento.
            </p>
          </div>

          {/* Link de localização */}
          {localUrl && (
            <a
              href={localUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-primary hover:bg-primary/10 text-primary hover:text-orange-400 font-semibold py-3 rounded-xl text-center transition-all duration-200 text-sm mb-3"
            >
              Ver localização no mapa
            </a>
          )}


          <a
            href="/"
            className="block w-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold py-4 rounded-xl text-center transition-all duration-200 text-sm"
          >
            Voltar ao site
          </a>
        </div>
      </div>
    </main>
  )
}

export default function CheckInSucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CheckInSucessoContent />
    </Suspense>
  )
}
