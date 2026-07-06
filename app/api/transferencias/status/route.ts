import { NextRequest, NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const eventoId = searchParams.get('evento_id')

    if (!eventoId) {
      return NextResponse.json({ habilitada: false }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('transferencia_habilitada')
      .eq('id', eventoId)
      .single()

    if (error || !data) {
      return NextResponse.json({ habilitada: false })
    }

    return NextResponse.json({ habilitada: !!data.transferencia_habilitada })
  } catch {
    return NextResponse.json({ habilitada: false })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { evento_id, habilitada } = await req.json()

    if (!evento_id || typeof habilitada !== 'boolean') {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('eventos')
      .update({ transferencia_habilitada: habilitada })
      .eq('id', evento_id)
      .select('id, transferencia_habilitada')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, habilitada: data.transferencia_habilitada })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
