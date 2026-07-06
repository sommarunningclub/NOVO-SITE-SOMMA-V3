'use client'

import { useState } from 'react'
import { Check, X, RefreshCw, Loader2, Trophy, Phone, Mail } from 'lucide-react'
import type { Ganhador } from '@/lib/sorteio/types'

type GanhadorCardProps = {
  ganhador: Ganhador
  onConfirmar: (id: string) => Promise<void>
  onAusente: (id: string) => Promise<void>
  onResorteio: (id: string) => Promise<Ganhador | null>
}

export default function GanhadorCard({ ganhador, onConfirmar, onAusente, onResorteio }: GanhadorCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [substituto, setSubstituto] = useState<Ganhador | null>(ganhador.substituto || null)
  const [status, setStatus] = useState(ganhador.status)

  async function handleConfirmar() {
    setLoading('confirmar')
    try {
      await onConfirmar(ganhador.id)
      setStatus('confirmado')
    } finally {
      setLoading(null)
    }
  }

  async function handleAusente() {
    setLoading('ausente')
    try {
      await onAusente(ganhador.id)
      setStatus('ausente')
    } finally {
      setLoading(null)
    }
  }

  async function handleResorteio() {
    setLoading('resorteio')
    try {
      const novo = await onResorteio(ganhador.id)
      if (novo) setSubstituto(novo)
    } finally {
      setLoading(null)
    }
  }

  const corStatus = status === 'confirmado'
    ? 'border-green-800 bg-green-950/30'
    : status === 'ausente'
      ? 'border-red-900 bg-red-950/20'
      : 'border-zinc-800 bg-zinc-900'

  const badgeStatus = status === 'confirmado'
    ? 'bg-green-900/40 text-green-400'
    : status === 'ausente'
      ? 'bg-red-900/40 text-red-400'
      : 'bg-yellow-900/40 text-yellow-400'

  const labelStatus = status === 'confirmado' ? 'Confirmado' : status === 'ausente' ? 'Ausente' : 'Pendente'

  return (
    <div className="space-y-2">
      <div className={`border rounded-xl p-4 transition-all ${corStatus}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff2c03]/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-[#ff2c03]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-xs font-mono">#{ganhador.numero_sorteado}</span>
                <p className="text-white font-semibold text-sm">{ganhador.checkin.nome_completo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStatus}`}>
                  {labelStatus}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                {ganhador.checkin.pelotao && (
                  <span className="text-xs bg-[#ff2c03]/10 text-[#ff2c03] px-2 py-0.5 rounded-full">
                    {ganhador.checkin.pelotao}
                  </span>
                )}
                <span className="text-zinc-500 text-xs capitalize">{ganhador.checkin.sexo}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="text-zinc-500 text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {ganhador.checkin.email}
                </span>
                <span className="text-zinc-500 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {ganhador.checkin.telefone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {status === 'pendente' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleConfirmar}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 bg-green-900/30 hover:bg-green-900/50 border border-green-800 text-green-400 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading === 'confirmar' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar
            </button>
            <button
              onClick={handleAusente}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900 text-red-400 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading === 'ausente' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Ausente
            </button>
          </div>
        )}

        {status === 'ausente' && !substituto && (
          <div className="mt-3">
            <button
              onClick={handleResorteio}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 bg-[#ff2c03]/10 hover:bg-[#ff2c03]/20 border border-[#ff2c03]/30 text-[#ff2c03] rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading === 'resorteio' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Resorteio
            </button>
          </div>
        )}
      </div>

      {substituto && (
        <div className="ml-6 border-l-2 border-[#ff2c03]/30 pl-4">
          <p className="text-xs text-zinc-500 mb-1">Substituto:</p>
          <GanhadorCard
            ganhador={substituto}
            onConfirmar={onConfirmar}
            onAusente={onAusente}
            onResorteio={onResorteio}
          />
        </div>
      )}
    </div>
  )
}
