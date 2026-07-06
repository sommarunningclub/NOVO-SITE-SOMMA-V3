import { NextRequest, NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { searchParams } = new URL(req.url)
    const eventoId = searchParams.get('evento_id') || ''
    const busca = (searchParams.get('busca') || '').trim()

    let query = supabase
      .from('transferencias')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (eventoId) query = query.eq('evento_id', eventoId)

    if (busca) {
      const b = busca.replace(/\D/g, '')
      query = query.or(
        `nome_origem.ilike.%${busca}%,nome_destino.ilike.%${busca}%,cpf_origem.ilike.%${b}%,cpf_destino.ilike.%${b}%,email_origem.ilike.%${busca}%,email_destino.ilike.%${busca}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('[transferencias/listar] erro:', error)
      return NextResponse.json({ transferencias: [] }, { status: 200 })
    }

    return NextResponse.json({ transferencias: data || [] })
  } catch (err) {
    console.error('[transferencias/listar] erro:', err)
    return NextResponse.json({ transferencias: [] })
  }
}
