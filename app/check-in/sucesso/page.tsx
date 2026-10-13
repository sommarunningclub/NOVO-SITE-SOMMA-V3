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
    <main className="outubro-rosa min-h-screen bg-[#F4C6D3] text-[#4A0F26] flex flex-col">
      <header className="border-b border-[#EDB4C5] px-6 py-4 flex items-center justify-between gap-3">
        <a href="/" className="inline-flex items-center gap-2 text-[#8A3A5A] hover:text-[#4A0F26] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </a>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF1F8E] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 sm:px-3 py-1 shadow-lg shadow-[#FF1F8E]/30">🎀 Outubro Rosa</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">

          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FF1F8E]/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-[#FF1F8E] rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          <p className="text-[#E6007E] text-xs font-semibold uppercase tracking-widest mb-3">Check-in confirmado</p>
          <h1 className="text-3xl font-bold text-[#4A0F26] mb-3">Você está dentro!</h1>
          <p className="text-[#8A3A5A] text-sm leading-relaxed mb-10">
            Sua vaga para <span className="text-[#4A0F26] font-medium">{nomeEvento}</span> foi reservada.
            {descricao ? ` ${descricao}` : ' Nos vemos lá!'}
          </p>

          {/* Detalhes */}
          <div className="rounded-2xl border border-[#EDB4C5] bg-[#FBE3EA] p-6 text-left space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF1F8E]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#E6007E]" />
              </div>
              <div>
                <p className="text-[#A3567A] text-xs">Data</p>
                <p className="text-[#4A0F26] text-sm font-medium">{dataEvento}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF1F8E]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-[#E6007E]" />
              </div>
              <div>
                <p className="text-[#A3567A] text-xs">Horário</p>
                <p className="text-[#4A0F26] text-sm font-medium">{formatarHorario(horario)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF1F8E]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#E6007E]" />
              </div>
              <div>
                <p className="text-[#A3567A] text-xs">Local</p>
                {localUrl ? (
                  <a
                    href={localUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A0F26] text-sm font-medium hover:text-[#E6007E] underline underline-offset-2 transition-colors"
                  >
                    {local}
                  </a>
                ) : (
                  <p className="text-[#4A0F26] text-sm font-medium">{local}</p>
                )}
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-[#FF1F8E]/10 border border-[#FF1F8E]/30 rounded-xl p-4 mb-8 text-left">
            <p className="text-[#E6007E] text-xs font-semibold uppercase tracking-wide mb-1">Importante</p>
            <p className="text-[#8A3A5A] text-sm leading-relaxed">
              Salve o seu CPF cadastrado ou tire um print desta tela. Ele será usado para identificar sua presença no evento.
            </p>
          </div>

          {/* Link de localização */}
          {localUrl && (
            <a
              href={localUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-[#FF1F8E] hover:bg-[#FF1F8E]/10 text-[#E6007E] hover:text-[#E6007E] font-semibold py-3 rounded-xl text-center transition-all duration-200 text-sm mb-3"
            >
              Ver localização no mapa
            </a>
          )}


          <a
            href="/"
            className="block w-full border border-[#E49FB6] hover:border-[#FF1F8E] text-[#6B2240] hover:text-[#4A0F26] font-semibold py-4 rounded-xl text-center transition-all duration-200 text-sm"
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
    <Suspense fallback={<div className="min-h-screen bg-[#F4C6D3]" />}>
      <CheckInSucessoContent />
    </Suspense>
  )
}
