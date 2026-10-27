'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Folha que sobe de baixo, como a sheet do iOS: puxador, arrastar para baixo
 * fecha, fundo escurecido, Esc fecha. No desktop vira um cartão centralizado.
 * Quem usa embrulha em <AnimatePresence> para a saída animar.
 */
export function Folha({
  titulo,
  onFechar,
  children,
  rodape,
}: {
  titulo: string
  onFechar: () => void
  children: ReactNode
  rodape?: ReactNode
}) {
  const arrasto = useDragControls()
  const fechar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const anterior = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    fechar.current?.focus({ preventScroll: true })
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.documentElement.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [onFechar])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onFechar}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative flex max-h-[calc(100dvh-var(--ck-topo)-12px)] w-full flex-col overflow-hidden rounded-t-[14px] bg-[var(--ck-cel)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:max-h-[min(860px,calc(100dvh-48px))] sm:max-w-[440px] sm:rounded-[20px]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 340, mass: 0.9 }}
        drag="y"
        dragListener={false}
        dragControls={arrasto}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onFechar()
        }}
      >
        {/* Puxador: é por aqui que se arrasta, para não brigar com a rolagem do conteúdo */}
        <div
          className="shrink-0 cursor-grab touch-none select-none px-4 pb-2 pt-2 active:cursor-grabbing"
          onPointerDown={e => arrasto.start(e)}
        >
          <div className="mx-auto h-[5px] w-9 rounded-full bg-white/25" aria-hidden />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="truncate text-[17px] font-semibold tracking-[-0.02em]">{titulo}</p>
            <button
              ref={fechar}
              type="button"
              onClick={onFechar}
              onPointerDown={e => e.stopPropagation()}
              aria-label="Fechar"
              className="ck-toque grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-white/10 text-[var(--ck-sec)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-tint)]"
            >
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {rodape ? (
          <div className="shrink-0 px-4 pb-[calc(12px+var(--ck-base))] pt-3 shadow-[0_-0.5px_0_var(--ck-sep)] sm:pb-4">
            {rodape}
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}
