'use client'

import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Peças de interface no padrão do iOS, usadas só no /check-in: barra de
 * navegação, lista agrupada (inset grouped) e controle segmentado.
 */

export function BarraNav({
  voltar,
  titulo,
  tituloVisivel = true,
  direita,
  linha = true,
}: {
  voltar: { rotulo: string; href?: string; onClick?: () => void }
  titulo: string
  /** Na lista, o título só aparece aqui depois que o título grande sai da tela. */
  tituloVisivel?: boolean
  direita?: ReactNode
  linha?: boolean
}) {
  const conteudoVoltar = (
    <>
      <ChevronLeft className="h-[26px] w-[26px] -ml-1.5 shrink-0" strokeWidth={2.4} />
      <span className="truncate">{voltar.rotulo}</span>
    </>
  )
  const classeVoltar =
    'ck-toque flex h-11 min-w-0 items-center text-[17px] text-[var(--ck-tint)] -ml-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-tint)] rounded-lg'

  return (
    <header className="ck-nav" data-linha={linha ? 'sim' : 'nao'}>
      <div className="mx-auto grid h-11 max-w-2xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div className="min-w-0">
          {voltar.href ? (
            <a href={voltar.href} className={classeVoltar}>{conteudoVoltar}</a>
          ) : (
            <button type="button" onClick={voltar.onClick} className={classeVoltar}>{conteudoVoltar}</button>
          )}
        </div>
        <p
          className={`text-[17px] font-semibold tracking-[-0.02em] transition-opacity duration-200 ${tituloVisivel ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!tituloVisivel}
        >
          {titulo}
        </p>
        <div className="flex min-w-0 justify-end text-[15px] text-[var(--ck-sec)]">{direita}</div>
      </div>
    </header>
  )
}

export function Grupo({
  titulo,
  rodape,
  children,
  className = '',
}: {
  titulo?: ReactNode
  rodape?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      {titulo ? (
        <h3 className="mb-1.5 px-4 text-[13px] uppercase tracking-[0.02em] text-[var(--ck-sec)]">{titulo}</h3>
      ) : null}
      <div className="overflow-hidden rounded-[12px] bg-[var(--ck-cel)]">{children}</div>
      {rodape ? <div className="mt-1.5 px-4 text-[13px] leading-snug text-[var(--ck-sec)]">{rodape}</div> : null}
    </section>
  )
}

/** Ícone em quadrado colorido, como nos Ajustes do iPhone. */
export function IconeQuadrado({ cor, children }: { cor: string; children: ReactNode }) {
  return (
    <span
      className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] text-white [&>svg]:h-[18px] [&>svg]:w-[18px]"
      style={{ background: cor }}
      aria-hidden
    >
      {children}
    </span>
  )
}

/**
 * Linha de lista. O separador começa depois do ícone, como no iOS, e some na
 * última linha do grupo.
 */
export function Linha({
  icone,
  children,
  direita,
  className = '',
  onClick,
  rotulo,
  selecionada,
}: {
  icone?: ReactNode
  children: ReactNode
  direita?: ReactNode
  className?: string
  /** Com onClick a linha vira botão (lista de escolha). */
  onClick?: () => void
  /** Rótulo da linha que envolve um campo: tocar em qualquer ponto foca o campo. */
  rotulo?: boolean
  selecionada?: boolean
}) {
  const classe = `ck-linha flex min-h-[44px] w-full items-center gap-3 pl-4 text-left ${className}`
  const miolo = (
    <>
      {icone}
      <span className="ck-linha-c flex min-h-[44px] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4">
        <span className="block min-w-0 flex-1">{children}</span>
        {direita}
      </span>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        role="radio"
        aria-checked={!!selecionada}
        className={`${classe} outline-none transition-colors active:bg-white/10 focus-visible:bg-white/10`}
      >
        {miolo}
      </button>
    )
  }
  if (rotulo) return <label className={classe}>{miolo}</label>
  return <div className={classe}>{miolo}</div>
}

export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { valor: T; rotulo: string }[]
  valor: T | ''
  onChange: (v: T) => void
  rotulo: string
}) {
  const indice = opcoes.findIndex(o => o.valor === valor)
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="relative grid rounded-[9px] bg-[#767680]/25 p-[2px]"
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, 1fr)` }}
    >
      {indice >= 0 ? (
        <span
          aria-hidden
          className="absolute bottom-[2px] top-[2px] rounded-[7px] bg-[#636366] shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{
            left: 2,
            width: `calc((100% - 4px) / ${opcoes.length})`,
            transform: `translateX(${indice * 100}%)`,
          }}
        />
      ) : null}
      {opcoes.map(o => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={`relative z-[1] h-8 rounded-[7px] text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ck-tint)] ${
            valor === o.valor ? 'font-semibold text-white' : 'text-white/80'
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}
