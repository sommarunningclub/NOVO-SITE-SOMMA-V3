import { NextRequest, NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

// GET é leitura pública e barata (status encerrado de 1 evento). Cache curto no
// edge (por evento_id) evita bater no banco a cada chamada. PATCH nunca é cacheado.
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' }

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const eventoId = searchParams.get('evento_id')

    if (!eventoId) {
      return NextResponse.json({ encerrado: false }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('evento_encerrado')
      .eq('id', eventoId)
      .single()

    // Se o erro é sobre coluna não existente, retornar false
    if (error?.message?.includes('column') || error?.message?.includes('evento_encerrado')) {
      return NextResponse.json({ encerrado: false }, { headers: CACHE_HEADERS })
    }

    if (error || !data) {
      return NextResponse.json({ encerrado: false }, { headers: CACHE_HEADERS })
    }

    return NextResponse.json({ encerrado: !!data.evento_encerrado }, { headers: CACHE_HEADERS })
  } catch {
    return NextResponse.json({ encerrado: false })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { evento_id, encerrado } = await req.json()

    if (!evento_id || typeof encerrado !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('eventos')
      .update({ evento_encerrado: encerrado })
      .eq('id', evento_id)
      .select('id, evento_encerrado')
      .single()

    // Se o erro é sobre coluna não existente, retornar um aviso
    if (error?.message?.includes('column') || error?.message?.includes('evento_encerrado')) {
      return NextResponse.json({ error: 'Coluna evento_encerrado não existe no banco de dados.' }, { status: 500 })
    }

    if (error || !data) {
      return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, encerrado: data.evento_encerrado })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
