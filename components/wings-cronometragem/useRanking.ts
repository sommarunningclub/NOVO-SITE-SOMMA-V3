'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/wings/supabase'
import type { AtleticaComp, AtletaComp, RunComp, RankingRow } from '@/lib/wings-cronometragem/types'
import type { Fase } from '@/lib/wings-cronometragem/tempo'

/**
 * Lógica nova: cada equipe tem 2 provas (normal + dinâmico) por fase.
 * Quando há múltiplas tentativas do mesmo tipo, usamos a melhor (menor tempo).
 * O ranking é ordenado pelo tempo combinado (soma das 2). Equipes que ainda
 * não fizeram as 2 provas ficam como "parcial" e não competem pelo top 8.
 */
function montarRanking(
  atleticas: AtleticaComp[],
  atletas: AtletaComp[],
  runs: RunComp[],
  fase: Fase
): RankingRow[] {
  const runsFase = runs.filter(r => r.fase === fase)

  // Pra cada atletica, descobre a melhor run de cada tipo
  const melhorPorAtleticaTipo = new Map<string, { normal: RunComp | null; dinamico: RunComp | null }>()
  for (const run of runsFase) {
    const slot = melhorPorAtleticaTipo.get(run.atletica_id) ?? { normal: null, dinamico: null }
    if (run.tipo_prova === 'normal') {
      if (!slot.normal || run.tempo_final_ms < slot.normal.tempo_final_ms) slot.normal = run
    } else {
      if (!slot.dinamico || run.tempo_final_ms < slot.dinamico.tempo_final_ms) slot.dinamico = run
    }
    melhorPorAtleticaTipo.set(run.atletica_id, slot)
  }

  const linhas: RankingRow[] = atleticas.map(atletica => {
    const slot = melhorPorAtleticaTipo.get(atletica.id) ?? { normal: null, dinamico: null }
    const tem = (slot.normal ? 1 : 0) + (slot.dinamico ? 1 : 0)
    const tempoCombinadoBrutoMs =
      slot.normal && slot.dinamico
        ? slot.normal.tempo_final_ms + slot.dinamico.tempo_final_ms
        : null
    const barras = atletica.barras ?? 0
    const descontoBarrasMs = barras * 1000
    const tempoCombinadoMs =
      tempoCombinadoBrutoMs != null
        ? Math.max(0, tempoCombinadoBrutoMs - descontoBarrasMs)
        : null
    const totalPenalidadesMs =
      (slot.normal ? slot.normal.penalidade_1_ms + slot.normal.penalidade_2_ms + slot.normal.penalidade_3_ms + slot.normal.penalidade_4_ms : 0) +
      (slot.dinamico ? slot.dinamico.penalidade_1_ms + slot.dinamico.penalidade_2_ms + slot.dinamico.penalidade_3_ms + slot.dinamico.penalidade_4_ms : 0)
    const estado = tem === 2 ? 'completo' : tem === 1 ? 'parcial' : 'sem-tempo'
    const melhorRun = slot.dinamico ?? slot.normal // referência pra animação no show
    return {
      atletica,
      atletas: atletas.filter(a => a.atletica_id === atletica.id),
      melhorRunNormal: slot.normal,
      melhorRunDinamico: slot.dinamico,
      tempoCombinadoBrutoMs,
      tempoCombinadoMs,
      descontoBarrasMs,
      totalPenalidadesMs,
      estado,
      posicao: 0,
      melhorRun,
    }
  })

  // Ordena: completos por tempoCombinado ASC,
  //         parciais depois (por tempo já registrado),
  //         sem-tempo por nome.
  linhas.sort((a, b) => {
    const peso = (e: typeof a.estado) => (e === 'completo' ? 0 : e === 'parcial' ? 1 : 2)
    const pa = peso(a.estado)
    const pb = peso(b.estado)
    if (pa !== pb) return pa - pb
    if (a.estado === 'completo' && b.estado === 'completo') {
      return (a.tempoCombinadoMs ?? Infinity) - (b.tempoCombinadoMs ?? Infinity)
    }
    if (a.estado === 'parcial' && b.estado === 'parcial') {
      const ta = a.melhorRunNormal?.tempo_final_ms ?? a.melhorRunDinamico?.tempo_final_ms ?? Infinity
      const tb = b.melhorRunNormal?.tempo_final_ms ?? b.melhorRunDinamico?.tempo_final_ms ?? Infinity
      return ta - tb
    }
    return a.atletica.nome.localeCompare(b.atletica.nome)
  })

  // Posições só pros completos (são os elegíveis pro top 8)
  let posicao = 0
  for (const linha of linhas) {
    if (linha.estado === 'completo') {
      posicao += 1
      linha.posicao = posicao
    }
  }

  return linhas
}

export function useRanking(fase: Fase) {
  const [atleticas, setAtleticas] = useState<AtleticaComp[]>([])
  const [atletas, setAtletas] = useState<AtletaComp[]>([])
  const [runs, setRuns] = useState<RunComp[]>([])
  const [finalLiberada, setFinalLiberada] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aoVivo, setAoVivo] = useState(false)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      try {
        const [aR, atR, rR, cR] = await Promise.all([
          fetch('/api/wings-comp/atleticas').then(r => r.json()),
          fetch('/api/wings-comp/atletas').then(r => r.json()),
          fetch('/api/wings-comp/runs').then(r => r.json()),
          fetch('/api/wings-comp/config').then(r => r.json()).catch(() => ({ config: null })),
        ])
        if (cancelado) return
        setAtleticas(aR.atleticas ?? [])
        setAtletas(atR.atletas ?? [])
        setRuns(rR.runs ?? [])
        setFinalLiberada(!!cR?.config?.final_liberada)
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    carregar()
    return () => { cancelado = true }
  }, [])

  useEffect(() => {
    const supabase = getBrowserClient()
    const channel = supabase
      .channel('wings-comp-ranking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wings_comp_runs' }, payload => {
        setRuns(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as RunComp]
          if (payload.eventType === 'UPDATE') {
            return prev.map(r => (r.id === (payload.new as RunComp).id ? (payload.new as RunComp) : r))
          }
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id
            return prev.filter(r => r.id !== oldId)
          }
          return prev
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wings_comp_atleticas' }, payload => {
        setAtleticas(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as AtleticaComp]
          if (payload.eventType === 'UPDATE') {
            return prev.map(a => (a.id === (payload.new as AtleticaComp).id ? (payload.new as AtleticaComp) : a))
          }
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id
            return prev.filter(a => a.id !== oldId)
          }
          return prev
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wings_comp_atletas' }, payload => {
        setAtletas(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as AtletaComp]
          if (payload.eventType === 'UPDATE') {
            return prev.map(a => (a.id === (payload.new as AtletaComp).id ? (payload.new as AtletaComp) : a))
          }
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id
            return prev.filter(a => a.id !== oldId)
          }
          return prev
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wings_comp_config' }, payload => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const novo = payload.new as { final_liberada?: boolean }
          setFinalLiberada(!!novo.final_liberada)
        }
      })
      .subscribe(status => {
        setAoVivo(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const ranking = montarRanking(atleticas, atletas, runs, fase)

  return { ranking, loading, aoVivo, atleticas, atletas, runs, finalLiberada }
}
