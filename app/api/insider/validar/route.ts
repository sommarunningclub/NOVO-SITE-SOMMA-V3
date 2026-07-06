import { NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { searchParams } = new URL(req.url)
    const busca = searchParams.get('busca') || ''
    const eventoId = searchParams.get('evento_id') || ''

    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('id, titulo, data_evento, checkin_status')
      .order('data_evento', { ascending: false })

    if (eventosError || !eventos || eventos.length === 0) {
      return NextResponse.json({ checkins: [], evento: null, eventos: [] })
    }

    const eventoSelecionado = eventoId
      ? eventos.find(e => e.id === eventoId) || eventos[0]
      : eventos[0]

    let query = supabase
      .from('checkins')
      .select('id, nome_completo, cpf, pelotao, validacao_do_checkin, data_hora_checkin, nome_do_evento, data_do_evento')
      .eq('evento_id', eventoSelecionado.id)
      .order('nome_completo', { ascending: true })

    if (busca) {
      query = query.or(
        `nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%`
      )
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      checkins: data || [],
      evento: {
        id: eventoSelecionado.id,
        nome_do_evento: eventoSelecionado.titulo,
        data_do_evento: eventoSelecionado.data_evento,
        checkin_status: eventoSelecionado.checkin_status,
      },
      eventos: eventos.map(e => ({
        id: e.id,
        titulo: e.titulo,
        data_evento: e.data_evento,
        checkin_status: e.checkin_status,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { id, validacao_do_checkin } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { error } = await supabase
      .from('checkins')
      .update({
        validacao_do_checkin,
        validated_at: validacao_do_checkin
          ? new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '-03:00'
          : null,
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
