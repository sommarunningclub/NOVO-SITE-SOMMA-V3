import { getEmailFrom, getResendClient } from "@/lib/resend";

const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png?v=1772322941";

export interface VagaEncerradaEmailData {
  nome: string;
  email: string;
  vaga_titulo: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderVagaEncerradaEmail(d: VagaEncerradaEmailData): string {
  const primeiroNome = d.nome.trim().split(/\s+/)[0] || d.nome;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0a0a0a;border-radius:20px 20px 0 0;padding:32px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Somma Club" style="height:34px;background:#fff;padding:8px 14px;border-radius:8px;" />
      <p style="margin:18px 0 0;color:#ff2c03;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Atualização da candidatura</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:24px;">Olá, ${escapeHtml(primeiroNome)}</h1>
    </div>

    <div style="background:#fff;padding:28px;">
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Obrigado por se candidatar à vaga de <strong>${escapeHtml(d.vaga_titulo)}</strong> no Somma Club.
      </p>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Essa vaga já foi preenchida. Mesmo assim, seu currículo continua guardado com a gente, e vamos
        considerar seu perfil para as próximas oportunidades que surgirem.
      </p>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0;">
        Obrigado pelo interesse em fazer parte do time. Continue correndo com a gente!
      </p>
    </div>

    <div style="background:#0a0a0a;border-radius:0 0 20px 20px;padding:22px;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:12px;">Somma Club · Maior running club do Distrito Federal</p>
      <p style="margin:6px 0 0;"><a href="https://sommaclub.com.br" style="color:#ff2c03;font-size:12px;text-decoration:none;">sommaclub.com.br</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVagaEncerradaEmail(
  d: VagaEncerradaEmailData
): Promise<{ ok: boolean; error?: unknown; id?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    return { ok: false, error: "RESEND_API_KEY ou VIP_EMAIL_FROM não configurados." };
  }

  const { data, error } = await resend.emails.send({
    from,
    to: d.email,
    subject: `Vaga de ${d.vaga_titulo} preenchida — obrigado pela candidatura`,
    html: renderVagaEncerradaEmail(d),
  });

  if (error) return { ok: false, error };
  return { ok: true, id: data?.id };
}
