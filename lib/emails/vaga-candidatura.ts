import { getEmailFrom, getResendClient } from "@/lib/resend";

const LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0788/1932/8253/files/HORIZONTAL_PRETA_LARANJA.png?v=1772322941";

// Destinatário do aviso interno. Configurável por env para trocar sem deploy.
function getVagasRecipient(): string {
  return process.env.VAGAS_EMAIL_TO || "contato@sommaclub.com.br";
}

export interface CandidaturaEmailData {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cep: string;
  endereco: string;
  instituicao: string;
  semestre: string;
  /** Texto já resolvido: "Não", "Sim" ou "Sim, por Fulano". */
  indicacao: string;
  vaga_titulo: string;
  /** URL assinada do currículo — expira. Nunca é link público. */
  curriculo_url?: string | null;
  curriculo_nome?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linha(label: string, valor: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;color:#18181b;font-size:14px;font-weight:bold;">${escapeHtml(valor)}</td>
    </tr>`;
}

// ─── E-mail interno (time do Somma) ──────────────────────────────────────────
export function renderCandidaturaInternalEmail(d: CandidaturaEmailData): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0a0a0a;border-radius:20px 20px 0 0;padding:28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Somma Club" style="height:30px;background:#fff;padding:8px 14px;border-radius:8px;" />
      <p style="margin:16px 0 0;color:#ff2c03;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Nova candidatura</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;">${escapeHtml(d.vaga_titulo)}</h1>
    </div>

    <div style="background:#fff;padding:28px;">
      <table style="width:100%;border-collapse:collapse;">
        ${linha("Nome", d.nome)}
        ${linha("E-mail", d.email)}
        ${linha("Telefone", d.telefone)}
        ${linha("Nascimento", d.data_nascimento)}
        ${linha("Instituição", d.instituicao)}
        ${linha("Semestre", d.semestre)}
        ${linha("Indicado", d.indicacao)}
        ${linha("CEP", d.cep)}
        ${linha("Endereço", d.endereco || "—")}
      </table>

      ${
        d.curriculo_url
          ? `<a href="${d.curriculo_url}" style="display:block;background:#ff2c03;color:#fff;text-decoration:none;text-align:center;font-weight:bold;font-size:15px;padding:14px 20px;border-radius:999px;margin-top:24px;">
               Baixar currículo${d.curriculo_nome ? ` (${escapeHtml(d.curriculo_nome)})` : ""}
             </a>
             <p style="margin:12px 0 0;color:#a1a1aa;font-size:12px;text-align:center;">
               Este link expira em 30 dias. Depois disso, baixe pelo bucket <strong>curriculos</strong> no Supabase.
             </p>`
          : `<p style="margin:24px 0 0;color:#71717a;font-size:13px;text-align:center;">
               Currículo salvo no bucket <strong>curriculos</strong> do Supabase.
             </p>`
      }
    </div>

    <div style="background:#0a0a0a;border-radius:0 0 20px 20px;padding:20px;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:12px;">Enviado pelo formulário de /trabalhe-conosco-vagas</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── E-mail de confirmação (candidato) ───────────────────────────────────────
export function renderCandidaturaCandidateEmail(d: CandidaturaEmailData): string {
  const primeiroNome = d.nome.trim().split(/\s+/)[0] || d.nome;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0a0a0a;border-radius:20px 20px 0 0;padding:32px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Somma Club" style="height:34px;background:#fff;padding:8px 14px;border-radius:8px;" />
      <p style="margin:18px 0 0;color:#ff2c03;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Candidatura recebida</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:26px;">Obrigado, ${escapeHtml(primeiroNome)}!</h1>
    </div>

    <div style="background:#fff;padding:28px;">
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Recebemos sua candidatura para a vaga de <strong>${escapeHtml(d.vaga_titulo)}</strong>. Seu currículo já está com o nosso time.
      </p>

      <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;color:#18181b;font-size:14px;font-weight:bold;">Como segue daqui</p>
        <ol style="margin:0;padding-left:20px;color:#3f3f46;font-size:14px;line-height:1.8;">
          <li>Nosso time analisa cada candidatura com calma.</li>
          <li>Se o seu perfil combinar com o momento, entramos em contato pelo telefone ou e-mail que você cadastrou.</li>
          <li>Enquanto isso, corre com a gente: os treinos são abertos à comunidade.</li>
        </ol>
      </div>

      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;text-align:center;">
        Não respondemos a este endereço. Dúvidas sobre o processo? Fale com a gente pelo
        <a href="https://sommaclub.com.br" style="color:#ff2c03;">site</a>.
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

/**
 * Dispara os dois e-mails da candidatura. Nunca lança: falha de e-mail não pode
 * derrubar uma candidatura que já está gravada no banco.
 */
export async function sendCandidaturaEmails(
  data: CandidaturaEmailData
): Promise<{ interno: boolean; candidato: boolean }> {
  const resend = getResendClient();
  const from = getEmailFrom();

  if (!resend || !from) {
    console.error("[vaga-candidatura] RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
    return { interno: false, candidato: false };
  }

  const [interno, candidato] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: getVagasRecipient(),
      replyTo: data.email,
      subject: `Nova candidatura: ${data.vaga_titulo} — ${data.nome}`,
      html: renderCandidaturaInternalEmail(data),
    }),
    resend.emails.send({
      from,
      to: data.email,
      subject: `Recebemos sua candidatura — ${data.vaga_titulo}`,
      html: renderCandidaturaCandidateEmail(data),
    }),
  ]);

  const ok = (r: PromiseSettledResult<{ error: unknown }>) =>
    r.status === "fulfilled" && !r.value.error;

  if (!ok(interno as PromiseSettledResult<{ error: unknown }>)) {
    console.error("[vaga-candidatura] Falha no e-mail interno:", interno);
  }
  if (!ok(candidato as PromiseSettledResult<{ error: unknown }>)) {
    console.error("[vaga-candidatura] Falha no e-mail ao candidato:", candidato);
  }

  return {
    interno: ok(interno as PromiseSettledResult<{ error: unknown }>),
    candidato: ok(candidato as PromiseSettledResult<{ error: unknown }>),
  };
}
