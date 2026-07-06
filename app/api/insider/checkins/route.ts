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
      : eventos.find(e => e.checkin_status === 'aberto') || eventos[0]

    let query = supabase
      .from('checkins')
      .select('id, nome_completo, email, telefone, cpf, sexo, pelotao, nome_do_evento, data_do_evento, data_hora_checkin, validacao_do_checkin, status')
      .eq('evento_id', eventoSelecionado.id)
      .order('data_hora_checkin', { ascending: false })

    if (busca) {
      query = query.or(
        `nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%,email.ilike.%${busca}%`
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
