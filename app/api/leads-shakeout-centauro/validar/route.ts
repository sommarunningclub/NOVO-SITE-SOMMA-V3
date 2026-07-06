import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'

const ORIGEM = 'shakeout-centauro-somma-rj'

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase não configurado')
  return createClient(url, key)
}

// ─── Listagem dos check-ins do Shake Out (com busca por nome/CPF) ───
export async function GET(req: Request) {
  const insiderAuth = await requireInsiderAuth()
  if (!insiderAuth.ok) return insiderAuth.response

  try {
    const { searchParams } = new URL(req.url)
    const busca = (searchParams.get('busca') || '').trim()
    const supabase = db()

    let query = supabase
      .from('leads_shakeout_centauro')
      .select('id, nome_completo, cpf, email, telefone, uf, sexo, validacao_do_checkin, validated_at, data_de_cadastro')
      .eq('origem', ORIGEM)
      .order('nome_completo', { ascending: true })
      .limit(2000)

    if (busca) {
      const digits = busca.replace(/\D/g, '')
      if (digits.length >= 3) query = query.or(`nome_completo.ilike.%${busca}%,cpf.ilike.%${digits}%`)
      else query = query.ilike('nome_completo', `%${busca}%`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      checkins: data || [],
      evento: { nome_do_evento: 'Shake Out Somma + Centauro', origem: ORIGEM },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── Validar / desvalidar um check-in (libera a entrada) ───
export async function PATCH(req: Request) {
  const insiderAuth = await requireInsiderAuth()
  if (!insiderAuth.ok) return insiderAuth.response

  try {
    const { id, validacao_do_checkin } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const supabase = db()
    const { error } = await supabase
      .from('leads_shakeout_centauro')
      .update({
        validacao_do_checkin: Boolean(validacao_do_checkin),
        validated_at: validacao_do_checkin
          ? new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '-03:00'
          : null,
      })
      .eq('id', id)
      .eq('origem', ORIGEM)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
