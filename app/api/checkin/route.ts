import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`checkin:${ip}`, 10, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
      )
    }

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuração do banco ausente' }, { status: 500 })
    }
    const body = await request.json()

    const {
      nome_completo,
      email,
      telefone,
      cpf,
      sexo,
      pelotao,
      evento_id,
    } = body

    // Validação básica
    if (!nome_completo || !email || !telefone || !cpf || !sexo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // O evento manda: sem evento aberto não existe check-in. Antes, `evento_id`
    // era opcional e nome/data do evento vinham do corpo — dava para se
    // inscrever em evento encerrado, ou inventar um evento que não existe.
    if (!evento_id) {
      return NextResponse.json({ error: 'Evento não informado.' }, { status: 400 })
    }

    // `select('*')` de propósito: `evento_encerrado` é uma coluna que pode não
    // existir em todo ambiente (o /api/eventos/status já trata a ausência dela),
    // e pedi-la nominalmente derrubaria o check-in inteiro com erro 42703.
    const { data: evento, error: eventoErro } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', evento_id)
      .maybeSingle()

    if (eventoErro) {
      console.error('[checkin] Erro ao carregar evento:', eventoErro.message)
      return NextResponse.json({ error: 'Erro ao validar o evento.' }, { status: 500 })
    }
    if (!evento) {
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
    }
    // Mesma regra que a tela aplica (`app/check-in/page.tsx`): encerrado e
    // bloqueado não recebem inscrição. A diferença é que agora ela vale no
    // servidor — antes bastava um POST direto para entrar em evento fechado.
    const status = String(evento.checkin_status ?? '')
    if (status === 'encerrado' || status === 'bloqueado' || evento.evento_encerrado === true) {
      return NextResponse.json(
        { error: 'O check-in deste evento não está aberto.' },
        { status: 403 }
      )
    }

    // Verificar duplicidade: mesmo CPF + mesmo evento
    const cpfLimpo = String(cpf).replace(/\D/g, '')
    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('evento_id', evento_id)
      // Duas grafias da mesma coluna: `in` é parâmetro, não string reparseada.
      .in('cpf', [cpfLimpo, String(cpf)])
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Você já está inscrito neste evento. Cada CPF pode ser cadastrado apenas uma vez por evento.' },
        { status: 409 }
      )
    }

    // Inserir na tabela checkins — nome e data do evento vêm da tabela `eventos`.
    const { error } = await supabase
      .from('checkins')
      .insert([
        {
          nome_completo,
          email,
          telefone,
          cpf,
          sexo,
          pelotao: pelotao || null,
          data_do_evento: evento.data_evento ?? '',
          nome_do_evento: evento.titulo ?? '',
          evento_id: evento.id,
          data_hora_checkin: new Date().toISOString(),
          validacao_do_checkin: false,
        },
      ])

    if (error) {
      console.error('[checkin] Erro ao inserir check-in:', error.message, error.details, error.hint)
      return NextResponse.json(
        { error: 'Erro ao salvar check-in.' },
        { status: 500 }
      )
    }

    // Resposta mínima: devolver a linha inteira era ecoar CPF, e-mail e telefone
    // de volta pela rede sem necessidade nenhuma para a tela.
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('[checkin] Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
