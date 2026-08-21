import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'
import { lerTokenEdicao } from '@/lib/wings/edicao'
import { isStaffAuthorized } from '@/lib/wings-cronometragem/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

// PATCH /api/wings-comp/equipe-publica/editar
// Edição da própria equipe — atualiza atlética + lista de 4 atletas em
// uma operação atômica lógica. Mantém os IDs dos atletas existentes
// (delete+insert seria caro). Aceita o mesmo body do cadastro:
// {
//   id, nome, sigla?, cor?, foto_url?,
//   atletas: [{ id?, nome, sexo, modalidade } x4]
// }
//
// Decisões de segurança:
// - Não permite mudar a quantidade (sempre 4 atletas)
// - Não permite deletar a equipe inteira (só admin)
// - Bloqueia mudança de nome se já existe outra equipe com esse nome
// - Exige o `edit_token` emitido no cadastro (ou sessão de staff): sem isso,
//   qualquer um achava a equipe pela busca e reescrevia a lista de atletas
type AtletaPatch = { id?: string; nome: string; sexo: 'M' | 'F'; modalidade: number }

export async function PATCH(req: NextRequest) {
  const ip = clientIp(req)
  const limite = await rateLimit(`wings:editar:${ip}`, 20, 600)
  if (!limite.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body?.id) {
    return NextResponse.json({ error: 'id da equipe obrigatório.' }, { status: 400 })
  }

  // Dono da equipe (token do cadastro) ou staff. Nada mais entra.
  const tokenDono = lerTokenEdicao(
    req.headers.get('x-wings-edit-token') ?? (typeof body.edit_token === 'string' ? body.edit_token : null)
  )
  if (tokenDono !== body.id && !(await isStaffAuthorized())) {
    return NextResponse.json(
      { error: 'Edição não autorizada. Use o dispositivo em que a equipe foi cadastrada ou fale com o staff.' },
      { status: 403 }
    )
  }

  const supabase = getServiceClient()

  // Confirma que a equipe existe
  const { data: equipe, error: errE } = await supabase
    .from('wings_comp_atleticas')
    .select('id, nome')
    .eq('id', body.id)
    .single()
  if (errE || !equipe) {
    return NextResponse.json({ error: 'Equipe não encontrada.' }, { status: 404 })
  }

  // Validações da equipe
  const nome = typeof body.nome === 'string' ? body.nome.trim() : equipe.nome
  if (!nome || nome.length < 2 || nome.length > 80) {
    return NextResponse.json({ error: 'Nome inválido (2-80 caracteres).' }, { status: 400 })
  }
  const sigla =
    typeof body.sigla === 'string' && body.sigla.trim()
      ? body.sigla.trim().toUpperCase().slice(0, 6)
      : null
  const cor =
    typeof body.cor === 'string' && /^#[0-9a-f]{6}$/i.test(body.cor) ? body.cor : '#E30D3F'
  const foto_url =
    body.foto_url === null
      ? null
      : typeof body.foto_url === 'string' && body.foto_url.startsWith('http')
        ? body.foto_url
        : null

  // Bloqueia colisão de nome com outra equipe
  if (nome.toLowerCase() !== equipe.nome.toLowerCase()) {
    const { data: existente } = await supabase
      .from('wings_comp_atleticas')
      .select('id, nome')
      .ilike('nome', nome)
      .neq('id', body.id)
      .limit(1)
    if (existente && existente.length > 0) {
      return NextResponse.json(
        { error: `Já existe outra equipe com o nome "${existente[0].nome}".` },
        { status: 409 }
      )
    }
  }

  // Validação dos atletas
  if (!Array.isArray(body.atletas) || body.atletas.length !== 4) {
    return NextResponse.json({ error: 'A equipe precisa ter exatamente 4 atletas.' }, { status: 400 })
  }
  const atletas: AtletaPatch[] = []
  for (const a of body.atletas as AtletaPatch[]) {
    const an = typeof a?.nome === 'string' ? a.nome.trim() : ''
    if (!an) return NextResponse.json({ error: 'Todos os atletas precisam de nome.' }, { status: 400 })
    if (a.sexo !== 'M' && a.sexo !== 'F') {
      return NextResponse.json({ error: 'Sexo inválido.' }, { status: 400 })
    }
    const mod = Number(a.modalidade)
    if (!Number.isInteger(mod) || mod < 1 || mod > 4) {
      return NextResponse.json({ error: 'Modalidade inválida (1-4).' }, { status: 400 })
    }
    atletas.push({ id: a.id, nome: an, sexo: a.sexo, modalidade: mod })
  }
  const masc = atletas.filter(a => a.sexo === 'M').length
  const fem = atletas.filter(a => a.sexo === 'F').length
  if (masc !== 2 || fem !== 2) {
    return NextResponse.json({ error: 'A equipe precisa ter 2M + 2F.' }, { status: 400 })
  }
  const mods = new Set(atletas.map(a => a.modalidade))
  if (mods.size !== 4) {
    return NextResponse.json(
      { error: 'Cada atleta deve estar em uma modalidade diferente (1, 2, 3 e 4).' },
      { status: 400 }
    )
  }

  // Atualiza atlética
  const { error: errU } = await supabase
    .from('wings_comp_atleticas')
    .update({ nome, sigla, cor, foto_url })
    .eq('id', body.id)
  if (errU) return NextResponse.json({ error: errU.message }, { status: 500 })

  // Estratégia simples e segura: apaga atletas atuais e recria os 4.
  // Como não temos runs por-atleta (só por equipe), não há FK pra preservar.
  const { error: errDel } = await supabase
    .from('wings_comp_atletas')
    .delete()
    .eq('atletica_id', body.id)
  if (errDel) return NextResponse.json({ error: errDel.message }, { status: 500 })

  const { error: errIns } = await supabase.from('wings_comp_atletas').insert(
    atletas.map(a => ({
      atletica_id: body.id,
      nome: a.nome,
      sexo: a.sexo,
      modalidade: a.modalidade,
    }))
  )
  if (errIns) return NextResponse.json({ error: errIns.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
