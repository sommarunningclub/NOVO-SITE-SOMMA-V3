'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Maximize2, Minimize2, Activity, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRanking } from './useRanking'
import { msParaDisplay } from '@/lib/wings-cronometragem/tempo'
import type { Fase } from '@/lib/wings-cronometragem/tempo'
import type { RankingRow } from '@/lib/wings-cronometragem/types'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const MEDALHAS = ['🥇', '🥈', '🥉']

export default function WingsRankingClient() {
  const [fase, setFase] = useState<Fase>('classificatoria')
  const { ranking, loading, aoVivo, runs, finalLiberada } = useRanking(fase)

  // Quando público pede a aba "final" mas o admin ainda não liberou,
  // forçamos volta para classificatória
  useEffect(() => {
    if (fase === 'final' && !finalLiberada) {
      setFase('classificatoria')
    }
  }, [fase, finalLiberada])
  const [telao, setTelao] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())

  // tick para "última atualização há Xs"
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Atléticas classificadas para final.
  // Se houver alguma atlética com classificada_final=true, usa essa lista (travada pelo staff).
  // Senão, calcula projeção: top 8 das completas atuais.
  const classificadasTravadas = ranking.filter(r => r.atletica.classificada_final).map(r => r.atletica.id)
  const haTravamento = classificadasTravadas.length > 0
  const classificadasParaFinal = (() => {
    if (haTravamento) return new Set(classificadasTravadas)
    if (fase !== 'classificatoria') return new Set<string>()
    const completas = ranking.filter(r => r.estado === 'completo')
    return new Set(completas.slice(0, 8).map(r => r.atletica.id))
  })()

  // Tempo do líder (combinado) pra calcular gap
  const tempoLider =
    ranking.find(r => r.estado === 'completo')?.tempoCombinadoMs ?? null

  // Última atualização
  const ultimaRunMs = runs.reduce((max, r) => {
    const t = new Date(r.created_at).getTime()
    return t > max ? t : max
  }, 0)
  const segDesdeUpdate = ultimaRunMs ? Math.floor((agora - ultimaRunMs) / 1000) : null

  return (
    <main
      className={`min-h-[100dvh] bg-wfl-navy text-white ${telao ? 'text-lg' : ''}`}
      style={fontBody}
    >
      {/* Header — não sticky em telão */}
      <header
        className={`border-b border-white/10 bg-black/40 backdrop-blur ${
          telao ? '' : 'sticky top-0 z-10'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div
          className={`mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 ${
            telao ? 'max-w-[1600px]' : 'max-w-5xl'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/Logo_Nova_Somma_Branca_Laranja.svg"
              alt="Somma"
              width={80}
              height={28}
              priority
              className={`w-auto flex-shrink-0 ${telao ? 'h-10' : 'h-7 sm:h-9'}`}
            />
            <div className="hidden sm:block w-px h-8 bg-white/20" />
            <div className="min-w-0">
              <p
                className={`tracking-[0.3em] uppercase text-wfl-yellow font-bold ${
                  telao ? 'text-xs' : 'text-[9px] sm:text-[10px]'
                }`}
              >
                Ranking ao vivo
              </p>
              <h1
                className={`uppercase leading-none truncate ${
                  telao ? 'text-3xl sm:text-4xl' : 'text-base sm:text-xl'
                }`}
                style={fontDisplay}
              >
                Wings das Atléticas 2026
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/wings/ranking-show"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-9 bg-wfl-yellow text-wfl-navy text-[10px] font-bold uppercase tracking-wider hover:bg-wfl-yellow/90 transition-colors"
              title="Ranking show animado"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Show</span>
            </Link>
            {/* Status realtime */}
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                aoVivo ? 'bg-wfl-red text-white' : 'bg-white/10 text-white/60'
              }`}
              aria-live="polite"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  aoVivo ? 'bg-white animate-pulse' : 'bg-white/40'
                }`}
              />
              {aoVivo ? 'AO VIVO' : 'CONECTANDO'}
            </span>
            {/* Toggle telão (iPad/TV) */}
            <button
              onClick={() => setTelao(t => !t)}
              className="hidden md:inline-flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              aria-label={telao ? 'Sair do modo telão' : 'Modo telão'}
              title={telao ? 'Sair do modo telão' : 'Modo telão'}
            >
              {telao ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sub-header com tabs (sempre visível) */}
        <div
          className={`mx-auto px-4 sm:px-6 pb-3 ${
            telao ? 'max-w-[1600px]' : 'max-w-5xl'
          }`}
        >
          <div
            className={`grid grid-cols-2 gap-1.5 bg-black/30 p-1 ${
              telao ? 'max-w-md mx-auto' : ''
            }`}
            role="tablist"
          >
            {(['classificatoria', 'final'] as Fase[]).map(f => {
              const desabilitada = f === 'final' && !finalLiberada
              if (desabilitada) {
                return (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={false}
                    disabled
                    className="min-h-11 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] bg-transparent text-white/30 cursor-not-allowed"
                    title="Aguardando liberação do staff"
                  >
                    Final · 🔒
                  </button>
                )
              }
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={fase === f}
                  onClick={() => setFase(f)}
                  className={`min-h-11 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] transition-colors ${
                    fase === f
                      ? 'bg-wfl-red text-white'
                      : 'bg-transparent text-white/60 hover:bg-white/5'
                  }`}
                >
                  {f === 'classificatoria' ? 'Classificatórias' : 'Final'}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div
        className={`mx-auto px-3 sm:px-6 py-4 sm:py-6 ${
          telao ? 'max-w-[1600px]' : 'max-w-5xl'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        {loading ? (
          <SkeletonRanking />
        ) : ranking.length === 0 ? (
          <div className="bg-white/5 border border-white/10 px-4 py-12 text-center">
            <Activity className="w-8 h-8 mx-auto text-white/30 mb-3" aria-hidden />
            <p className="text-white/40">Nenhuma atlética cadastrada ainda.</p>
            <p className="text-white/30 text-xs mt-1">As equipes aparecerão aqui assim que o staff cadastrar.</p>
          </div>
        ) : (
          <ul
            className={`space-y-2 ${
              telao ? 'sm:space-y-3 grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2' : ''
            }`}
            aria-live="polite"
            aria-label="Ranking"
          >
            {ranking.map(linha => (
              <RankingRowItem
                key={linha.atletica.id}
                linha={linha}
                tempoLider={tempoLider}
                classificadaParaFinal={classificadasParaFinal.has(linha.atletica.id)}
                telao={telao}
              />
            ))}
          </ul>
        )}

        {/* Meta */}
        <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">
          <span>Tempo combinado = atletismo + dinâmica</span>
          {segDesdeUpdate != null && (
            <span className="tabular-nums">
              Última run há {segDesdeUpdate < 60 ? `${segDesdeUpdate}s` : `${Math.floor(segDesdeUpdate / 60)}min`}
            </span>
          )}
        </div>
      </div>
    </main>
  )
}

function SkeletonRanking() {
  return (
    <ul className="space-y-2" aria-hidden>
      {[0, 1, 2, 3, 4].map(i => (
        <li key={i} className="bg-white/5 h-16 animate-pulse" />
      ))}
    </ul>
  )
}

function RankingRowItem({
  linha,
  tempoLider,
  classificadaParaFinal,
  telao,
}: {
  linha: RankingRow
  tempoLider: number | null
  classificadaParaFinal: boolean
  telao: boolean
}) {
  const { atletica, atletas, melhorRunNormal, melhorRunDinamico, tempoCombinadoMs, tempoCombinadoBrutoMs, descontoBarrasMs, totalPenalidadesMs, estado, posicao } = linha
  const barras = atletica.barras ?? 0
  const top3 = estado === 'completo' && posicao >= 1 && posicao <= 3
  const gap =
    estado === 'completo' && tempoLider != null && tempoCombinadoMs != null && tempoCombinadoMs !== tempoLider
      ? tempoCombinadoMs - tempoLider
      : null

  // Anim subtle quando posição muda
  const ref = useRef<HTMLLIElement>(null)
  const posRef = useRef(posicao)
  useEffect(() => {
    if (posRef.current !== posicao && ref.current) {
      ref.current.classList.remove('ring-2', 'ring-wfl-yellow')
      void ref.current.offsetWidth
      ref.current.classList.add('ring-2', 'ring-wfl-yellow')
      const t = setTimeout(() => {
        ref.current?.classList.remove('ring-2', 'ring-wfl-yellow')
      }, 1500)
      posRef.current = posicao
      return () => clearTimeout(t)
    }
    posRef.current = posicao
  }, [posicao])

  const corBorda =
    estado === 'completo'
      ? atletica.cor
      : estado === 'parcial'
        ? 'rgba(245,158,11,0.6)' // amber
        : 'rgba(255,255,255,0.1)'

  return (
    <li
      ref={ref}
      className="relative bg-white/5 border-l-4 transition-all duration-500"
      style={{ borderLeftColor: corBorda }}
    >
      <div
        className={`grid items-center gap-2 sm:gap-3 ${
          telao
            ? 'grid-cols-[44px_56px_1fr_auto] sm:grid-cols-[52px_72px_1fr_auto] px-4 sm:px-5 py-3 sm:py-4'
            : 'grid-cols-[36px_44px_1fr_auto] sm:grid-cols-[44px_52px_1fr_auto] px-2.5 sm:px-4 py-2.5 sm:py-3'
        }`}
      >
        {/* Posição / medalha */}
        <div className="flex items-center justify-center">
          {estado === 'completo' ? (
            top3 ? (
              <span className={telao ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'} aria-label={`${posicao}º lugar`}>
                {MEDALHAS[posicao - 1]}
              </span>
            ) : (
              <span
                className={`text-white/70 tabular-nums leading-none ${
                  telao ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}
                style={fontDisplay}
              >
                {posicao}º
              </span>
            )
          ) : estado === 'parcial' ? (
            <span className="text-amber-400 text-[10px] uppercase tracking-wider font-bold">1/2</span>
          ) : (
            <span className="text-white/25 text-xs">—</span>
          )}
        </div>

        {/* Avatar da atlética */}
        <div
          className={`relative overflow-hidden bg-black/40 border-2 ${
            telao ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'
          }`}
          style={{ borderColor: atletica.cor, borderRadius: '9999px' }}
        >
          {atletica.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={atletica.foto_url}
              alt={atletica.nome}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-white/70"
              style={{ backgroundColor: `${atletica.cor}33` }}
            >
              <span className="text-xs sm:text-sm" style={fontDisplay}>
                {(atletica.sigla || atletica.nome).slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Atlética + atletas */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3
              className={`uppercase leading-tight ${
                telao ? 'text-xl sm:text-2xl' : 'text-sm sm:text-lg'
              }`}
              style={fontDisplay}
            >
              {atletica.nome}
            </h3>
            {atletica.sigla && (
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 hidden sm:inline">
                · {atletica.sigla}
              </span>
            )}
            {classificadaParaFinal && (
              <span className="px-1.5 py-0.5 bg-wfl-yellow text-wfl-navy text-[9px] font-bold uppercase tracking-wider">
                Final
              </span>
            )}
            {estado === 'parcial' && (
              <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-200 text-[9px] font-bold uppercase tracking-wider">
                {melhorRunNormal ? 'Falta dinâmica' : 'Falta atletismo'}
              </span>
            )}
          </div>
          {/* Breakdown ou atletas */}
          {estado === 'completo' && melhorRunNormal && melhorRunDinamico ? (
            <p
              className={`mt-0.5 text-white/55 tabular-nums ${
                telao ? 'text-sm' : 'text-[10px] sm:text-xs'
              }`}
            >
              <span className="text-wfl-yellow">A</span> {msParaDisplay(melhorRunNormal.tempo_final_ms)}
              {' · '}
              <span className="text-wfl-red">D</span> {msParaDisplay(melhorRunDinamico.tempo_final_ms)}
              {barras > 0 && (
                <>
                  {' · '}
                  <span className="text-wfl-yellow font-bold">🏋️ {barras} −{barras}s</span>
                </>
              )}
            </p>
          ) : atletas.length > 0 ? (
            <p
              className={`mt-0.5 text-white/50 truncate ${
                telao ? 'text-sm' : 'text-[10px] sm:text-xs'
              }`}
            >
              {atletas
                .slice()
                .sort((a, b) => a.modalidade - b.modalidade)
                .map(a => a.nome.split(' ')[0])
                .join(' · ')}
            </p>
          ) : null}
        </div>

        {/* Tempo */}
        <div className="text-right tabular-nums leading-tight">
          {estado === 'completo' && tempoCombinadoMs != null ? (
            <>
              {descontoBarrasMs > 0 && tempoCombinadoBrutoMs != null && (
                <div className={`${telao ? 'text-sm' : 'text-[10px] sm:text-xs'} text-white/30 line-through font-mono`}>
                  {msParaDisplay(tempoCombinadoBrutoMs)}
                </div>
              )}
              <div
                className={`font-mono font-bold ${
                  totalPenalidadesMs > 0 ? 'text-wfl-red' : 'text-wfl-yellow'
                } ${telao ? 'text-2xl sm:text-3xl' : 'text-base sm:text-xl'}`}
              >
                {msParaDisplay(tempoCombinadoMs)}
              </div>
              <div className={`mt-0.5 ${telao ? 'text-xs' : 'text-[9px] sm:text-[10px]'} text-white/40`}>
                {descontoBarrasMs > 0 && (
                  <span className="text-wfl-yellow">−{descontoBarrasMs / 1000}s barras</span>
                )}
                {totalPenalidadesMs > 0 && (
                  <span className={descontoBarrasMs > 0 ? ' · ' : ''}>+{(totalPenalidadesMs / 1000).toFixed(1)}s pen</span>
                )}
                {gap != null && (
                  <span className={(descontoBarrasMs > 0 || totalPenalidadesMs > 0) ? ' · ' : ''}>
                    +{(gap / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            </>
          ) : estado === 'parcial' ? (
            <>
              <div
                className={`font-mono font-bold text-white/70 ${
                  telao ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                }`}
              >
                {msParaDisplay((melhorRunNormal ?? melhorRunDinamico)!.tempo_final_ms)}
              </div>
              <div className={`mt-0.5 ${telao ? 'text-xs' : 'text-[9px] sm:text-[10px]'} text-amber-300`}>
                Aguarda 2ª prova
              </div>
            </>
          ) : (
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Aguardando</span>
          )}
        </div>
      </div>
    </li>
  )
}
