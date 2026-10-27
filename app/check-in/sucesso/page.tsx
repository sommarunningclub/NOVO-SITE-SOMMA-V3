'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Calendar, Check, Clock, MapPin, Users } from 'lucide-react'
import { BarraNav, Grupo, IconeQuadrado, Linha } from '../_components/ios'

function CheckInSucessoContent() {
  const searchParams = useSearchParams()
  const dataEvento = searchParams.get('data') || ''
  const nomeEvento = searchParams.get('evento') || ''
  const horario = searchParams.get('horario') || '07:00'
  const local = searchParams.get('local') || 'Parque da Cidade, Brasília, DF'
  const localUrl = searchParams.get('local_url') || ''
  const descricao = searchParams.get('descricao') || ''
  const pelotao = searchParams.get('pelotao') || ''
  const pelotaoLabel = searchParams.get('pelotao_label') || ''

  const formatarHorario = (h: string) => {
    const [hr, min] = h.split(':')
    return `A partir das ${hr}h${min === '00' ? '00' : min}`
  }

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <BarraNav voltar={{ rotulo: 'Eventos', href: '/check-in' }} titulo="Confirmado" />

      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(32px+var(--ck-base))] pt-8 sm:pt-12">
        <div className="text-center">
          <motion.div
            className="relative mx-auto grid h-[84px] w-[84px] place-items-center rounded-full bg-[#30D158]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260 }}
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#30D158]/30 [animation-iteration-count:2]" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12, stiffness: 300 }}
            >
              <Check className="h-11 w-11 text-white" strokeWidth={3.2} />
            </motion.span>
          </motion.div>

          <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#30D158]">Check-in confirmado</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.035em] sm:text-[34px]">Você está dentro!</h1>
          <p className="mx-auto mt-2 max-w-sm text-[16px] leading-snug text-[var(--ck-sec)]">
            Sua vaga para <span className="font-medium text-white">{nomeEvento}</span> foi reservada.
            {descricao ? ` ${descricao}` : ' Nos vemos lá!'}
          </p>
        </div>

        <Grupo className="mt-8">
          <Linha icone={<IconeQuadrado cor="#FF2C03"><Calendar /></IconeQuadrado>}>
            <span className="block text-[13px] text-[var(--ck-sec)]">Data</span>
            <span className="block text-[16px]">{dataEvento}</span>
          </Linha>
          <Linha icone={<IconeQuadrado cor="#FF9F0A"><Clock /></IconeQuadrado>}>
            <span className="block text-[13px] text-[var(--ck-sec)]">Horário</span>
            <span className="block text-[16px]">{formatarHorario(horario)}</span>
          </Linha>
          {pelotao ? (
            <Linha icone={<IconeQuadrado cor="#0A84FF"><Users /></IconeQuadrado>}>
              <span className="block text-[13px] text-[var(--ck-sec)]">Pelotão</span>
              <span className="block text-[16px]">
                {pelotao.replace('km', ' km')}
                {pelotaoLabel ? ` · ${pelotaoLabel}` : ''}
              </span>
            </Linha>
          ) : null}
          {localUrl ? (
            <a href={localUrl} target="_blank" rel="noopener noreferrer" className="block active:bg-white/10">
              <Linha
                icone={<IconeQuadrado cor="#30D158"><MapPin /></IconeQuadrado>}
                direita={<ArrowUpRight className="h-[18px] w-[18px] text-[var(--ck-ter)]" />}
              >
                <span className="block text-[13px] text-[var(--ck-sec)]">Local · abrir no mapa</span>
                <span className="block text-[16px]">{local}</span>
              </Linha>
            </a>
          ) : (
            <Linha icone={<IconeQuadrado cor="#30D158"><MapPin /></IconeQuadrado>}>
              <span className="block text-[13px] text-[var(--ck-sec)]">Local</span>
              <span className="block text-[16px]">{local}</span>
            </Linha>
          )}
        </Grupo>

        <div className="mt-5 rounded-[12px] bg-[#FF9F0A]/10 px-4 py-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#FF9F0A]">Importante</p>
          <p className="mt-1 text-[15px] leading-snug text-white/85">
            Salve o CPF cadastrado ou tire um print desta tela. Ele será usado para identificar sua presença no evento.
          </p>
        </div>

        <div className="mt-8 space-y-2.5">
          <a
            href="/check-in"
            className="ck-toque flex h-[50px] w-full items-center justify-center rounded-[14px] bg-[var(--ck-tint)] text-[17px] font-semibold text-white"
          >
            Ver os próximos encontros
          </a>
          <a
            href="/"
            className="ck-toque flex h-[50px] w-full items-center justify-center rounded-[14px] bg-white/10 text-[17px] font-semibold text-white"
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
