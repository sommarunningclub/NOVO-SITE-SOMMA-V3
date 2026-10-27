import { getSupabase } from '@/lib/supabase'
import { slugDoEvento, slugsIguais } from '@/lib/check-in/slug'

export type Evento = {
  id: string
  slug: string
  data: string
  dataFormatada: string
  titulo: string
  descricao: string | null
  local: string
  localUrl: string | null
  /** LP própria do evento. Preenchida, o card leva para lá em vez de abrir o wizard. */
  lpUrl: string | null
  tipo: 'corrida' | 'personalizado'
  encerrado: boolean
  bloqueado: boolean
  dataEvento: string
  horarioInicio: string
}

type EventoRow = {
  id: string
  titulo: string
  slug?: string | null
  descricao?: string | null
  data_evento: string
  horario_inicio?: string | null
  local?: string | null
  local_url?: string | null
  lp_url?: string | null
  tipo?: 'corrida' | 'personalizado' | null
  checkin_status?: string | null
}

export function formatarData(dataStr: string): string {
  const [year, month, day] = dataStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${dias[date.getDay()]}, ${String(day).padStart(2, '0')} de ${meses[month - 1]} de ${year}`
}

export function formatarHorario(horario: string): string {
  const [h, m] = horario.split(':')
  return `A partir das ${h}h${m === '00' ? '00' : m}`
}

/**
 * Normaliza a LP do evento e recusa o que não for http(s).
 *
 * O valor vem do banco (preenchido no admin) e acaba num `location.href` — sem
 * essa checagem, um `javascript:` gravado ali viraria execução de script. Aceita
 * caminho relativo ("/desafios-das-esteiras-evolve") além de URL completa.
 * Retorna null quando não dá para usar, e aí o card volta ao check-in normal.
 */
export function lpSegura(url: string | null): string | null {
  if (!url || !url.trim()) return null
  const base = typeof window === 'undefined' ? 'https://sommaclub.com.br' : window.location.origin
  try {
    const u = new URL(url.trim(), base)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

export function mapearEvento(row: EventoRow, opts?: { historico?: boolean }): Evento {
  return {
    id: row.id,
    slug: slugDoEvento({ slug: row.slug, titulo: row.titulo }),
    data: row.data_evento,
    dataFormatada: formatarData(row.data_evento),
    titulo: row.titulo,
    descricao: opts?.historico ? null : row.descricao || null,
    local: row.local || 'Parque da Cidade, Brasília, DF',
    localUrl: opts?.historico ? null : row.local_url || null,
    lpUrl: opts?.historico ? null : row.lp_url || null,
    tipo: row.tipo || 'corrida',
    encerrado: row.checkin_status === 'encerrado',
    bloqueado: row.checkin_status === 'bloqueado',
    dataEvento: row.data_evento,
    horarioInicio: opts?.historico ? '' : row.horario_inicio || '',
  }
}

export function encontrarEventoPorSlug(eventos: Evento[], slug: string): Evento | undefined {
  return eventos.find(e => slugsIguais(e.slug, slug) || slugsIguais(slugDoEvento({ titulo: e.titulo }), slug))
}

const CAMPOS =
  'id, titulo, slug, data_evento, horario_inicio, local, local_url, lp_url, tipo, checkin_status, descricao'

/** Leitura pública para metadata e a página `/check-in/[slug]`. */
export async function buscarEventoPublicoPorSlug(slug: string): Promise<Evento | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: upcoming } = await supabase
    .from('eventos')
    .select(CAMPOS)
    .or(`data_evento.gt.${today},checkin_status.eq.aberto,checkin_status.eq.bloqueado`)
    .neq('checkin_status', 'encerrado')
    .eq('oculto_no_checkin_publico', false)
    .order('data_evento', { ascending: true })
    .limit(20)

  const proximos = (upcoming || []).map(row => mapearEvento(row))
  const noProximo = encontrarEventoPorSlug(proximos, slug)
  if (noProximo) return noProximo

  const { data: historico } = await supabase
    .from('eventos')
    .select(CAMPOS)
    .eq('checkin_status', 'encerrado')
    .eq('oculto_no_checkin_publico', false)
    .gte('data_evento', thirtyDaysAgo)
    .order('data_evento', { ascending: false })
    .limit(20)

  const passados = (historico || []).map(row => mapearEvento(row, { historico: true }))
  return encontrarEventoPorSlug(passados, slug) ?? null
}
