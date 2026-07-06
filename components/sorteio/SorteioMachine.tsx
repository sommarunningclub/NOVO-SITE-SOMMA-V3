// components/sorteio/SorteioMachine.tsx
'use client'

import { useRef, useEffect, useCallback } from 'react'

type SorteioMachineProps = {
  nomes: string[]
  onComplete: () => void
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÉÊÍÓÔÕÚÇ 0123456789'.split('')

function criarCharMap() {
  const map: Record<string, number> = {}
  CHARS.forEach((c, i) => { map[c] = i })
  return map
}

const CHAR_MAP = criarCharMap()

export default function SorteioMachine({ nomes, onComplete }: SorteioMachineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nomeAtualRef = useRef(0)
  const animationRef = useRef<number>(0)

  const animarNome = useCallback((nome: string, aoTerminar: () => void) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const text = nome.toUpperCase().split('')
    const scale = Math.min(50, (canvas.width * 0.85) / Math.max(text.length, 1))
    const breaks = 0.015
    const endSpeed = 0.05
    const firstLetter = 35
    const delay = 5

    const offset: number[] = []
    const offsetV: number[] = []

    for (let i = 0; i < text.length; i++) {
      const f = firstLetter + delay * i
      offsetV[i] = endSpeed + breaks * f
      offset[i] = -(1 + f) * (breaks * f + 2 * endSpeed) / 2
    }

    let terminados = 0

    function loop() {
      if (!canvas || !ctx) return

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Faixa de destaque laranja Somma
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(255, 44, 3, 0.15)'
      ctx.fillRect(0, (canvas.height - scale) / 2, canvas.width, scale)

      terminados = 0

      for (let i = 0; i < text.length; i++) {
        ctx.fillStyle = '#ffffff'
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.setTransform(
          1, 0, 0, 1,
          Math.floor((canvas.width - scale * (text.length - 1)) / 2),
          Math.floor(canvas.height / 2)
        )

        let o = offset[i]
        while (o < 0) o++
        o %= 1

        const h = Math.ceil(canvas.height / 2 / scale)

        for (let j = -h; j < h; j++) {
          let c = (CHAR_MAP[text[i]] ?? 0) + j - Math.floor(offset[i])
          while (c < 0) c += CHARS.length
          c %= CHARS.length

          const s = 1 - Math.abs(j + o) / (canvas.height / 2 / scale + 1)
          ctx.globalAlpha = s
          ctx.font = `bold ${scale * s}px monospace`
          ctx.fillText(CHARS[c], scale * i, (j + o) * scale)
        }

        offset[i] += offsetV[i]
        offsetV[i] -= breaks

        if (offsetV[i] < endSpeed) {
          offset[i] = 0
          offsetV[i] = 0
          terminados++
        }
      }

      if (terminados >= text.length) {
        // Renderizar o frame final com o nome completo
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1
        ctx.fillStyle = 'rgba(255, 44, 3, 0.15)'
        ctx.fillRect(0, (canvas.height - scale) / 2, canvas.width, scale)

        for (let i = 0; i < text.length; i++) {
          ctx.fillStyle = '#ffffff'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          ctx.setTransform(
            1, 0, 0, 1,
            Math.floor((canvas.width - scale * (text.length - 1)) / 2),
            Math.floor(canvas.height / 2)
          )
          ctx.globalAlpha = 1
          ctx.font = `bold ${scale}px monospace`
          ctx.fillText(text[i], scale * i, 0)
        }

        setTimeout(aoTerminar, 400)
        return
      }

      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.clientWidth * 2
    canvas.height = canvas.clientHeight * 2
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(2, 2)

    function avancar() {
      if (nomeAtualRef.current >= nomes.length) {
        onComplete()
        return
      }
      animarNome(nomes[nomeAtualRef.current], () => {
        nomeAtualRef.current++
        avancar()
      })
    }

    avancar()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [nomes, onComplete, animarNome])

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-4">
        <p className="text-center text-zinc-500 text-sm mb-4 uppercase tracking-widest">
          Sorteando {nomeAtualRef.current + 1} de {nomes.length}
        </p>
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl"
          style={{ height: '200px', background: '#111' }}
        />
        <p className="text-center text-[#ff2c03] text-xs mt-4 uppercase tracking-widest animate-pulse">
          Sorteio em andamento...
        </p>
      </div>
    </div>
  )
}
