import { NextRequest, NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'
import {
  desfazerTransferencia,
  editarTitularTransferido,
  getEvento,
  type MotivoAjusteTransferencia,
  type ResultadoAjusteTransferencia,
} from '@/lib/dexcomplica-love-run/db'
import { transferenciaSchema } from '@/lib/dexcomplica-love-run/schema'
import { enviarIngresso } from '@/lib/emails/dexcomplica-love-run-ingresso'

export const dynamic = 'force-dynamic'

/**
 * Transferências feitas pela página do evento (Love Run), no Insider Connect:
 *   PATCH  { id, dados } → corrige os dados de quem recebeu a vaga
 *   DELETE { id }        → desfaz: a vaga volta para quem passou, com QR novo
 * `id` é o da lista (`<inscrição>:<posição>`); só a última transferência de
 * cada inscrição pode ser mexida.
 */

const MENSAGEM: Record<MotivoAjusteTransferencia, { error: string; status: number }> = {
  sem_banco: { error: 'Serviço indisponível. Tente de novo.', status: 503 },
  nao_encontrada: { error: 'Transferência não encontrada. Atualize a lista.', status: 404 },
  nao_e_a_ultima: { error: 'Só a transferência mais recente desta vaga pode ser alterada.', status: 409 },
  presente: { error: 'Este ingresso já passou pelo check-in: a transferência não pode ser desfeita.', status: 409 },
  cancelado: { error: 'Esta inscrição está cancelada.', status: 409 },
  cpf_inscrito: { error: 'Este CPF já tem outra inscrição no evento.', status: 409 },
  sem_dados_origem: { error: 'Não achamos nome e e-mail de quem passou a vaga no cadastro: não dá para devolver.', status: 422 },
  pelotao: { error: 'Escolha um dos pelotões do evento.', status: 422 },
  erro: { error: 'Não foi possível salvar. Tente de novo.', status: 500 },
}

async function responder(resultado: ResultadoAjusteTransferencia) {
  if (!resultado.ok) {
    const m = MENSAGEM[resultado.motivo]
    return NextResponse.json({ error: m.error }, { status: m.status })
  }
  const p = resultado.participante
  let emailEnviado = false
  if (resultado.reenviarPara) {
    const envio = await enviarIngresso({
      nome: p.nome_completo,
      email: resultado.reenviarPara,
      ticketCode: p.ticket_code,
      ticketToken: p.ticket_token,
      pelotao: p.pelotao,
      reenvio: true,
    }).catch(() => ({ ok: false }))
    emailEnviado = envio.ok
  }
  return NextResponse.json({ ok: true, titular: p.nome_completo, email_enviado: emailEnviado })
}

async function lerId(req: NextRequest): Promise<{ id: string; corpo: Record<string, unknown> } | null> {
  try {
    const corpo = (await req.json()) as Record<string, unknown>
    return typeof corpo.id === 'string' && corpo.id ? { id: corpo.id, corpo } : null
  } catch {
    return null
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response
  const lido = await lerId(req)
  if (!lido) return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })

  const parsed = transferenciaSchema.omit({ marketing: true }).safeParse(lido.corpo.dados ?? {})
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Confira os campos.' }, { status: 422 })
  }
  const evento = await getEvento()
  if (!evento) return NextResponse.json({ error: 'Evento indisponível.' }, { status: 503 })
  return responder(await editarTitularTransferido(lido.id, parsed.data, evento))
}

export async function DELETE(req: NextRequest) {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response
  const lido = await lerId(req)
  if (!lido) return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })

  const evento = await getEvento()
  if (!evento) return NextResponse.json({ error: 'Evento indisponível.' }, { status: 503 })
  return responder(await desfazerTransferencia(lido.id, evento, auth.insider.nome))
}
