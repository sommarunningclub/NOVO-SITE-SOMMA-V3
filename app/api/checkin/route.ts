import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nome_completo,
      email,
      telefone,
      cpf,
      sexo,
      pelotao,
      data_do_evento,
      nome_do_evento,
      evento_id,
    } = body

    // Validação básica
    if (!nome_completo || !email || !telefone || !cpf || !sexo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Verificar duplicidade: mesmo CPF + mesmo evento
    if (evento_id) {
      const cpfLimpo = cpf.replace(/\D/g, '')
      const { data: existing } = await supabase
        .from('checkins')
        .select('id')
        .eq('evento_id', evento_id)
        .or(`cpf.eq.${cpfLimpo},cpf.eq.${cpf}`)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Você já está inscrito neste evento. Cada CPF pode ser cadastrado apenas uma vez por evento.' },
          { status: 409 }
        )
      }
    }

    // Inserir na tabela checkins
    const { data, error } = await supabase
      .from('checkins')
      .insert([
        {
          nome_completo,
          email,
          telefone,
          cpf,
          sexo,
          pelotao: pelotao || null,
          data_do_evento: data_do_evento || '',
          nome_do_evento: nome_do_evento || '',
          evento_id: evento_id || null,
          data_hora_checkin: new Date().toISOString(),
          validacao_do_checkin: false,
        },
      ])
      .select()

    if (error) {
      console.error('[v0] Erro ao inserir check-in:', error.message, error.details, error.hint)
      return NextResponse.json(
        { error: `Erro ao salvar check-in: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
