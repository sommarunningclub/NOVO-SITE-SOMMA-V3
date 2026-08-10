import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'
import { isStaffAuthorized } from '@/lib/wings-cronometragem/auth'

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('wings_comp_atleticas')
    .select('*')
    .order('nome', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ atleticas: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.nome || typeof body.nome !== 'string') {
    return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
  }
  const nome = body.nome.trim()
  const supabase = getServiceClient()

  // Bloqueia duplicata case-insensitive
  const { data: existente } = await supabase
    .from('wings_comp_atleticas')
    .select('id, nome')
    .ilike('nome', nome)
    .limit(1)
  if (existente && existente.length > 0) {
    return NextResponse.json(
      { error: `Já existe uma equipe "${existente[0].nome}". Edite a existente.` },
      { status: 409 }
    )
  }

  const barras =
    body.barras != null && body.barras !== '' && Number.isFinite(Number(body.barras))
      ? Math.max(0, Math.min(999, Math.floor(Number(body.barras))))
      : 0
  const { data, error } = await supabase
    .from('wings_comp_atleticas')
    .insert({
      nome,
      sigla: body.sigla?.trim() || null,
      cor: body.cor || '#E30D3F',
      foto_url: body.foto_url || null,
      barras,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ atletica: data })
}

export async function PATCH(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (typeof body.nome === 'string') update.nome = body.nome.trim()
  if (typeof body.sigla === 'string' || body.sigla === null) {
    update.sigla = body.sigla?.trim() || null
  }
  if (typeof body.cor === 'string') update.cor = body.cor
  if (typeof body.foto_url === 'string' || body.foto_url === null) {
    update.foto_url = body.foto_url || null
  }
  if ('barras' in body) {
    if (body.barras === '' || body.barras == null) update.barras = 0
    else if (Number.isFinite(Number(body.barras))) {
      update.barras = Math.max(0, Math.min(999, Math.floor(Number(body.barras))))
    }
  }
  if ('classificada_final' in body) {
    update.classificada_final = !!body.classificada_final
  }

  const supabase = getServiceClient()

  // Se está mudando o nome, bloqueia colisão case-insensitive com outra equipe
  if (typeof update.nome === 'string') {
    const { data: existente } = await supabase
      .from('wings_comp_atleticas')
      .select('id, nome')
      .ilike('nome', update.nome as string)
      .neq('id', body.id)
      .limit(1)
    if (existente && existente.length > 0) {
      return NextResponse.json(
        { error: `Já existe outra equipe "${existente[0].nome}".` },
        { status: 409 }
      )
    }
  }
  const { data, error } = await supabase
    .from('wings_comp_atleticas')
    .update(update)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ atletica: data })
}

export async function DELETE(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase.from('wings_comp_atleticas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
