// app/api/sorteio/participantes/route.ts
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
    const sexo = searchParams.get('sexo')
    const pelotao = searchParams.get('pelotao')
    const data_inscricao = searchParams.get('data_inscricao')
    const validacao = searchParams.get('validacao')

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id é obrigatório' }, { status: 400 })
    }

    let query = supabase
      .from('checkins')
      .select('id, nome_completo, email, telefone, cpf, sexo, pelotao, data_hora_checkin, validacao_do_checkin')
      .eq('evento_id', evento_id)
      .order('data_hora_checkin', { ascending: true })

    if (sexo && sexo !== 'todos') {
      query = query.eq('sexo', sexo)
    }
    if (pelotao && pelotao !== 'todos') {
      query = query.eq('pelotao', pelotao)
    }
    if (data_inscricao) {
      query = query.eq('data_do_evento', data_inscricao)
    }
    if (validacao === 'validados') {
      query = query.eq('validacao_do_checkin', true)
    } else if (validacao === 'pendentes') {
      query = query.eq('validacao_do_checkin', false)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const participantes = (data || []).map((p, i) => ({
      ...p,
      numero: i + 1,
    }))

    const stats = {
      total: participantes.length,
      masculino: participantes.filter(p => p.sexo === 'masculino').length,
      feminino: participantes.filter(p => p.sexo === 'feminino').length,
      por_pelotao: participantes.reduce((acc: Record<string, number>, p) => {
        const key = p.pelotao || 'sem_pelotao'
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {}),
      validados: participantes.filter(p => p.validacao_do_checkin).length,
      pendentes: participantes.filter(p => !p.validacao_do_checkin).length,
    }

    return NextResponse.json({ participantes, stats })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
