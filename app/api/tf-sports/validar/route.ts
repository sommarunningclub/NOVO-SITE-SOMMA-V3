import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'

// Atletas do Treinão do Somma Special Day (integração TF Sports).
// Nome da tabela tem hífen → usar exatamente 'tf-sports'.
const TABLE = 'tf-sports'

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase não configurado')
  return createClient(url, key)
}

// ─── Listagem dos atletas (com busca por nome/CPF) ───
export async function GET(req: Request) {
  const insiderAuth = await requireInsiderAuth()
  if (!insiderAuth.ok) return insiderAuth.response

  try {
    const { searchParams } = new URL(req.url)
    const busca = (searchParams.get('busca') || '').trim()
    const supabase = db()

    const build = (cols: string) => {
      let q = supabase.from(TABLE).select(cols).order('nome_atleta', { ascending: true }).limit(2000)
      if (busca) {
        const digits = busca.replace(/\D/g, '')
        if (digits.length >= 3) q = q.or(`nome_atleta.ilike.%${busca}%,documento.ilike.%${digits}%`)
        else q = q.ilike('nome_atleta', `%${busca}%`)
      }
      return q
    }

    const FULL = 'id, nome_atleta, documento, genero, tamanho_camiseta, validacao_do_checkin, validated_at, created_at'
    const BASE = 'id, nome_atleta, documento, genero, tamanho_camiseta, created_at'

    const first = await build(FULL)
    let rows = (first.data as unknown as Record<string, unknown>[] | null) || null
    let error = first.error

    // Resiliência: se as colunas de validação ainda não foram criadas (SQL não
    // rodou), degrada — lista carrega com todos "aguardando validação".
    let migracaoPendente = false
    if (error && (error.code === '42703' || /validacao_do_checkin|validated_at/.test(error.message || ''))) {
      migracaoPendente = true
      const fb = await build(BASE)
      if (fb.error) return NextResponse.json({ error: fb.error.message }, { status: 500 })
      rows = ((fb.data as unknown as Record<string, unknown>[] | null) || []).map((r) => ({
        ...r,
        validacao_do_checkin: false,
        validated_at: null,
      }))
      error = null
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      checkins: rows || [],
      evento: { nome_do_evento: 'Treinão · Somma Special Day (TF Sports)' },
      migracao_pendente: migracaoPendente,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── Validar / desvalidar a entrada de um atleta ───
export async function PATCH(req: Request) {
  const insiderAuth = await requireInsiderAuth()
  if (!insiderAuth.ok) return insiderAuth.response

  try {
    const { id, validacao_do_checkin } = await req.json()
    if (id === undefined || id === null) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const supabase = db()
    const { error } = await supabase
      .from(TABLE)
      .update({
        validacao_do_checkin: Boolean(validacao_do_checkin),
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
