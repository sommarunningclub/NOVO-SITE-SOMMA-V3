'use client'

import { useState, useEffect } from 'react'

const TARGET = new Date('2026-04-26T07:00:00-03:00').getTime()

function getTimeLeft() {
  const diff = TARGET - Date.now()
  if (diff <= 0) return null
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  }
}

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="bg-[#1A1A1A] border border-zinc-800 px-3 sm:px-5 py-2 sm:py-3 min-w-[56px] sm:min-w-[72px] text-center"
        style={{ boxShadow: '0 0 24px rgba(204,0,0,0.15) inset' }}
      >
        <span
          className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tabular-nums text-[#CC0000]"
          style={{ textShadow: '0 0 20px rgba(204,0,0,0.6)' }}
        >
          {value}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-[0.25em] font-medium" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
        {label}
      </span>
    </div>
  )
}

type TimeLeft = ReturnType<typeof getTimeLeft>

export default function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft | undefined>(undefined)

  useEffect(() => {
    setTime(getTimeLeft())
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  // Placeholder estático antes do mount (evita hydration mismatch)
  if (time === undefined) {
    return (
      <div className="flex items-start gap-2 sm:gap-3 justify-center">
        {['Dias', 'Horas', 'Min', 'Seg'].map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="bg-[#1A1A1A] border border-zinc-800 px-3 sm:px-5 py-2 sm:py-3 min-w-[56px] sm:min-w-[72px] text-center">
              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tabular-nums text-[#CC0000]" style={{ textShadow: '0 0 20px rgba(204,0,0,0.6)' }}>--</span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-[0.25em] font-medium">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  // Evento já aconteceu
  if (time === null) {
    return (
      <p
        className="text-[#CC0000] text-xl sm:text-2xl font-bold uppercase tracking-widest text-center"
        style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', textShadow: '0 0 20px rgba(204,0,0,0.5)' }}
      >
        O EVENTO COMEÇOU!
      </p>
    )
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3 justify-center">
      <Digit value={String(time.dias).padStart(2, '0')} label="Dias" />
      <span className="text-zinc-600 text-3xl sm:text-4xl font-thin mt-2">:</span>
      <Digit value={String(time.horas).padStart(2, '0')} label="Horas" />
      <span className="text-zinc-600 text-3xl sm:text-4xl font-thin mt-2">:</span>
      <Digit value={String(time.minutos).padStart(2, '0')} label="Min" />
      <span className="text-zinc-600 text-3xl sm:text-4xl font-thin mt-2">:</span>
      <Digit value={String(time.segundos).padStart(2, '0')} label="Seg" />
    </div>
  )
}
