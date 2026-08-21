import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { lerAutorizacao } from '@/lib/transferencias/otp'

export const dynamic = 'force-dynamic'

// A transferência só acontece com a autorização assinada que
// `/api/transferencias/validar` emite DEPOIS de o titular digitar o código
// recebido por e-mail. Inscrição, evento, CPF e e-mail de origem saem de lá —
// não do corpo da requisição, que antes era tudo o que se exigia.

function deadlinePassou(dataEvento: string) {
  if (!dataEvento) return false
  const [y, m, d] = dataEvento.split('-').map(Number)
  const deadline = new Date(y, m - 1, d, 6, 30, 0, 0)
  return Date.now() > deadline.getTime()
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`transf:confirmar:${ip}`, 10, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
      )
    }

    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const body = await request.json()
    const { autorizacao, dados_novo } = body

    const permissao = lerAutorizacao(autorizacao)
    if (!permissao) {
      return NextResponse.json(
        { error: 'Autorização expirada. Refaça a verificação por e-mail.' },
        { status: 401 }
      )
    }
    if (!dados_novo) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const inscricao_original_id = permissao.inscricaoId
    const evento_id = permissao.eventoId
    const cpf_origem = permissao.cpfOrigem
    const email_origem = permissao.emailOrigem

    const { data: eventoFlag } = await supabase
      .from('eventos')
      .select('transferencia_habilitada')
      .eq('id', evento_id)
      .single()

    if (!eventoFlag?.transferencia_habilitada) {
      return NextResponse.json(
        { error: 'Transferências não estão disponíveis no momento.' },
        { status: 403 }
      )
    }

    const { nome, email, telefone, cpf, sexo, pelotao } = dados_novo
    if (!nome || !email || !telefone || !cpf || !sexo) {
      return NextResponse.json(
        { error: 'Preencha todos os dados do novo titular.' },
        { status: 400 }
      )
    }

    const cpfOrigemLimpo = String(cpf_origem).replace(/\D/g, '')
    const cpfDestinoLimpo = String(cpf).replace(/\D/g, '')
    const emailOrigemNorm = String(email_origem).trim().toLowerCase()
    const emailDestinoNorm = String(email).trim().toLowerCase()

    if (cpfOrigemLimpo === cpfDestinoLimpo) {
      return NextResponse.json(
        { error: 'O CPF de destino não pode ser o mesmo do titular atual.' },
        { status: 400 }
      )
    }

    // 1. Revalidar inscrição original (status + CPF + email bate)
    const { data: original, error: errOrig } = await supabase
      .from('checkins')
      .select('id, nome_completo, email, cpf, status, evento_id, data_do_evento, nome_do_evento')
      .eq('id', inscricao_original_id)
      .single()

    if (errOrig || !original) {
      return NextResponse.json({ error: 'Inscrição original não encontrada.' }, { status: 404 })
    }

    if (original.status !== 'ativo') {
      return NextResponse.json(
        { error: 'Esta inscrição já foi transferida ou cancelada.' },
        { status: 409 }
      )
    }

    if (original.evento_id !== evento_id) {
      return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 })
    }

    if (
      (original.cpf || '').replace(/\D/g, '') !== cpfOrigemLimpo ||
      (original.email || '').trim().toLowerCase() !== emailOrigemNorm
    ) {
      return NextResponse.json(
        { error: 'Dados do titular não conferem.' },
        { status: 403 }
      )
    }

    if (deadlinePassou(original.data_do_evento)) {
      return NextResponse.json(
        { error: 'O prazo para transferência encerrou (até 06h30 do dia do evento).' },
        { status: 403 }
      )
    }

    // 2. Verificar se CPF de destino já está inscrito no evento
    const { data: existentes } = await supabase
      .from('checkins')
      .select('id, cpf, status')
      .eq('evento_id', evento_id)

    const jaInscrito = existentes?.some(
      e =>
        e.cpf &&
        e.cpf.replace(/\D/g, '') === cpfDestinoLimpo &&
        e.status === 'ativo'
    )

    if (jaInscrito) {
      return NextResponse.json(
        { error: 'O CPF do novo titular já possui inscrição ativa neste evento.' },
        { status: 409 }
      )
    }

    // 3. Substituir dados da inscrição original pelos do novo titular
    //    (update condicional em status='ativo' evita race condition)
    const { data: atualizada, error: errUpd } = await supabase
      .from('checkins')
      .update({
        nome_completo: nome,
        email: emailDestinoNorm,
        telefone,
        cpf: cpfDestinoLimpo,
        sexo,
        pelotao: pelotao || null,
        data_hora_checkin: new Date().toISOString(),
        validacao_do_checkin: false,
        transferido_em: new Date().toISOString(),
      })
      .eq('id', inscricao_original_id)
      .eq('status', 'ativo')
      .select()
      .single()

    if (errUpd || !atualizada) {
      return NextResponse.json(
        { error: 'Não foi possível concluir a transferência. Tente novamente.' },
        { status: 409 }
      )
    }

    // 4. Log em transferencias (inscricao_original_id = inscricao_nova_id, pois é a mesma linha)
    const { data: transf, error: errTransf } = await supabase
      .from('transferencias')
      .insert([
        {
          evento_id,
          inscricao_original_id,
          inscricao_nova_id: inscricao_original_id,
          cpf_origem: cpfOrigemLimpo,
          cpf_destino: cpfDestinoLimpo,
          email_origem: emailOrigemNorm,
          email_destino: emailDestinoNorm,
          nome_origem: original.nome_completo,
          nome_destino: nome,
          origem: 'usuario',
        },
      ])
      .select()
      .single()

    if (errTransf) {
      console.error('[transferencias/confirmar] erro log:', errTransf)
    }

    return NextResponse.json({
      success: true,
      transferencia_id: transf?.id || null,
      nova_inscricao: {
        id: atualizada.id,
        nome_completo: atualizada.nome_completo,
        cpf: atualizada.cpf,
        pelotao: atualizada.pelotao,
        nome_do_evento: atualizada.nome_do_evento,
        data_do_evento: atualizada.data_do_evento,
      },
    })
  } catch (err) {
    console.error('[transferencias/confirmar] erro:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
