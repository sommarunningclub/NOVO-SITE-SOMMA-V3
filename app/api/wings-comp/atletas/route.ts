import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'
import { isStaffAuthorized } from '@/lib/wings-cronometragem/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const atletica_id = searchParams.get('atletica_id')
  const supabase = getServiceClient()

  let q = supabase.from('wings_comp_atletas').select('*').order('modalidade', { ascending: true })
  if (atletica_id) q = q.eq('atletica_id', atletica_id)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ atletas: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.atletica_id || !body?.nome || !body?.sexo || !body?.modalidade) {
    return NextResponse.json({ error: 'Campos obrigatórios: atletica_id, nome, sexo, modalidade.' }, { status: 400 })
  }
  if (!['M', 'F'].includes(body.sexo)) {
    return NextResponse.json({ error: 'Sexo inválido.' }, { status: 400 })
  }
  const modalidade = Number(body.modalidade)
  if (!Number.isInteger(modalidade) || modalidade < 1 || modalidade > 4) {
    return NextResponse.json({ error: 'Modalidade deve ser 1-4.' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Validação 2M + 2F (e máx 1 atleta por modalidade na mesma equipe).
  const { data: existentes, error: errEx } = await supabase
    .from('wings_comp_atletas')
    .select('sexo, modalidade')
    .eq('atletica_id', body.atletica_id)
  if (errEx) return NextResponse.json({ error: errEx.message }, { status: 500 })

  const masculinos = (existentes ?? []).filter(a => a.sexo === 'M').length
  const femininos = (existentes ?? []).filter(a => a.sexo === 'F').length
  if (body.sexo === 'M' && masculinos >= 2) {
    return NextResponse.json({ error: 'Máximo 2 atletas masculinos por equipe.' }, { status: 400 })
  }
  if (body.sexo === 'F' && femininos >= 2) {
    return NextResponse.json({ error: 'Máximo 2 atletas femininas por equipe.' }, { status: 400 })
  }
  if ((existentes ?? []).some(a => a.modalidade === modalidade)) {
    return NextResponse.json({ error: 'Já existe atleta nesta modalidade na equipe.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('wings_comp_atletas')
    .insert({
      atletica_id: body.atletica_id,
      nome: body.nome.trim(),
      sexo: body.sexo,
      modalidade,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ atleta: data })
}

export async function PATCH(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (typeof body.nome === 'string') update.nome = body.nome.trim()
  if (body.sexo === 'M' || body.sexo === 'F') update.sexo = body.sexo
  if (Number.isInteger(body.modalidade) && body.modalidade >= 1 && body.modalidade <= 4) {
    update.modalidade = body.modalidade
  }

  const supabase = getServiceClient()

  // Se trocou sexo ou modalidade, valida 2M+2F e modalidade única no time
  if (update.sexo || update.modalidade) {
    const { data: alvo } = await supabase
      .from('wings_comp_atletas')
      .select('atletica_id, sexo, modalidade')
      .eq('id', body.id)
      .single()
    if (!alvo) return NextResponse.json({ error: 'Atleta não encontrado.' }, { status: 404 })

    const { data: outros } = await supabase
      .from('wings_comp_atletas')
      .select('id, sexo, modalidade')
      .eq('atletica_id', alvo.atletica_id)
      .neq('id', body.id)

    const novoSexo = (update.sexo as string) ?? alvo.sexo
    const novaMod = (update.modalidade as number) ?? alvo.modalidade

    const masc = (outros ?? []).filter(o => o.sexo === 'M').length + (novoSexo === 'M' ? 1 : 0)
    const fem = (outros ?? []).filter(o => o.sexo === 'F').length + (novoSexo === 'F' ? 1 : 0)
    if (masc > 2) return NextResponse.json({ error: 'Máximo 2 atletas masculinos.' }, { status: 400 })
    if (fem > 2) return NextResponse.json({ error: 'Máximo 2 atletas femininas.' }, { status: 400 })

    if ((outros ?? []).some(o => o.modalidade === novaMod)) {
      return NextResponse.json({ error: 'Outro atleta já está nessa modalidade.' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('wings_comp_atletas')
    .update(update)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ atleta: data })
}

export async function DELETE(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabase = getServiceClient()
  const { error } = await supabase.from('wings_comp_atletas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
