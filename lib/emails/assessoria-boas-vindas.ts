import { getEmailFrom, getResendClient } from "@/lib/resend";
import { resolveProfessorOnboarding } from "@/lib/emails/assessoria-onboarding";

const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png?v=1772322941";
const CONCIERGE_WHATSAPP =
  "https://wa.me/61995372477?text=" +
  encodeURIComponent("Olá, acabei de adquirir a assessoria Somma e tenho algumas dúvidas, pode me ajudar?");
const KIT_URL = "https://loja.sommaclub.com.br/products/kit-assessoria-somma-club";

export interface AssessoriaBoasVindasEmailData {
  nome: string;
  email: string;
  plano: string;
  professor: string;
  professorWhatsapp?: string | null;
}

const JORNADA = [
  {
    emoji: "👋",
    titulo: "Manda um oi pro treinador",
    descricao:
      "Assinatura confirmada? Já pode chamar seu treinador no Zap, se apresentar e contar rapidinho o que te trouxe até aqui.",
  },
  {
    emoji: "💬",
    titulo: "Bate um papo inicial",
    descricao:
      "Conversa leve pra entender sua rotina, histórico e o que você quer conquistar. Sem pressão, é papo de gente real.",
  },
  {
    emoji: "📋",
    titulo: "Preenche o formulário",
    descricao:
      "Uns dados importantes pro seu treino ficar certinho e seguro. Leva uns 5 minutinhos, prometo.",
  },
  {
    emoji: "📱",
    titulo: "Entra no grupo",
    descricao:
      "WhatsApp exclusivo da Assessoria: avisos, dicas, suporte e a galera correndo junto com você.",
  },
  {
    emoji: "🏃",
    titulo: "Bora treinar",
    descricao:
      "Treinos personalizados no app, encontro de domingo e evolução de verdade. A tropa te espera.",
  },
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stepRow(emoji: string, titulo: string, descricao: string): string {
  return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:44px;vertical-align:top;font-size:22px;line-height:1;">${emoji}</td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 3px;color:#0a0a0a;font-size:15px;font-weight:700;">${escapeHtml(titulo)}</p>
              <p style="margin:0;color:#71717a;font-size:14px;line-height:1.65;">${escapeHtml(descricao)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function renderAssessoriaBoasVindasEmail(data: AssessoriaBoasVindasEmailData): string {
  const firstName = escapeHtml(data.nome.trim().split(/\s+/)[0] || data.nome);
  const plano = escapeHtml(data.plano);
  const professor = escapeHtml(data.professor);
  const onboarding = resolveProfessorOnboarding(data.professor);

  const whatsappProfessor = data.professorWhatsapp
    ? `https://wa.me/${data.professorWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, acabei de adquirir a Assessoria Somma ${data.plano}.`)}`
    : null;

  const onboardingBlock = onboarding
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td style="background:#0a0a0a;border-radius:20px;padding:28px 24px;text-align:center;">
            <p style="margin:0 0 4px;color:#ff2c03;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">Primeiro passo</p>
            <h2 style="margin:0 0 10px;color:#fff;font-size:22px;font-weight:800;line-height:1.25;">Preenche teu formulário de onboarding</h2>
            <p style="margin:0 0 22px;color:#a1a1aa;font-size:14px;line-height:1.65;">
              O treinador ${professor} precisa dessas infos pra montar seu plano. Rapidinho, uns 5 min.
            </p>
            <a href="${onboarding.url}" style="display:inline-block;background:#ff2c03;color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:15px 32px;border-radius:999px;">
              Bora preencher
            </a>
          </td>
        </tr>
      </table>`
    : `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td style="background:#fafafa;border:2px dashed #e4e4e7;border-radius:16px;padding:20px;text-align:center;">
            <p style="margin:0;color:#52525b;font-size:14px;line-height:1.65;">
              Seu treinador <strong>${professor}</strong> manda o link do formulário no Zap em breve. Fica de olho!
            </p>
          </td>
        </tr>
      </table>`;

  const professorWhatsappBlock = whatsappProfessor
    ? `
      <a href="${whatsappProfessor}" style="display:block;background:#25D366;color:#fff;text-decoration:none;text-align:center;font-weight:800;font-size:14px;padding:14px 20px;border-radius:14px;margin-bottom:10px;">
        Chamar treinador ${professor} no WhatsApp
      </a>`
    : "";

  const stepsHtml = JORNADA.map((step) => stepRow(step.emoji, step.titulo, step.descricao)).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bem-vindo à Assessoria Somma</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Assinatura confirmada! Veja o que vem agora e preenche teu formulário de onboarding.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background:#ff2c03;border-radius:20px 20px 0 0;padding:32px 28px 28px;text-align:center;">
              <img src="${LOGO_URL}" alt="Somma Club" width="160" style="height:auto;max-width:160px;background:#fff;padding:10px 16px;border-radius:10px;" />
              <h1 style="margin:24px 0 0;color:#ffffff;font-size:30px;font-weight:800;line-height:1.15;">
                E aí, ${firstName}!<br/>Tá dentro. 🧡
              </h1>
              <p style="margin:14px 0 0;color:#fff5f0;font-size:14px;line-height:1.5;">
                Plano <span style="color:#fff;font-weight:700;">${plano}</span>
                com Treinador <span style="color:#0a0a0a;font-weight:700;">${professor}</span>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 28px 32px;">
              <p style="margin:0 0 20px;color:#3f3f46;font-size:16px;line-height:1.75;">
                Sua assinatura tá confirmada e você agora faz parte da Assessoria Somma Club.
                Treino personalizado, treinador de verdade do teu lado e uma tropa que corre junto.
              </p>

              ${onboardingBlock}

              <p style="margin:0 0 18px;color:#0a0a0a;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">O que vem agora</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${stepsHtml}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                <tr>
                  <td style="padding-top:20px;border-top:2px solid #f4f4f5;">
                    <p style="margin:0 0 12px;color:#0a0a0a;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Precisa de ajuda?</p>
                    ${professorWhatsappBlock}
                    <a href="${CONCIERGE_WHATSAPP}" style="display:block;background:#f4f4f5;color:#0a0a0a;text-decoration:none;text-align:center;font-weight:700;font-size:14px;padding:14px 20px;border-radius:14px;">
                      Falar com o Concierge Somma
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="background:#fff7ed;border-radius:16px;padding:18px 20px;">
                    <p style="margin:0 0 4px;color:#ff2c03;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Extra</p>
                    <p style="margin:0 0 10px;color:#3f3f46;font-size:14px;line-height:1.6;">
                      Kit Assessoria com ecobag + camisa. Cupom <strong>ALUNOASSESSORIA</strong> na loja.
                    </p>
                    <a href="${KIT_URL}" style="color:#ff2c03;font-size:14px;font-weight:800;text-decoration:none;">Ver kit na loja</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0a0a;border-radius:0 0 20px 20px;padding:22px 28px;text-align:center;">
              <p style="margin:0;color:#71717a;font-size:12px;line-height:1.7;">
                Somma Club<br/>
                A maior tropa de corrida do DF
              </p>
              <p style="margin:10px 0 0;">
                <a href="https://sommaclub.com.br/assessoria" style="color:#ff2c03;font-size:12px;text-decoration:none;font-weight:700;">sommaclub.com.br/assessoria</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAssessoriaBoasVindasEmail(
  data: AssessoriaBoasVindasEmailData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();

  if (!resend || !from) {
    console.error("[assessoria-email] RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
    return { ok: false, error: "Resend não configurado" };
  }

  const { data: result, error } = await resend.emails.send({
    from,
    to: data.email,
    subject: `Bem-vindo à Assessoria Somma! Plano ${data.plano}`,
    html: renderAssessoriaBoasVindasEmail(data),
  });

  if (error) {
    console.error("[assessoria-email] Falha ao enviar e-mail:", error);
    return { ok: false, error: error.message };
  }

  console.log("[assessoria-email] E-mail enviado:", result?.id);
  return { ok: true, id: result?.id };
}
