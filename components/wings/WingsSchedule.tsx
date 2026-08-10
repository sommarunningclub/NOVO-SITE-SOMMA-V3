'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Users, Music, ChevronDown, Wrench } from 'lucide-react'

import {
  WINGS_SCHEDULE,
  TAG_CLASSES,
  TAG_LABEL,
  parseDetail,
  type ScheduleBlock,
} from '@/lib/wings/schedule'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

type Props = {
  showOperational?: boolean
}

export default function WingsSchedule({ showOperational = false }: Props) {
  const blocks = useMemo(
    () => WINGS_SCHEDULE.filter(b => showOperational || b.isPublic),
    [showOperational]
  )

  return (
    <section
      id="wings-cronograma"
      aria-labelledby="schedule-heading"
      className="bg-wfl-navy text-white py-12 sm:py-24 px-4 sm:px-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div>
          <p
            className="text-[10px] sm:text-sm font-semibold tracking-[0.3em] uppercase text-wfl-yellow"
            style={fontBody}
          >
            02 de maio de 2026
          </p>
          <h2
            id="schedule-heading"
            className="mt-2 text-3xl sm:text-6xl uppercase leading-none"
            style={fontDisplay}
          >
            Programação do dia
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/60" style={fontBody}>
            Pista de Atletismo — CO UnB · Brasília, DF
          </p>
        </div>

        {/* Mini stats */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {[
            { Icon: Clock, label: '6 horas de evento' },
            { Icon: Users, label: 'Revezamento 4×100m' },
            { Icon: Music, label: 'DJ ao vivo' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-4 flex items-center gap-3"
              style={fontBody}
            >
              <Icon className="w-5 h-5 text-wfl-yellow" aria-hidden="true" />
              <span className="text-sm font-semibold tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <ol className="relative mt-14">
          {/* Linha vertical: à esquerda no mobile, no centro no desktop */}
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-white/15 left-3 sm:left-4 md:left-1/2 md:-translate-x-1/2"
          />
          {blocks.map((block, index) => (
            <TimelineItem key={block.id} block={block} index={index} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function TimelineItem({ block, index }: { block: ScheduleBlock; index: number }) {
  const ref = useRef<HTMLLIElement>(null)
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  // Desktop: alterna lados; Mobile: sempre direita
  const onLeft = index % 2 === 0
  const isOperational = !block.isPublic

  const detailsId = `schedule-details-${block.id}`

  return (
    <li
      ref={ref}
      className="relative pl-9 sm:pl-12 md:pl-0 mb-6 sm:mb-8 md:mb-12"
      style={{
        opacity: visible ? (isOperational ? 0.6 : 1) : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${index * 80}ms, transform 0.6s ease ${index * 80}ms`,
      }}
    >
      {/* Dot na linha */}
      <span
        aria-hidden="true"
        className={`absolute top-3 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full left-3 sm:left-4 -translate-x-1/2 md:left-1/2 md:-translate-x-1/2 ${
          block.isHighlight
            ? 'bg-wfl-red ring-4 ring-white/20'
            : 'bg-white/30 ring-2 ring-white/10'
        }`}
      />

      <div
        className={`md:grid md:grid-cols-2 md:gap-10 ${
          onLeft ? '' : 'md:[&>*:first-child]:order-2'
        }`}
      >
        {/* Coluna lado oposto vazia (apenas visual no desktop) */}
        <div className="hidden md:block" aria-hidden="true" />

        {/* Card */}
        <div className={onLeft ? 'md:pl-8' : 'md:pr-8 md:text-right'}>
          {/* Horário */}
          <div
            className={`flex flex-wrap items-center gap-2 ${
              onLeft ? '' : 'md:flex-row-reverse'
            }`}
          >
            <span
              className="bg-wfl-yellow text-wfl-navy font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm tracking-wider tabular-nums"
              style={fontBody}
            >
              {block.timeStart} – {block.timeEnd}
            </span>
            {isOperational && (
              <span
                className="inline-flex items-center gap-1 bg-white/10 text-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={fontBody}
              >
                <Wrench className="w-3 h-3" aria-hidden="true" /> Operacional
              </span>
            )}
          </div>

          {/* Card body */}
          <div
            className="mt-2 sm:mt-3 bg-white text-wfl-dark border border-wfl-border md:text-left"
            style={fontBody}
          >
            <button
              type="button"
              onClick={() => !isOperational && setOpen(o => !o)}
              disabled={isOperational}
              aria-expanded={open}
              aria-controls={detailsId}
              className={`w-full text-left p-4 sm:p-6 ${
                isOperational ? 'cursor-default' : 'cursor-pointer hover:bg-wfl-card/40'
              } transition-colors`}
            >
              <h3
                className="text-xl sm:text-3xl uppercase leading-tight text-wfl-navy"
                style={fontDisplay}
              >
                {block.title}
              </h3>
              <p className="mt-2 text-sm text-wfl-dark/70 leading-relaxed">
                {block.description}
              </p>

              {/* Tags */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                {block.tags.map(tag => (
                  <span
                    key={tag}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${TAG_CLASSES[tag]}`}
                  >
                    {TAG_LABEL[tag]}
                  </span>
                ))}
              </div>

              {!isOperational && (
                <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-wfl-red uppercase tracking-wider">
                  {open ? 'Ver menos' : 'Ver detalhes'}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              )}
            </button>

            {/* Detalhes */}
            {!isOperational && open && (
              <div
                id={detailsId}
                className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-wfl-border/60"
              >
                <ul className="mt-3 sm:mt-4 space-y-2.5 text-left">
                  {block.details.map((detail, i) => {
                    const { heading, body } = parseDetail(detail)
                    return (
                      <li key={i} className="text-sm text-wfl-dark/80 leading-relaxed">
                        {heading ? (
                          <>
                            <span className="font-bold text-wfl-red">{heading}</span>
                            <span className="text-wfl-dark/50"> — </span>
                            <span>{body}</span>
                          </>
                        ) : (
                          <span className="flex gap-2">
                            <span className="text-wfl-red mt-0.5 flex-shrink-0" aria-hidden="true">
                              ▸
                            </span>
                            <span>{detail}</span>
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
