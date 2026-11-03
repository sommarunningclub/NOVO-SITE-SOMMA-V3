import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { setInsiderMfaCookie } from '@/lib/auth/insider'
import { gerarSegredoTotp, otpauthUrl } from '@/lib/auth/totp'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { cpf } = await req.json()
    if (!cpf) return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 })

    const cpfLimpo = String(cpf).replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const { data: insiders, error } = await supabase
      .from('dados_insiders')
      .select('id, nome, cpf')

    if (error) {
      console.error('[insider/login] erro ao buscar insiders:', error)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }

    const insider = insiders?.find(
      (i) => i.cpf && i.cpf.replace(/\D/g, '') === cpfLimpo
    )

    if (!insider) {
      return NextResponse.json({ error: 'CPF não encontrado. Acesso negado.' }, { status: 401 })
    }

    // O CPF sozinho não abre o painel: a sessão só sai em /api/insider/mfa,
    // depois do código do Google Authenticator.
    const { data: mfa, error: erroMfa } = await supabase
      .from('insider_mfa')
      .select('insider_id')
      .eq('insider_id', insider.id)
      .maybeSingle()

    if (erroMfa) {
      console.error('[insider/login] erro ao buscar 2FA:', erroMfa)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }

    const primeiroNome = String(insider.nome || '').trim().split(/\s+/)[0] || 'Insider'

    if (mfa) {
      await setInsiderMfaCookie({ id: insider.id, nome: insider.nome })
      return NextResponse.json({ step: 'verify', nome: primeiroNome })
    }

    // Primeiro acesso depois do 2FA: gera o segredo e mostra o QR. Ele só é
    // gravado no banco quando o insider digitar um código válido.
    const segredo = gerarSegredoTotp()
    const url = otpauthUrl(segredo, insider.nome)
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 })

    await setInsiderMfaCookie({ id: insider.id, nome: insider.nome, segredoNovo: segredo })
    return NextResponse.json({
      step: 'setup',
      nome: primeiroNome,
      qr,
      otpauth: url,
      segredo: segredo.match(/.{1,4}/g)?.join(' ') ?? segredo,
    })
  } catch (err) {
    console.error('[insider/login] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
