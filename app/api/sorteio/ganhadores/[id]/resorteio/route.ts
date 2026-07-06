import { NextResponse } from 'next/server'
import { fisherYatesShuffle, gerarHashAuditoria } from '@/lib/sorteio/utils'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const { id } = await params

    // Buscar o ganhador ausente
    const { data: ganhadorAusente, error: gaError } = await supabase
      .from('sorteio_ganhadores')
      .select('*')
      .eq('id', id)
      .single()

    if (gaError || !ganhadorAusente) {
      return NextResponse.json({ error: 'Ganhador não encontrado' }, { status: 404 })
    }

    if (ganhadorAusente.status !== 'ausente') {
      return NextResponse.json({ error: 'Ganhador não está marcado como ausente' }, { status: 400 })
    }

    // Buscar o sorteio original e seus filtros
    const { data: sorteio, error: sError } = await supabase
      .from('sorteios')
      .select('*')
      .eq('id', ganhadorAusente.sorteio_id)
      .single()

    if (sError || !sorteio) {
      return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    }

    // Buscar todos os ganhadores deste sorteio (para excluir do pool)
    const { data: todosGanhadores } = await supabase
      .from('sorteio_ganhadores')
      .select('checkin_id')
      .eq('sorteio_id', sorteio.id)

    const idsExcluidos = new Set((todosGanhadores || []).map(g => g.checkin_id))

    // Buscar pool original com mesmos filtros
    const filtros = sorteio.filtros_aplicados || {}
    let query = supabase
      .from('checkins')
      .select('id, nome_completo, email, telefone, cpf, sexo, pelotao, data_hora_checkin, validacao_do_checkin')
      .eq('evento_id', sorteio.evento_id)
      .order('data_hora_checkin', { ascending: true })

    if (filtros.sexo && filtros.sexo !== 'todos') {
      query = query.eq('sexo', filtros.sexo)
    }
    if (filtros.pelotao && filtros.pelotao !== 'todos') {
      query = query.eq('pelotao', filtros.pelotao)
    }
    if (filtros.data_inscricao) {
      query = query.eq('data_do_evento', filtros.data_inscricao)
    }
    if (filtros.validacao === 'validados') {
      query = query.eq('validacao_do_checkin', true)
    } else if (filtros.validacao === 'pendentes') {
      query = query.eq('validacao_do_checkin', false)
    }

    const { data: pool, error: pError } = await query

    if (pError) {
      return NextResponse.json({ error: pError.message }, { status: 500 })
    }

    // Filtrar excluídos
    const disponiveis = (pool || []).filter(p => !idsExcluidos.has(p.id))

    if (disponiveis.length === 0) {
      return NextResponse.json({ error: 'Nenhum participante disponível para resorteio' }, { status: 400 })
    }

    // Sortear substituto
    const embaralhados = fisherYatesShuffle(disponiveis)
    const substituto = embaralhados[0]
    const numerados = (pool || []).map((p, i) => ({ ...p, numero: i + 1 }))
    const numeroSorteado = numerados.find(p => p.id === substituto.id)?.numero || 0

    // Hash de auditoria do resorteio
    const timestamp = new Date().toISOString()
    const auditHash = await gerarHashAuditoria({
      candidatoIds: disponiveis.map(p => p.id),
      ganhadorIds: [substituto.id],
      timestamp,
      eventoId: sorteio.evento_id,
    })

    // Inserir novo ganhador
    const { data: novoGanhador, error: ngError } = await supabase
      .from('sorteio_ganhadores')
      .insert({
        sorteio_id: sorteio.id,
        checkin_id: substituto.id,
        posicao: ganhadorAusente.posicao,
        numero_sorteado: numeroSorteado,
        status: 'pendente',
        audit_hash: auditHash,
      })
      .select()
      .single()

    if (ngError) {
      return NextResponse.json({ error: ngError.message }, { status: 500 })
    }

    // Atualizar ganhador ausente com referência ao substituto
    await supabase
      .from('sorteio_ganhadores')
      .update({ substituido_por: novoGanhador.id })
      .eq('id', id)

    return NextResponse.json({
      ganhador: {
        ...novoGanhador,
        checkin: {
          nome_completo: substituto.nome_completo,
          email: substituto.email,
          telefone: substituto.telefone,
          cpf: substituto.cpf,
          sexo: substituto.sexo,
          pelotao: substituto.pelotao,
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
