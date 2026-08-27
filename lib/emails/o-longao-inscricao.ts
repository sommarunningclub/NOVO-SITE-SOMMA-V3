import { getEmailFrom, getResendClient } from "@/lib/resend";

/**
 * E-mail de confirmação da inscrição do O LONGÃO.
 *
 * Não trava a inscrição: se a Resend não estiver configurada, avisa no log e
 * devolve `{ ok: false }` em vez de lançar. A rota chama isto em
 * fire-and-forget, então uma exceção aqui viraria unhandled rejection.
 */

export const O_LONGAO_URL = "https://sommaclub.com.br/o-longao";

export interface OLongaoInscricaoEmailData {
  nome: string;
  email: string;
  crew: string;
  codigo: string;
  categorias: string[];
}

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(nome: string): string {
  return String(nome ?? "").trim().split(/\s+/)[0] || nome;
}

function rotuloCategorias(categorias: string[]): string {
  const nomes = categorias.map((c) => (c === "feminino" ? "Feminino" : "Masculino"));
  if (nomes.length === 0) return "a definir";
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

export const O_LONGAO_INSCRICAO_SUBJECT = "Inscrição recebida - O Longão";

const PASSOS = [
  "A organização valida os dados da inscrição e confirma a sua vaga.",
  "A data e a bateria da seletiva chegam por e-mail e WhatsApp.",
  "Prepare a escala: 2 horas de prova, 8 atletas, 1 esteira.",
];

export function renderOLongaoInscricaoEmail(data: OLongaoInscricaoEmailData): string {
  const nome = escapeHtml(firstName(data.nome));
  const crew = escapeHtml(data.crew.trim());
  const codigo = escapeHtml(data.codigo.trim());
  const categorias = escapeHtml(rotuloCategorias(data.categorias));

  const passos = PASSOS.map(
    (p) =>
      `<tr><td style="padding:0 0 10px 0;font-size:15px;line-height:1.55;color:#c9c5bd">
        <span style="color:#ffc400;font-weight:700">&bull;</span>&nbsp;${escapeHtml(p)}
      </td></tr>`
  ).join("");

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#050508;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050508;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#0b0b10;border:1px solid rgba(255,255,255,.08)">

      <tr><td style="padding:32px 32px 8px">
        <p style="margin:0;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#ff2c04;font-weight:700">O Longão</p>
        <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#f2f0ec;font-family:Helvetica,Arial,sans-serif">Inscrição recebida</h1>
      </td></tr>

      <tr><td style="padding:14px 32px 0;font-family:Helvetica,Arial,sans-serif">
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#f2f0ec">Olá, ${nome}.</p>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#c9c5bd">
          Recebemos a sua inscrição, sua crew <strong style="color:#f2f0ec">${crew}</strong> está na disputa.
        </p>
      </td></tr>

      <tr><td style="padding:24px 32px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111118;border:1px solid rgba(255,196,0,.35)">
          <tr><td align="center" style="padding:22px 16px;font-family:Helvetica,Arial,sans-serif">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#c9c5bd">Código da inscrição</p>
            <p style="margin:0;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:.08em;color:#ffc400;font-family:'Courier New',Courier,monospace">${codigo}</p>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:18px 32px 0;font-family:Helvetica,Arial,sans-serif">
        <p style="margin:0;font-size:15px;line-height:1.6;color:#c9c5bd">
          Categorias inscritas: <strong style="color:#f2f0ec">${categorias}</strong>
        </p>
      </td></tr>

      <tr><td style="padding:26px 32px 0;font-family:Helvetica,Arial,sans-serif">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#ff2c04;font-weight:700">Próximos passos</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${passos}</table>
      </td></tr>

      <tr><td align="center" style="padding:28px 32px 8px">
        <a href="${O_LONGAO_URL}" style="display:inline-block;background:#ff2c04;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:14px 30px">Ver a página do evento</a>
      </td></tr>

      <tr><td style="padding:24px 32px 32px;font-family:Helvetica,Arial,sans-serif;border-top:1px solid rgba(255,255,255,.08)">
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8b8880">
          Somma Club + Evolve &middot; Master sponsor Star Trac
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function renderOLongaoInscricaoText(data: OLongaoInscricaoEmailData): string {
  return [
    `Olá, ${firstName(data.nome)}.`,
    "",
    `Recebemos a sua inscrição, sua crew ${data.crew.trim()} está na disputa.`,
    "",
    `Código da inscrição: ${data.codigo.trim()}`,
    `Categorias inscritas: ${rotuloCategorias(data.categorias)}`,
    "",
    "PRÓXIMOS PASSOS",
    ...PASSOS.map((p) => `- ${p}`),
    "",
    `Página do evento: ${O_LONGAO_URL}`,
    "",
    "Somma Club + Evolve. Master sponsor Star Trac.",
  ].join("\n");
}

export async function sendOLongaoInscricaoEmail(input: {
  nome: string;
  email: string;
  crew: string;
  codigo: string;
  categorias: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();

  if (!resend || !from) {
    console.warn(
      "[o-longao] e-mail de inscrição não enviado: RESEND_API_KEY ou remetente ausente."
    );
    return { ok: false, error: "Serviço de e-mail não configurado." };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.email,
      subject: O_LONGAO_INSCRICAO_SUBJECT,
      html: renderOLongaoInscricaoEmail(input),
      text: renderOLongaoInscricaoText(input),
    });

    if (error) {
      console.error("[o-longao] Resend recusou o e-mail de inscrição:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[o-longao] falha ao enviar e-mail de inscrição:", message);
    return { ok: false, error: message };
  }
}
