import { NextResponse } from 'next/server'
import { fisherYatesShuffle, gerarHashAuditoria } from '@/lib/sorteio/utils'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const body = await req.json()
    const { evento_id, titulo, quantidade, filtros, criado_por } = body

    if (!evento_id || !titulo || !quantidade) {
      return NextResponse.json({ error: 'evento_id, titulo e quantidade são obrigatórios' }, { status: 400 })
    }

    // Buscar participantes com filtros
    let query = supabase
      .from('checkins')
      .select('id, nome_completo, email, telefone, cpf, sexo, pelotao, data_hora_checkin, validacao_do_checkin')
      .eq('evento_id', evento_id)
      .order('data_hora_checkin', { ascending: true })

    if (filtros?.sexo && filtros.sexo !== 'todos') {
      query = query.eq('sexo', filtros.sexo)
    }
    if (filtros?.pelotao && filtros.pelotao !== 'todos') {
      query = query.eq('pelotao', filtros.pelotao)
    }
    if (filtros?.data_inscricao) {
      query = query.eq('data_do_evento', filtros.data_inscricao)
    }
    if (filtros?.validacao === 'validados') {
      query = query.eq('validacao_do_checkin', true)
    } else if (filtros?.validacao === 'pendentes') {
      query = query.eq('validacao_do_checkin', false)
    }

    const { data: participantes, error: pError } = await query

    if (pError) {
      return NextResponse.json({ error: pError.message }, { status: 500 })
    }

    if (!participantes || participantes.length === 0) {
      return NextResponse.json({ error: 'Nenhum participante encontrado com os filtros aplicados' }, { status: 400 })
    }

    if (quantidade > participantes.length) {
      return NextResponse.json({
        error: `Quantidade (${quantidade}) maior que participantes disponíveis (${participantes.length})`,
      }, { status: 400 })
    }

    // Enumerar e embaralhar
    const numerados = participantes.map((p, i) => ({ ...p, numero: i + 1 }))
    const embaralhados = fisherYatesShuffle(numerados)
    const sorteados = embaralhados.slice(0, quantidade)

    // Gerar hash de auditoria SHA-256
    const timestamp = new Date().toISOString()
    const auditHash = await gerarHashAuditoria({
      candidatoIds: participantes.map(p => p.id),
      ganhadorIds: sorteados.map(p => p.id),
      timestamp,
      eventoId: evento_id,
    })

    // Criar registro do sorteio
    const { data: sorteio, error: sError } = await supabase
      .from('sorteios')
      .insert({
        evento_id,
        titulo,
        filtros_aplicados: filtros || {},
        total_elegiveis: participantes.length,
        criado_por: criado_por || auth.insider.nome,
        audit_hash: auditHash,
      })
      .select()
      .single()

    if (sError) {
      return NextResponse.json({ error: sError.message }, { status: 500 })
    }

    // Inserir ganhadores
    const ganhadores = sorteados.map((p, i) => ({
      sorteio_id: sorteio.id,
      checkin_id: p.id,
      posicao: i + 1,
      numero_sorteado: p.numero,
      status: 'pendente',
    }))

    const { data: ganhadoresInseridos, error: gError } = await supabase
      .from('sorteio_ganhadores')
      .insert(ganhadores)
      .select()

    if (gError) {
      return NextResponse.json({ error: gError.message }, { status: 500 })
    }

    // Montar resposta com dados do checkin
    const resultado = (ganhadoresInseridos || []).map(g => {
      const checkin = sorteados.find(p => p.id === g.checkin_id)
      return {
        ...g,
        checkin: checkin ? {
          nome_completo: checkin.nome_completo,
          email: checkin.email,
          telefone: checkin.telefone,
          cpf: checkin.cpf,
          sexo: checkin.sexo,
          pelotao: checkin.pelotao,
        } : null,
      }
    })

    return NextResponse.json({
      sorteio: { ...sorteio, ganhadores: resultado },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
