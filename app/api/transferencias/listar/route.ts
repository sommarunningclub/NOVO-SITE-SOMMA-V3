import { NextRequest, NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'
import { bateBusca, transferenciasDasInscricoes } from '@/lib/transferencias/inscricoes'

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

    if (error) console.error('[transferencias/listar] erro:', error)

    // Eventos com inscrição pela própria página (Love Run) guardam a
    // transferência na inscrição, não na tabela: entram junto na lista.
    const daPagina = eventoId
      ? (await transferenciasDasInscricoes(supabase, eventoId)).filter((t) => bateBusca(t, busca))
      : []

    const transferencias = [...(error ? [] : data || []), ...daPagina].sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at))
    )
    // Pelotões do evento: o formulário de edição só oferece os que existem.
    let pelotoes: string[] = []
    if (daPagina.length) {
      const { data: ev } = await supabase.from('eventos').select('pelotoes').eq('id', eventoId).maybeSingle()
      pelotoes = Array.isArray(ev?.pelotoes) ? ev.pelotoes.map(String) : []
    }
    return NextResponse.json({ transferencias, pelotoes })
  } catch (err) {
    console.error('[transferencias/listar] erro:', err)
    return NextResponse.json({ transferencias: [] })
  }
}
