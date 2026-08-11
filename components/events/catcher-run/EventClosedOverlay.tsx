'use client'

import { useEffect, useState } from 'react'

const EVENTO_ID = 'f139b049-52c8-4028-9ddb-90cfa72af378'

export default function EventClosedOverlay() {
  const [encerrado, setEncerrado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch(`/api/eventos/status?evento_id=${EVENTO_ID}&t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setEncerrado(!!d.encerrado))
      .catch(() => setEncerrado(false))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando || !encerrado) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase text-white mb-6"
          style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
        >
          Evento
          <br />
          Encerrado
        </h1>
        <p
          className="text-zinc-300 text-lg mb-8"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          Obrigado pelo interesse. Acompanhe as redes do Somma Running Club para ficar por dentro das próximas corridas.
        </p>
        <a
          href="https://www.instagram.com/somma.club/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-zinc-500 hover:border-zinc-300 text-zinc-300 hover:text-white font-semibold text-sm uppercase tracking-wider px-8 py-3 transition-colors duration-200"
          style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
        >
          Seguir @somma.club
        </a>
      </div>
    </div>
  )
}
