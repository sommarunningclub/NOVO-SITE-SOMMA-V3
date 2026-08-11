'use client'

import { useEffect, useState } from 'react'

const EVENTO_ID = 'f139b049-52c8-4028-9ddb-90cfa72af378'

export default function TransferLink() {
  const [habilitada, setHabilitada] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch(`/api/transferencias/status?evento_id=${EVENTO_ID}&t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setHabilitada(!!d.habilitada))
      .catch(() => setHabilitada(false))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando || !habilitada) return null

  return (
    <div className="mt-10 pt-8 border-t border-zinc-900 text-center">
      <p className="text-zinc-500 text-sm mb-3" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
        Já tem inscrição e não pode comparecer?
      </p>
      <a
        href="/somma-redbull-wingsforlifeworldrun/transferir"
        className="inline-flex items-center gap-2 text-[#F26522] hover:text-white text-sm font-semibold uppercase tracking-wider transition-colors"
        style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
      >
        Transferir inscrição para outra pessoa →
      </a>
    </div>
  )
}
