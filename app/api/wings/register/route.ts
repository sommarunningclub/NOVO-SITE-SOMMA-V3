import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, WINGS_EVENT_SLUG_TITLE } from '@/lib/wings/supabase'
import { registrationSchema } from '@/lib/wings/validations'

export const dynamic = 'force-dynamic'

type EventoLite = { id: string; titulo: string; data_evento: string }

async function getEvento(supabase: ReturnType<typeof getServiceClient>) {
  const { data } = await supabase
    .from('eventos')
    .select('id, titulo, data_evento')
    .eq('titulo', WINGS_EVENT_SLUG_TITLE)
    .maybeSingle()
  return data as EventoLite | null
}

const GENDER_TO_CHECKIN: Record<string, string> = {
  M: 'masculino',
  F: 'feminino',
  NB: 'outro',
  PNR: 'outro',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()
    const evento = await getEvento(supabase)
    if (!evento) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }

    const cpfClean = parsed.data.cpf.replace(/\D/g, '')
    const phoneClean = parsed.data.phone.replace(/\D/g, '')

    const { data: existing } = await supabase
      .from('wings_registrations')
      .select('id')
      .eq('evento_id', evento.id)
      .eq('cpf', cpfClean)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'CPF já cadastrado neste evento.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('wings_registrations')
      .insert({
        evento_id: evento.id,
        full_name: parsed.data.full_name,
        phone: phoneClean,
        cpf: cpfClean,
        gender: parsed.data.gender,
        institution_id: parsed.data.institution_id,
        atletica_id: parsed.data.atletica_id,
      })
      .select('id, registration_token')
      .single()

    if (error) {
      console.error('[wings/register]', error.message)
      return NextResponse.json({ error: 'Erro ao salvar inscrição.' }, { status: 500 })
    }

    // Espelho na tabela `checkins` para o admin Somma exibir junto dos demais eventos.
    // Resolve nomes de instituição/atlética para popular o campo `pelotao` (livre)
    // com algo legível tipo "UnB · Halterada".
    const [{ data: inst }, { data: atl }] = await Promise.all([
      supabase.from('institutions').select('name').eq('id', parsed.data.institution_id).maybeSingle(),
      supabase.from('atleticas').select('name').eq('id', parsed.data.atletica_id).maybeSingle(),
    ])
    const pelotaoLabel = [inst?.name, atl?.name].filter(Boolean).join(' · ') || null

    const { error: checkinErr } = await supabase.from('checkins').insert({
      evento_id: evento.id,
      nome_completo: parsed.data.full_name,
      cpf: cpfClean,
      telefone: phoneClean,
      sexo: GENDER_TO_CHECKIN[parsed.data.gender] ?? 'outro',
      email: null,
      pelotao: pelotaoLabel,
      data_do_evento: evento.data_evento,
      nome_do_evento: evento.titulo,
      validacao_do_checkin: false,
    })

    if (checkinErr) {
      // Não derruba a inscrição — wings_registrations é a fonte da verdade.
      // Apenas loga para investigação.
      console.error('[wings/register] espelho em checkins falhou:', checkinErr.message)
    }

    return NextResponse.json(
      { success: true, id: data.id, token: data.registration_token },
      { status: 201 }
    )
  } catch (err) {
    console.error('[wings/register] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
