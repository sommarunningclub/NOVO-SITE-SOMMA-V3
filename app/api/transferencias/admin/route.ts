import { NextRequest, NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  const supabase = getServiceSupabase()
  if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

  try {
    const body = await request.json()
    const { inscricao_original_id, evento_id, dados_novo, admin_user_id } = body

    if (!inscricao_original_id || !evento_id || !dados_novo) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const { nome, email, telefone, cpf, sexo, pelotao } = dados_novo
    if (!nome || !email || !telefone || !cpf || !sexo) {
      return NextResponse.json(
        { error: 'Preencha todos os dados do novo titular.' },
        { status: 400 }
      )
    }

    const cpfDestinoLimpo = String(cpf).replace(/\D/g, '')
    const emailDestinoNorm = String(email).trim().toLowerCase()

    // Buscar original (admin não valida e-mail/cpf do origem)
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

    if ((original.cpf || '').replace(/\D/g, '') === cpfDestinoLimpo) {
      return NextResponse.json(
        { error: 'O CPF de destino não pode ser o mesmo do titular atual.' },
        { status: 400 }
      )
    }

    // Verificar duplicidade
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

    // Substituir dados da inscrição pelos do novo titular
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
        { error: 'Não foi possível concluir a transferência.' },
        { status: 409 }
      )
    }

    const { data: transf } = await supabase
      .from('transferencias')
      .insert([
        {
          evento_id,
          inscricao_original_id,
          inscricao_nova_id: inscricao_original_id,
          cpf_origem: (original.cpf || '').replace(/\D/g, ''),
          cpf_destino: cpfDestinoLimpo,
          email_origem: (original.email || '').trim().toLowerCase(),
          email_destino: emailDestinoNorm,
          nome_origem: original.nome_completo,
          nome_destino: nome,
          origem: 'admin',
          admin_user_id: admin_user_id || auth.insider.nome,
        },
      ])
      .select()
      .single()

    return NextResponse.json({
      success: true,
      transferencia_id: transf?.id || null,
      nova_inscricao: atualizada,
    })
  } catch (err) {
    console.error('[transferencias/admin] erro:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
