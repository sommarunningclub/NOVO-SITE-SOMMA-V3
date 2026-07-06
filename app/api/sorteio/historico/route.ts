// app/api/sorteio/historico/route.ts
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
    const evento_id = searchParams.get('evento_id')

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id é obrigatório' }, { status: 400 })
    }

    // Buscar sorteios do evento
    const { data: sorteios, error: sError } = await supabase
      .from('sorteios')
      .select('*')
      .eq('evento_id', evento_id)
      .order('created_at', { ascending: false })

    if (sError) {
      return NextResponse.json({ error: sError.message }, { status: 500 })
    }

    if (!sorteios || sorteios.length === 0) {
      return NextResponse.json({ sorteios: [] })
    }

    // Buscar ganhadores de todos os sorteios
    const sorteioIds = sorteios.map(s => s.id)
    const { data: ganhadores, error: gError } = await supabase
      .from('sorteio_ganhadores')
      .select('*')
      .in('sorteio_id', sorteioIds)
      .order('posicao', { ascending: true })

    if (gError) {
      return NextResponse.json({ error: gError.message }, { status: 500 })
    }

    // Buscar dados dos checkins dos ganhadores
    const checkinIds = [...new Set((ganhadores || []).map(g => g.checkin_id))]
    const { data: checkins } = await supabase
      .from('checkins')
      .select('id, nome_completo, email, telefone, cpf, sexo, pelotao')
      .in('id', checkinIds.length > 0 ? checkinIds : ['00000000-0000-0000-0000-000000000000'])

    const checkinMap = new Map((checkins || []).map(c => [c.id, c]))

    // Montar resposta
    const resultado = sorteios.map(s => ({
      ...s,
      ganhadores: (ganhadores || [])
        .filter(g => g.sorteio_id === s.id)
        .map(g => ({
          ...g,
          checkin: checkinMap.get(g.checkin_id) || null,
        })),
    }))

    return NextResponse.json({ sorteios: resultado })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { searchParams } = new URL(req.url)
    const evento_id = searchParams.get('evento_id')

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id é obrigatório' }, { status: 400 })
    }

    // Buscar sorteios do evento
    const { data: sorteios } = await supabase
      .from('sorteios')
      .select('id')
      .eq('evento_id', evento_id)

    if (!sorteios || sorteios.length === 0) {
      return NextResponse.json({ success: true })
    }

    const sorteioIds = sorteios.map(s => s.id)

    // Deletar ganhadores primeiro
    await supabase
      .from('sorteio_ganhadores')
      .delete()
      .in('sorteio_id', sorteioIds)

    // Deletar sorteios
    const { error } = await supabase
      .from('sorteios')
      .delete()
      .eq('evento_id', evento_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
