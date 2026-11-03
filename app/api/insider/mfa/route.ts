import { NextResponse } from 'next/server'
import {
  clearInsiderMfaCookie,
  getInsiderMfaPendente,
  setInsiderSessionCookie,
} from '@/lib/auth/insider'
import { verificarTotp } from '@/lib/auth/totp'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Até 5 códigos por janela de 15 min (a contagem fica no banco).
const MAX_TENTATIVAS = 5
const JANELA_MS = 15 * 60 * 1000

// Segunda etapa do login do Insider Connect: confere o código de 6 dígitos do
// Google Authenticator. No primeiro acesso também grava o autenticador.
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
      return NextResponse.json({ error: 'Digite os 6 números do app.' }, { status: 400 })
    }

    const session = { id: pendente.id, nome: pendente.nome }
    const agora = Date.now()

    // ─── Primeiro acesso: cadastro do autenticador ────────────────────────────
    if (pendente.segredoNovo) {
      const passo = verificarTotp(pendente.segredoNovo, codigoLimpo, agora)
      if (passo === null) {
        return NextResponse.json(
          { error: 'Código não confere. Confira se escaneou o QR desta tela e tente o código atual.' },
          { status: 401 }
        )
      }

      // insider_id é a chave: se outra aba já cadastrou, o insert falha e nada
      // é sobrescrito.
      const { error } = await supabase.from('insider_mfa').insert({
        insider_id: pendente.id,
        totp_secret: pendente.segredoNovo,
        ultimo_passo: passo,
        ultimo_uso_em: new Date(agora).toISOString(),
      })
      if (error) {
        if (error.code === '23505') {
          await clearInsiderMfaCookie()
          return NextResponse.json(
            { error: 'Este acesso já tem um autenticador cadastrado. Digite o CPF de novo.', reiniciar: true },
            { status: 409 }
          )
        }
        console.error('[insider/mfa] erro ao gravar 2FA:', error)
        return NextResponse.json({ error: 'Erro ao salvar o autenticador.' }, { status: 500 })
      }

      await clearInsiderMfaCookie()
      await setInsiderSessionCookie(session)
      return NextResponse.json({ success: true, insider: session })
    }

    // ─── Acessos seguintes: confere o código ──────────────────────────────────
    const { data: mfa, error } = await supabase
      .from('insider_mfa')
      .select('totp_secret, ultimo_passo')
      .eq('insider_id', pendente.id)
      .maybeSingle()

    if (error) {
      console.error('[insider/mfa] erro ao buscar 2FA:', error)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }
    if (!mfa) {
      // Autenticador resetado depois que o CPF foi digitado.
      await clearInsiderMfaCookie()
      return NextResponse.json(
        { error: 'Autenticador não encontrado. Digite o CPF de novo para cadastrar.', reiniciar: true },
        { status: 409 }
      )
    }

    // Gasta a tentativa antes de conferir (atômico no banco).
    const { data: contagem, error: erroContagem } = await supabase.rpc(
      'insider_mfa_registrar_tentativa',
      { p_insider_id: pendente.id }
    )
    const tentativa = Array.isArray(contagem) ? contagem[0] : contagem
    if (erroContagem || !tentativa) {
      console.error('[insider/mfa] erro ao contar tentativa:', erroContagem)
      return NextResponse.json({ error: 'Erro ao validar o código.' }, { status: 500 })
    }
    if (tentativa.tentativas > MAX_TENTATIVAS) {
      const libera = new Date(tentativa.tentativas_desde).getTime() + JANELA_MS
      const minutos = Math.max(1, Math.ceil((libera - agora) / 60000))
      return NextResponse.json(
        { error: `Muitas tentativas erradas. Tente de novo em ${minutos} min.` },
        { status: 429 }
      )
    }

    const passo = verificarTotp(mfa.totp_secret, codigoLimpo, agora)
    if (passo === null) {
      const restantes = MAX_TENTATIVAS - tentativa.tentativas
      return NextResponse.json(
        {
          error:
            restantes > 0
              ? `Código inválido. ${restantes} tentativa(s) antes de travar por 15 min.`
              : 'Código inválido. O acesso ficou travado por 15 min.',
        },
        { status: restantes > 0 ? 401 : 429 }
      )
    }

    if (mfa.ultimo_passo != null && passo <= Number(mfa.ultimo_passo)) {
      return NextResponse.json(
        { error: 'Esse código já foi usado. Espere o próximo aparecer no app.' },
        { status: 401 }
      )
    }

    // Grava o passo só se ninguém tiver usado um igual ou mais novo nesse meio
    // tempo (duas requisições com o mesmo código ao mesmo tempo).
    let atualizar = supabase
      .from('insider_mfa')
      .update({
        ultimo_passo: passo,
        ultimo_uso_em: new Date(agora).toISOString(),
        tentativas: 0,
        tentativas_desde: null,
      })
      .eq('insider_id', pendente.id)
    atualizar =
      mfa.ultimo_passo == null ? atualizar.is('ultimo_passo', null) : atualizar.eq('ultimo_passo', mfa.ultimo_passo)
    const { data: gravado, error: erroUpdate } = await atualizar.select('insider_id')

    if (erroUpdate) {
      console.error('[insider/mfa] erro ao gravar uso do 2FA:', erroUpdate)
      return NextResponse.json({ error: 'Erro ao validar o código.' }, { status: 500 })
    }
    if (!gravado?.length) {
      return NextResponse.json(
        { error: 'Esse código já foi usado. Espere o próximo aparecer no app.' },
        { status: 401 }
      )
    }

    await clearInsiderMfaCookie()
    await setInsiderSessionCookie(session)
    return NextResponse.json({ success: true, insider: session })
  } catch (err) {
    console.error('[insider/mfa] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
