import { NextResponse } from 'next/server'
import { setInsiderSessionCookie } from '@/lib/auth/insider'
import { verifyPassword } from '@/lib/auth/password'
import { getServiceSupabase } from '@/lib/supabase'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Login do Insider Conect.
 *
 * Antes bastava um CPF que existisse em `dados_insiders` — e a própria lista de
 * CPFs já esteve legível pela anon key. Ou seja: o "segredo" era um dado que
 * circula em ficha de inscrição. Agora o CPF identifica e a senha autentica,
 * conferida contra `insider_credentials.senha_hash`.
 *
 * A resposta é sempre a mesma, com o mesmo tempo de espera, para CPF
 * inexistente, insider sem credencial e senha errada: quem tenta não descobre
 * quais CPFs estão cadastrados.
 */

const ATRASO_MS = 500

function formatarCpf(digitos: string): string {
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

async function recusar(inicio: number) {
  const resta = ATRASO_MS - (Date.now() - inicio)
  if (resta > 0) await new Promise((r) => setTimeout(r, resta))
  return NextResponse.json({ error: 'CPF ou senha inválidos.' }, { status: 401 })
}

export async function POST(req: Request) {
  const inicio = Date.now()
  try {
    const ip = clientIp(req)
    const porIp = await rateLimit(`insider:login:ip:${ip}`, 10, 600)
    if (!porIp.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(porIp.retryAfterSeconds) } }
      )
    }

    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { cpf, senha } = await req.json()
    const cpfLimpo = String(cpf ?? '').replace(/\D/g, '')
    const senhaInformada = String(senha ?? '')

    if (cpfLimpo.length !== 11 || !senhaInformada) {
      return recusar(inicio)
    }

    // Cota por CPF também: sem ela, trocar de IP zeraria o contador e a senha
    // de um insider específico ficaria à mercê de força bruta.
    const porCpf = await rateLimit(`insider:login:cpf:${cpfLimpo}`, 8, 900)
    if (!porCpf.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(porCpf.retryAfterSeconds) } }
      )
    }

    // Filtra no banco (as duas grafias possíveis da coluna) em vez de trazer a
    // tabela inteira de CPFs para a memória da função.
    const { data: insiders, error } = await supabase
      .from('dados_insiders')
      .select('id, nome')
      .in('cpf', [cpfLimpo, formatarCpf(cpfLimpo)])
      .limit(1)

    if (error) {
      console.error('[insider/login] erro ao buscar insiders:', error)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }

    const insider = insiders?.[0]
    if (!insider) return recusar(inicio)

    const { data: credencial, error: credError } = await supabase
      .from('insider_credentials')
      .select('senha_hash')
      .eq('insider_id', insider.id)
      .maybeSingle()

    if (credError) {
      console.error('[insider/login] erro ao buscar credencial:', credError)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }
    if (!credencial?.senha_hash) {
      console.warn('[insider/login] insider sem credencial cadastrada:', insider.id)
      return recusar(inicio)
    }

    if (!(await verifyPassword(senhaInformada, credencial.senha_hash))) {
      return recusar(inicio)
    }

    const session = { id: insider.id, nome: insider.nome }
    await setInsiderSessionCookie(session)

    return NextResponse.json({ success: true, insider: session })
  } catch (err) {
    console.error('[insider/login] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
