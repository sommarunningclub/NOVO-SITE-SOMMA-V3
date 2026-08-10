'use client'

import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// Casa Dopa Rio — Rua Piragibe Frota Aguiar, 7, Copacabana (ajuste fino se necessário)
const CENTER = { lat: -22.98093, lng: -43.19061 }
const SOMMA = '#FF2C03'
const CENTAURO = '#E30000'
const COORDS = `22°58'51"S  43°11'26"W`

// Estilo dark "palantir" — detalhes em laranja Somma e vermelho Centauro
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#141414' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#10130f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#241a14' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#2a2018' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a2018' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: SOMMA }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#191919' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: CENTAURO }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5a3a30' }] },
]

export function DopaMap() {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !ref.current) {
      setError(true)
      return
    }

    let raf = 0
    let cancelled = false
    setOptions({ key: apiKey, v: 'weekly' })

    Promise.all([importLibrary('maps')])
      .then(([{ Map }]) => {
        if (cancelled || !ref.current) return

        const map = new Map(ref.current, {
          center: CENTER,
          zoom: 16,
          mapTypeId: 'roadmap',
          styles: DARK_MAP_STYLES,
          disableDefaultUI: true,
          gestureHandling: 'none',
          keyboardShortcuts: false,
          draggable: false,
          clickableIcons: false,
          backgroundColor: '#0a0a0a',
          tilt: 0,
          isFractionalZoomEnabled: true,
        })

        setReady(true)

        // Loop "satélite localizando": fly-in de zoom afastado -> endereço, hold, repete
        const ZOOM_MIN = 14.6
        const ZOOM_MAX = 18.4
        const DURATION = 5200 // ms de aproximação
        const HOLD = 1600 // ms parado no alvo
        const CYCLE = DURATION + HOLD
        const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
        let start: number | null = null

        const loop = (ts: number) => {
          if (cancelled) return
          if (start === null) start = ts
          const phase = (ts - start) % CYCLE
          const t = Math.min(phase / DURATION, 1)
          const zoom = ZOOM_MIN + (ZOOM_MAX - ZOOM_MIN) * ease(t)
          map.moveCamera({ center: CENTER, zoom })
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      })
      .catch(() => setError(true))

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  if (error) {
    return (
      <div className="flex h-full min-h-[20rem] w-full items-center justify-center bg-[#0a0a0a] text-center">
        <div className="px-6">
          <p className="font-[family-name:var(--font-display)] text-2xl uppercase text-white">Casa Dopa Rio</p>
          <p className="mt-2 text-sm text-[#A1A1A1]">Rua Piragibe Frota Aguiar, 7 — Copacabana</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[22rem] w-full overflow-hidden bg-black">
      <div ref={ref} className="absolute inset-0 h-full w-full" aria-label="Mapa de satélite da Casa Dopa Rio" />

      {/* ===== HUD de localização (overlay) ===== */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
      >
        {/* leve escurecimento + tint laranja nas bordas */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

        {/* cantos de enquadramento */}
        {[
          'left-4 top-4 border-l-2 border-t-2',
          'right-4 top-4 border-r-2 border-t-2',
          'left-4 bottom-4 border-l-2 border-b-2',
          'right-4 bottom-4 border-r-2 border-b-2',
        ].map((pos) => (
          <span key={pos} className={`absolute h-7 w-7 border-[#FF2C03]/70 ${pos}`} />
        ))}

        {/* mira central + radar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* anéis de radar pulsantes */}
          <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF2C03] [animation:dopa-radar_2.4s_ease-out_infinite]" />
          <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF2C03] [animation:dopa-radar_2.4s_ease-out_infinite] [animation-delay:1.2s]" />
          {/* crosshair */}
          <span className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-[#FF2C03]/60" />
          <span className="absolute left-1/2 top-1/2 h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-[#FF2C03]/60" />
          {/* ponto central */}
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF2C03] shadow-[0_0_12px_3px_rgba(255,44,3,0.7)]" />
        </div>

        {/* linha de varredura */}
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF2C03] to-transparent [animation:dopa-scan_3.6s_linear_infinite]" />

        {/* status: LOCALIZANDO */}
        <div className="absolute left-4 top-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF2C03] sm:text-xs">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[#FF2C03] align-middle" />
          Localizando endereço…
        </div>

        {/* readout inferior */}
        <div className="absolute bottom-5 left-4 right-4 font-mono text-[10px] uppercase tracking-widest text-white/80 sm:text-xs">
          <p className="text-[#FF2C03]">● CASA DOPA RIO — COPACABANA</p>
          <p className="mt-1 text-white/60">{COORDS} · SINAL ESTÁVEL</p>
        </div>
      </div>

      <style>{`
        @keyframes dopa-radar { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.9 } 100% { transform: translate(-50%, -50%) scale(3.6); opacity: 0 } }
        @keyframes dopa-scan { 0% { top: 0 } 100% { top: 100% } }
      `}</style>
    </div>
  )
}
