import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'
import { criarTokenEdicao } from '@/lib/wings/edicao'
import { clientIp, rateLimit } from '@/lib/rate-limit'

// POST público: cria atlética competidora + 4 atletas (2M+2F, modalidades 1-4)
// numa transação lógica. Sem auth (qualquer atlética pode cadastrar sua equipe).
//
// Body:
// {
//   nome, sigla?, cor?, foto_url?,
//   atletas: [{ nome, sexo: 'M'|'F', modalidade: 1|2|3|4 } x4]
// }

type AtletaInput = { nome: string; sexo: 'M' | 'F'; modalidade: number }

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const limite = await rateLimit(`wings:equipe:${ip}`, 10, 600)
  if (!limite.ok) {
    return NextResponse.json(
      { error: 'Muitos cadastros. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  // Validação básica da equipe
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  if (!nome || nome.length < 2 || nome.length > 80) {
    return NextResponse.json({ error: 'Nome da equipe inválido (2-80 caracteres).' }, { status: 400 })
  }
  const sigla =
    typeof body.sigla === 'string' && body.sigla.trim()
      ? body.sigla.trim().toUpperCase().slice(0, 6)
      : null
  const cor =
    typeof body.cor === 'string' && /^#[0-9a-f]{6}$/i.test(body.cor) ? body.cor : '#E30D3F'
  const foto_url = typeof body.foto_url === 'string' && body.foto_url.startsWith('http') ? body.foto_url : null

  // Validação dos 4 atletas
  if (!Array.isArray(body.atletas) || body.atletas.length !== 4) {
    return NextResponse.json({ error: 'Envie exatamente 4 atletas.' }, { status: 400 })
  }
  const atletas: AtletaInput[] = []
  for (const a of body.atletas as AtletaInput[]) {
    const an = typeof a?.nome === 'string' ? a.nome.trim() : ''
    if (!an) return NextResponse.json({ error: 'Todos os atletas precisam de nome.' }, { status: 400 })
    if (a.sexo !== 'M' && a.sexo !== 'F') {
      return NextResponse.json({ error: 'Sexo inválido (M ou F).' }, { status: 400 })
    }
    const mod = Number(a.modalidade)
    if (!Number.isInteger(mod) || mod < 1 || mod > 4) {
      return NextResponse.json({ error: 'Modalidade inválida (1-4).' }, { status: 400 })
    }
    atletas.push({ nome: an, sexo: a.sexo, modalidade: mod })
  }

  // 2M + 2F + modalidades únicas (1,2,3,4)
  const masc = atletas.filter(a => a.sexo === 'M').length
  const fem = atletas.filter(a => a.sexo === 'F').length
  if (masc !== 2 || fem !== 2) {
    return NextResponse.json({ error: 'A equipe precisa ter 2 atletas masculinos e 2 femininas.' }, { status: 400 })
  }
  const mods = new Set(atletas.map(a => a.modalidade))
  if (mods.size !== 4) {
    return NextResponse.json({ error: 'Cada atleta deve estar em uma modalidade diferente (1, 2, 3 e 4).' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Bloqueia nome duplicado (case-insensitive)
  const { data: existente } = await supabase
    .from('wings_comp_atleticas')
    .select('id, nome')
    .ilike('nome', nome)
    .limit(1)
  if (existente && existente.length > 0) {
    return NextResponse.json(
      { error: `Já existe uma equipe com o nome "${existente[0].nome}". Use outro nome ou peça pro staff editar.` },
      { status: 409 }
    )
  }

  // Cria atlética
  const { data: atletica, error: errA } = await supabase
    .from('wings_comp_atleticas')
    .insert({ nome, sigla, cor, foto_url })
    .select('*')
    .single()
  if (errA || !atletica) {
    return NextResponse.json({ error: errA?.message || 'Erro ao criar equipe.' }, { status: 500 })
  }

  // Cria atletas
  const { error: errB } = await supabase.from('wings_comp_atletas').insert(
    atletas.map(a => ({
      atletica_id: atletica.id,
      nome: a.nome,
      sexo: a.sexo,
      modalidade: a.modalidade,
    }))
  )
  if (errB) {
    // rollback parcial
    await supabase.from('wings_comp_atleticas').delete().eq('id', atletica.id)
    return NextResponse.json({ error: errB.message }, { status: 500 })
  }

  // O token sai uma vez só, no cadastro. É o que autoriza editar depois.
  return NextResponse.json({ atletica, edit_token: criarTokenEdicao(atletica.id) })
}
