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

    let query = supabase
      .from('cadastro_site')
      .select('id, nome_completo, email, whatsapp, cpf, sexo, data_nascimento, cep, data_de_cadastro')
      .order('id', { ascending: false })

    if (busca) {
      query = query.or(
        `nome_completo.ilike.%${busca}%,email.ilike.%${busca}%,cpf.ilike.%${busca}%,whatsapp.ilike.%${busca}%`
      )
    }

    const { data, error } = await query.limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ membros: data || [] })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
