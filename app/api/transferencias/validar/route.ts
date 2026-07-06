import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function mascararNome(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return partes
    .map((p, i) => {
      if (i === 0) return p
      if (p.length <= 2) return p[0] + '*'
      return p[0] + '*'.repeat(p.length - 1)
    })
    .join(' ')
}

function mascararEmail(email: string) {
  const [local, dominio] = email.split('@')
  if (!local || !dominio) return email
  const visivel = local.slice(0, 2)
  return `${visivel}${'*'.repeat(Math.max(local.length - 2, 2))}@${dominio}`
}

function deadlinePassou(dataEvento: string) {
  if (!dataEvento) return false
  const [y, m, d] = dataEvento.split('-').map(Number)
  const deadline = new Date(y, m - 1, d, 6, 30, 0, 0)
  return Date.now() > deadline.getTime()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { evento_id, cpf, email } = await request.json()

    if (!evento_id || !cpf || !email) {
      return NextResponse.json(
        { error: 'Evento, CPF e e-mail são obrigatórios.' },
        { status: 400 }
      )
    }

    const { data: evento } = await supabase
      .from('eventos')
      .select('transferencia_habilitada')
      .eq('id', evento_id)
      .single()

    if (!evento?.transferencia_habilitada) {
      return NextResponse.json(
        { error: 'Transferências não estão disponíveis no momento.' },
        { status: 403 }
      )
    }

    const cpfLimpo = String(cpf).replace(/\D/g, '')
    const emailNorm = String(email).trim().toLowerCase()

    const { data: inscricoes, error } = await supabase
      .from('checkins')
      .select('id, nome_completo, email, cpf, pelotao, nome_do_evento, data_do_evento, status')
      .eq('evento_id', evento_id)
      .eq('status', 'ativo')

    if (error) {
      console.error('[transferencias/validar] erro supabase:', error)
      return NextResponse.json({ error: 'Erro ao consultar inscrições.' }, { status: 500 })
    }

    const inscricao = inscricoes?.find(
      i =>
        i.cpf &&
        i.cpf.replace(/\D/g, '') === cpfLimpo &&
        i.email &&
        i.email.trim().toLowerCase() === emailNorm
    )

    if (!inscricao) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada ou já transferida. Verifique CPF e e-mail.' },
        { status: 404 }
      )
    }

    if (deadlinePassou(inscricao.data_do_evento)) {
      return NextResponse.json(
        { error: 'O prazo para transferência encerrou (até 06h30 do dia do evento).' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      inscricao: {
        id: inscricao.id,
        nome_mascarado: mascararNome(inscricao.nome_completo),
        email_mascarado: mascararEmail(inscricao.email),
        pelotao: inscricao.pelotao,
        nome_do_evento: inscricao.nome_do_evento,
        data_do_evento: inscricao.data_do_evento,
      },
    })
  } catch (err) {
    console.error('[transferencias/validar] erro:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
