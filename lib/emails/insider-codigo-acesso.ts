import { getEmailFrom, getResendClient } from '@/lib/resend'

const LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png?v=1772322941'

export interface InsiderCodigoAcessoData {
  nome: string
  email: string
  codigo: string
  validadeMin: number
}

export function renderInsiderCodigoAcessoEmail({ nome, codigo, validadeMin }: InsiderCodigoAcessoData): string {
  const primeiroNome = nome.trim().split(/\s+/)[0] || 'Insider'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:#0a0a0a;border-radius:20px 20px 0 0;padding:28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Somma Club" style="height:30px;background:#fff;padding:8px 14px;border-radius:8px;" />
      <p style="margin:18px 0 0;color:#ff2c03;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Insider Connect</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;">Seu código de acesso</h1>
    </div>

    <div style="background:#fff;padding:28px;text-align:center;">
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Olá, <strong>${primeiroNome}</strong>! Use o código abaixo para entrar no Insider Connect.
      </p>

      <div style="background:#f4f4f5;border-radius:14px;padding:20px;margin:0 0 20px;">
        <p style="margin:0;color:#0a0a0a;font-size:34px;font-weight:bold;letter-spacing:10px;font-family:'Courier New',monospace;">${codigo}</p>
      </div>

      <p style="margin:0 0 8px;color:#71717a;font-size:13px;line-height:1.6;">
        O código vale por ${validadeMin} minutos e só pode ser usado uma vez.
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
        Não pediu este código? Ignore este e-mail e avise a coordenação.
      </p>
    </div>

    <div style="background:#0a0a0a;border-radius:0 0 20px 20px;padding:20px;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:12px;">Somma Club · Acesso restrito</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendInsiderCodigoAcessoEmail(
  data: InsiderCodigoAcessoData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResendClient()
  const from = getEmailFrom()

  if (!resend || !from) {
    console.error('[insider-codigo-email] RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.')
    return { ok: false, error: 'Resend não configurado' }
  }

  const { data: result, error } = await resend.emails.send({
    from,
    to: data.email.trim(),
    subject: `${data.codigo} é o seu código do Insider Connect`,
    html: renderInsiderCodigoAcessoEmail(data),
    text: `Seu código de acesso ao Insider Connect é ${data.codigo}. Vale por ${data.validadeMin} minutos e só pode ser usado uma vez. Não pediu? Ignore este e-mail e avise a coordenação.`,
  })

  if (error) {
    console.error('[insider-codigo-email] Falha ao enviar e-mail:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, id: result?.id }
}
