import { NextResponse } from 'next/server'
import { getInsiderMfaPendente, setInsiderMfaCookie } from '@/lib/auth/insider'
import {
  CODIGO_EMAIL_INTERVALO_S,
  CODIGO_EMAIL_MAX_ENVIOS_HORA,
  CODIGO_EMAIL_VALIDADE_MIN,
  emailValido,
  gerarCodigoEmail,
  hashCodigoEmail,
  mascararEmail,
} from '@/lib/auth/insider-codigo-email'
import { sendInsiderCodigoAcessoEmail } from '@/lib/emails/insider-codigo-acesso'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const HORA_MS = 60 * 60 * 1000

// Alternativa ao Google Authenticator: manda um código de 6 números para o
// e-mail cadastrado em dados_insiders. Só funciona depois do CPF (cookie
// insider_mfa); a sessão sai em /api/insider/mfa/email/confirmar.
export async function POST() {
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

    const { data: insider, error: erroInsider } = await supabase
      .from('dados_insiders')
      .select('id, nome, email')
      .eq('id', pendente.id)
      .maybeSingle()

    if (erroInsider) {
      console.error('[insider/mfa/email] erro ao buscar insider:', erroInsider)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }
    if (!insider) {
      return NextResponse.json({ error: 'Cadastro não encontrado. Digite o CPF de novo.', reiniciar: true }, { status: 401 })
    }
    if (!emailValido(insider.email)) {
      return NextResponse.json(
        { error: 'Não há e-mail válido no seu cadastro de Insider. Fale com a coordenação.' },
        { status: 422 }
      )
    }

    // Freios: 1 envio por minuto e 5 por hora para o mesmo insider.
    const agora = Date.now()
    const { data: atual, error: erroAtual } = await supabase
      .from('insider_codigo_email')
      .select('enviado_em, envios, envios_desde')
      .eq('insider_id', pendente.id)
      .maybeSingle()

    if (erroAtual) {
      console.error('[insider/mfa/email] erro ao buscar código atual:', erroAtual)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }

    let envios = 1
    let enviosDesde = new Date(agora).toISOString()
    if (atual) {
      const desdeUltimo = (agora - new Date(atual.enviado_em).getTime()) / 1000
      if (desdeUltimo < CODIGO_EMAIL_INTERVALO_S) {
        const espera = Math.ceil(CODIGO_EMAIL_INTERVALO_S - desdeUltimo)
        return NextResponse.json(
          { error: `Espere ${espera} s para pedir outro código.`, esperar: espera },
          { status: 429 }
        )
      }
      const janelaAberta = agora - new Date(atual.envios_desde).getTime() < HORA_MS
      if (janelaAberta) {
        if (atual.envios >= CODIGO_EMAIL_MAX_ENVIOS_HORA) {
          const libera = new Date(atual.envios_desde).getTime() + HORA_MS
          const minutos = Math.max(1, Math.ceil((libera - agora) / 60000))
          return NextResponse.json(
            { error: `Limite de códigos por e-mail atingido. Tente de novo em ${minutos} min.` },
            { status: 429 }
          )
        }
        envios = atual.envios + 1
        enviosDesde = atual.envios_desde
      }
    }

    const codigo = gerarCodigoEmail()
    const { error: erroGravar } = await supabase.from('insider_codigo_email').upsert(
      {
        insider_id: pendente.id,
        codigo_hash: hashCodigoEmail(pendente.id, codigo),
        expira_em: new Date(agora + CODIGO_EMAIL_VALIDADE_MIN * 60 * 1000).toISOString(),
        tentativas: 0,
        enviado_em: new Date(agora).toISOString(),
        envios,
        envios_desde: enviosDesde,
      },
      { onConflict: 'insider_id' }
    )
    if (erroGravar) {
      console.error('[insider/mfa/email] erro ao gravar código:', erroGravar)
      return NextResponse.json({ error: 'Erro ao gerar o código.' }, { status: 500 })
    }

    const envio = await sendInsiderCodigoAcessoEmail({
      nome: insider.nome || pendente.nome,
      email: insider.email,
      codigo,
      validadeMin: CODIGO_EMAIL_VALIDADE_MIN,
    })
    if (!envio.ok) {
      return NextResponse.json(
        { error: 'Não foi possível enviar o e-mail agora. Tente de novo em instantes.' },
        { status: 502 }
      )
    }

    // Renova a etapa pendente para dar tempo de abrir o e-mail.
    await setInsiderMfaCookie(pendente)

    return NextResponse.json({
      success: true,
      email: mascararEmail(insider.email),
      validadeMin: CODIGO_EMAIL_VALIDADE_MIN,
      reenviarEm: CODIGO_EMAIL_INTERVALO_S,
    })
  } catch (err) {
    console.error('[insider/mfa/email] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
