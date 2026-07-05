import { getEmailFrom, getResendClient } from "@/lib/resend";

const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png?v=1772322941";
const WHATSAPP_URL = "https://chat.whatsapp.com/HqEzvY8SbSvImtGaw3UkEk?mode=gi_t";

export interface CadastroSiteEmailData {
  nome: string;
  email: string;
}

export function renderCadastroSiteWelcomeEmail({ nome }: CadastroSiteEmailData): string {
  const firstName = nome.trim().split(/\s+/)[0] || nome;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0a0a0a;border-radius:20px 20px 0 0;padding:32px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Somma Club" style="height:34px;background:#fff;padding:8px 14px;border-radius:8px;" />
      <p style="margin:18px 0 0;color:#ff2c03;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Inscrição confirmada</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:26px;">Bem-vindo ao Somma!</h1>
    </div>

    <div style="background:#fff;padding:28px;">
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Olá, <strong>${firstName}</strong>! Você agora faz parte da comunidade Somma Club — o maior running club do Distrito Federal.
      </p>

      <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;color:#18181b;font-size:14px;font-weight:bold;">Próximos passos</p>
        <ol style="margin:0;padding-left:20px;color:#3f3f46;font-size:14px;line-height:1.8;">
          <li>Entre no grupo do WhatsApp</li>
          <li>Apresente-se à comunidade</li>
          <li>Apareça no próximo encontro de sábado, 7h</li>
        </ol>
      </div>

      <a href="${WHATSAPP_URL}" style="display:block;background:#25D366;color:#fff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;padding:14px 20px;border-radius:999px;margin-bottom:16px;">
        Entrar no grupo do WhatsApp
      </a>

      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;text-align:center;">
        Também é possível assinar a agenda oficial do Somma em <a href="https://sommaclub.com.br/obrigado" style="color:#ff2c03;">sommaclub.com.br/obrigado</a>.
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

export async function sendCadastroSiteWelcomeEmail(
  data: CadastroSiteEmailData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();

  if (!resend || !from) {
    console.error("[cadastro-site-email] RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
    return { ok: false, error: "Resend não configurado" };
  }

  const { data: result, error } = await resend.emails.send({
    from,
    to: data.email,
    subject: "Bem-vindo ao Somma Club!",
    html: renderCadastroSiteWelcomeEmail(data),
  });

  if (error) {
    console.error("[cadastro-site-email] Falha ao enviar e-mail:", error);
    return { ok: false, error: error.message };
  }

  console.log("[cadastro-site-email] E-mail enviado:", result?.id);
  return { ok: true, id: result?.id };
}
