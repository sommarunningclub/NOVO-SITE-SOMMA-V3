import { NextResponse } from 'next/server'
import {
  clearInsiderMfaCookie,
  getInsiderMfaPendente,
  setInsiderSessionCookie,
} from '@/lib/auth/insider'
import {
  CODIGO_EMAIL_MAX_TENTATIVAS,
  codigoEmailConfere,
} from '@/lib/auth/insider-codigo-email'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Confere o código que chegou por e-mail e abre a sessão do Insider Connect.
export async function POST(req: Request) {
  try {
    const pendente = await getInsiderMfaPendente()
    if (!pendente) {
      return NextResponse.json(
        { error: 'Tempo esgotado. Digite o CPF de novo.', reiniciar: true },
        { status: 401 }
      )
    }

    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { codigo } = await req.json().catch(() => ({ codigo: '' }))
    const codigoLimpo = String(codigo || '').replace(/\D/g, '')
    if (codigoLimpo.length !== 6) {
      return NextResponse.json({ error: 'Digite os 6 números do e-mail.' }, { status: 400 })
    }

    // Gasta a tentativa antes de conferir (atômico no banco).
    const { data: contagem, error: erroContagem } = await supabase.rpc(
      'insider_codigo_email_tentativa',
      { p_insider_id: pendente.id }
    )
    if (erroContagem) {
      console.error('[insider/mfa/email/confirmar] erro ao contar tentativa:', erroContagem)
      return NextResponse.json({ error: 'Erro ao validar o código.' }, { status: 500 })
    }
    const registro = Array.isArray(contagem) ? contagem[0] : contagem
    if (!registro) {
      return NextResponse.json(
        { error: 'Nenhum código ativo. Peça um novo código por e-mail.', pedirNovo: true },
        { status: 410 }
      )
    }

    const apagarCodigo = () =>
      supabase.from('insider_codigo_email').update({ expira_em: new Date(0).toISOString() }).eq('insider_id', pendente.id)

    if (new Date(registro.expira_em).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Esse código expirou. Peça um novo.', pedirNovo: true },
        { status: 410 }
      )
    }

    if (registro.tentativas > CODIGO_EMAIL_MAX_TENTATIVAS) {
      await apagarCodigo()
      return NextResponse.json(
        { error: 'Muitas tentativas erradas. Peça um novo código.', pedirNovo: true },
        { status: 429 }
      )
    }

    if (!codigoEmailConfere(pendente.id, codigoLimpo, registro.codigo_hash)) {
      const restantes = CODIGO_EMAIL_MAX_TENTATIVAS - registro.tentativas
      if (restantes <= 0) {
        await apagarCodigo()
        return NextResponse.json(
          { error: 'Código inválido. Esse código foi cancelado; peça um novo.', pedirNovo: true },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `Código inválido. Restam ${restantes} tentativa(s).` },
        { status: 401 }
      )
    }

    // Uso único: só quem conseguir invalidar este código abre a sessão. Mantém
    // a linha (com enviado_em/envios) para os freios de reenvio seguirem valendo.
    const { data: usado, error: erroUso } = await supabase
      .from('insider_codigo_email')
      .update({ expira_em: new Date(0).toISOString() })
      .eq('insider_id', pendente.id)
      .eq('codigo_hash', registro.codigo_hash)
      .gt('expira_em', new Date().toISOString())
      .select('insider_id')

    if (erroUso) {
      console.error('[insider/mfa/email/confirmar] erro ao gravar uso:', erroUso)
      return NextResponse.json({ error: 'Erro ao validar o código.' }, { status: 500 })
    }
    if (!usado?.length) {
      return NextResponse.json(
        { error: 'Esse código já foi usado. Peça um novo.', pedirNovo: true },
        { status: 401 }
      )
    }

    const session = { id: pendente.id, nome: pendente.nome }
    await clearInsiderMfaCookie()
    await setInsiderSessionCookie(session)
    return NextResponse.json({ success: true, insider: session })
  } catch (err) {
    console.error('[insider/mfa/email/confirmar] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
