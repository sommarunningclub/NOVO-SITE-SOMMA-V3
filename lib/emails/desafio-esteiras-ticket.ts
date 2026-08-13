import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { EVENT, SITE_URL, type EventUnit } from "@/lib/desafio-esteiras/event.config";
import { ticketQrPng } from "@/lib/desafio-esteiras/qr";
import { ticketUrl } from "@/lib/desafio-esteiras/ticket";

const QR_CID = "ticket-qr";
const EVOLVE_LOGO_CID = "logo-evolve";
const SOMMA_LOGO_CID = "logo-somma";

export const EMAIL_EVOLVE_LOGO_URL = `${SITE_URL}/desafio-esteiras-evolve/email/evolve-logo.png`;
export const EMAIL_SOMMA_LOGO_URL = `${SITE_URL}/desafio-esteiras-evolve/email/somma-logo.png`;

function emailAssetPng(file: string): Buffer {
  return readFileSync(join(process.cwd(), "public/desafio-esteiras-evolve/email", file));
}

/** Data URI das logos — o preview local não depende do deploy. */
export function emailLogoDataUris(): { evolve: string; somma: string } {
  return {
    evolve: `data:image/png;base64,${emailAssetPng("evolve-logo.png").toString("base64")}`,
    somma: `data:image/png;base64,${emailAssetPng("somma-logo.png").toString("base64")}`,
  };
}

export interface DesafioEsteirasTicketEmailData {
  nome: string;
  email: string;
  ticketCode: string;
  ticketUrl: string;
  unitNome: string;
  unitEndereco: string;
  qrSrc: string;
  evolveLogoSrc?: string;
  sommaLogoSrc?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

/** Assunto curto o bastante para não cortar na lista do Gmail no celular. */
export function desafioEsteirasTicketSubject(ticketCode: string): string {
  return `Seu ticket · ${ticketCode}`;
}

export function renderDesafioEsteirasTicketEmail(data: DesafioEsteirasTicketEmailData): string {
  const nome = escapeHtml(firstName(data.nome));
  const nomeCompleto = escapeHtml(data.nome.trim());
  const code = escapeHtml(data.ticketCode);
  const url = escapeHtml(data.ticketUrl);
  const unidade = escapeHtml(data.unitNome);
  const endereco = escapeHtml(data.unitEndereco);
  const qr = escapeHtml(data.qrSrc);
  const evolveLogo = escapeHtml(data.evolveLogoSrc ?? EMAIL_EVOLVE_LOGO_URL);
  const sommaLogo = escapeHtml(data.sommaLogoSrc ?? EMAIL_SOMMA_LOGO_URL);

  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Seu ticket · ${code}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light only; }
    html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background: #08080a; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    a[x-apple-data-detectors],
    #MessageViewBody a { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

    /* Celular: Gmail, Apple Mail, Outlook iOS. Inbox desktop (~560px) não entra aqui. */
    @media only screen and (max-width: 480px) {
      .outer-pad { padding: 12px 8px !important; }
      .shell { width: 100% !important; }
      .pad-head { padding: 18px 16px 16px !important; }
      .pad-body { padding: 22px 16px 8px !important; }
      .pad-qr { padding: 22px 16px 20px !important; }
      .pad-foot { padding: 16px !important; }
      .title {
        font-size: 30px !important;
        line-height: 0.88 !important;
      }
      .hello { font-size: 16px !important; }
      .meta-label { font-size: 9px !important; }
      .meta-value { font-size: 13px !important; }
      .field-title { font-size: 18px !important; }
      .qr-img {
        width: 240px !important;
        height: 240px !important;
        max-width: 240px !important;
      }
      .ticket-code { font-size: 18px !important; }
      .btn-text { padding: 16px 12px !important; font-size: 12px !important; }
      .logo-ev { width: 68px !important; height: 18px !important; }
      .logo-so { width: 67px !important; height: 18px !important; }
      .logo-x { font-size: 10px !important; padding: 0 6px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#08080a;width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#08080a;opacity:0;">
    Ticket confirmado · ${code} · ${EVENT.dataLabel} · ${EVENT.horaLabel} · mostre o QR na recepção
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080a;width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:28px 16px;">

        <!--[if mso]>
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" class="shell" width="560" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:560px;background:#f2f0ec;">

          <!-- Cabeçalho: logos oficiais, iguais ao lockup da landing -->
          <tr>
            <td class="pad-head" bgcolor="#08080a" style="background:#08080a;padding:20px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle" style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding:0;line-height:0;">
                          <img
                            class="logo-ev"
                            src="${evolveLogo}"
                            alt="Evolve"
                            width="84"
                            height="22"
                            style="display:block;width:84px;height:22px;border:0;outline:none;"
                          />
                        </td>
                        <td class="logo-x" valign="middle" style="padding:0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1;color:#ff2c04;font-weight:bold;">×</td>
                        <td valign="middle" style="padding:0;line-height:0;">
                          <img
                            class="logo-so"
                            src="${sommaLogo}"
                            alt="SOMMA Club"
                            width="82"
                            height="22"
                            style="display:block;width:82px;height:22px;border:0;outline:none;"
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8a8884;white-space:nowrap;padding-left:12px;">
                    Credencial
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Barra de energia (duas metades sólidas — e-mail não carrega gradient) -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" height="3" bgcolor="#e0261b" style="background:#e0261b;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="50%" height="3" bgcolor="#ff2c04" style="background:#ff2c04;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td class="pad-body" bgcolor="#f2f0ec" style="background:#f2f0ec;padding:28px 28px 12px;">
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#e0261b;">
                ${escapeHtml(EVENT.realizacao)}
              </p>
              <h1 class="title" style="margin:10px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:40px;line-height:0.86;letter-spacing:-0.04em;text-transform:uppercase;color:#08080a;font-weight:900;">
                DESAFIO<br />DAS ESTEIRAS
              </h1>
              <p class="hello" style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#3a3a3e;">
                Olá, <strong style="color:#08080a;">${nome}</strong>. Sua inscrição está confirmada. Este é o seu ticket — mostre o QR Code na recepção da unidade.
              </p>
            </td>
          </tr>

          <!-- Meta -->
          <tr>
            <td bgcolor="#f2f0ec" style="background:#f2f0ec;padding:0 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #d9d6d0;border-bottom:1px solid #d9d6d0;">
                <tr>
                  <td width="33%" valign="top" style="padding:14px 8px 14px 0;">
                    <p class="meta-label" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Data</p>
                    <p class="meta-value" style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:bold;color:#08080a;">${EVENT.dataCurta}</p>
                  </td>
                  <td width="33%" valign="top" style="padding:14px 8px;">
                    <p class="meta-label" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Início</p>
                    <p class="meta-value" style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:bold;color:#08080a;">${EVENT.horaLabel}</p>
                  </td>
                  <td width="34%" valign="top" style="padding:14px 0 14px 8px;">
                    <p class="meta-label" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Status</p>
                    <p class="meta-value" style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:bold;color:#ff2c04;">Confirmado</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Unidade + participante -->
          <tr>
            <td bgcolor="#f2f0ec" style="background:#f2f0ec;padding:22px 28px 8px;">
              <p class="meta-label" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Unidade</p>
              <p class="field-title" style="margin:8px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:20px;line-height:1.15;letter-spacing:-0.02em;text-transform:uppercase;color:#08080a;">${unidade}</p>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#5c5c60;">${endereco}</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f2f0ec" style="background:#f2f0ec;padding:18px 28px 24px;">
              <p class="meta-label" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Participante</p>
              <p class="field-title" style="margin:8px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:20px;line-height:1.2;letter-spacing:-0.02em;text-transform:uppercase;color:#08080a;">${nomeCompleto}</p>
            </td>
          </tr>

          <!-- Picote -->
          <tr>
            <td bgcolor="#f2f0ec" style="background:#f2f0ec;padding:0 28px;">
              <div style="border-top:1px dashed #bdbab4;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- QR: coluna única, centralizado — no celular fica grande o bastante para escanear da tela -->
          <tr>
            <td class="pad-qr" bgcolor="#f2f0ec" align="center" style="background:#f2f0ec;padding:28px 28px 12px;">
              <p class="meta-label" style="margin:0 0 16px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">QR de validação</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#f2f0ec" style="background:#f2f0ec;border:1px solid #d9d6d0;">
                <tr>
                  <td align="center" valign="middle" bgcolor="#f2f0ec" style="background:#f2f0ec;padding:8px;">
                    <img
                      class="qr-img"
                      src="${qr}"
                      alt="QR Code do ticket ${code}"
                      width="220"
                      height="220"
                      style="display:block;width:220px;height:220px;border:0;background:#f2f0ec;"
                    />
                  </td>
                </tr>
              </table>
              <p class="meta-label" style="margin:18px 0 0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Ticket</p>
              <p class="ticket-code" style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:bold;letter-spacing:0.04em;color:#08080a;word-break:break-all;">${code}</p>
              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#5c5c60;max-width:320px;">
                Chegue à unidade com este e-mail aberto ou com o ticket salvo no celular.
              </p>
            </td>
          </tr>

          <!-- CTA full-width — alvo de toque ≥ 48px no celular -->
          <tr>
            <td bgcolor="#f2f0ec" style="background:#f2f0ec;padding:8px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#ff2c04" style="background:#ff2c04;">
                    <a class="btn-text" href="${url}" target="_blank" style="display:block;padding:16px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;color:#08080a;text-decoration:none;">
                      Abrir meu ticket
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Faixa inferior -->
          <tr>
            <td class="pad-foot" bgcolor="#08080a" style="background:#08080a;padding:16px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8884;">
                    4 unidades · 1 desafio
                  </td>
                  <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8884;">
                    ${EVENT.dataLabel}&nbsp;·&nbsp;${EVENT.horaLabel}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->

        <p style="margin:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8a8884;text-align:center;">
          Evolve + SOMMA Club · ${EVENT.dataExtenso} · ${EVENT.horaExtenso}<br />
          <a href="${SITE_URL}" style="color:#ff2c04;text-decoration:none;">sommaclub.com.br</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderDesafioEsteirasTicketText(data: Omit<DesafioEsteirasTicketEmailData, "qrSrc">): string {
  return [
    `Olá, ${firstName(data.nome)}.`,
    "",
    `Sua inscrição no ${EVENT.nome} está confirmada.`,
    "",
    `Ticket: ${data.ticketCode}`,
    `Unidade: ${data.unitNome}`,
    `${data.unitEndereco}`,
    `Quando: ${EVENT.dataExtenso}, ${EVENT.horaExtenso}`,
    "",
    "Mostre o QR Code deste e-mail na recepção, ou abra seu ticket:",
    data.ticketUrl,
    "",
    `${EVENT.realizacao}`,
  ].join("\n");
}

export async function sendDesafioEsteirasTicketEmail(input: {
  nome: string;
  email: string;
  ticketCode: string;
  ticketToken: string;
  unit: EventUnit;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();

  if (!resend || !from) {
    console.error("[desafio-esteiras-email] RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
    return { ok: false, error: "Resend não configurado" };
  }

  const url = ticketUrl(input.ticketToken);
  const qrPng = await ticketQrPng(input.ticketToken);
  const evolvePng = emailAssetPng("evolve-logo.png");
  const sommaPng = emailAssetPng("somma-logo.png");
  const payload: DesafioEsteirasTicketEmailData = {
    nome: input.nome,
    email: input.email,
    ticketCode: input.ticketCode,
    ticketUrl: url,
    unitNome: input.unit.nome,
    unitEndereco: input.unit.endereco,
    qrSrc: `cid:${QR_CID}`,
    evolveLogoSrc: `cid:${EVOLVE_LOGO_CID}`,
    sommaLogoSrc: `cid:${SOMMA_LOGO_CID}`,
  };

  const { data: result, error } = await resend.emails.send({
    from,
    to: input.email,
    subject: desafioEsteirasTicketSubject(input.ticketCode),
    html: renderDesafioEsteirasTicketEmail(payload),
    text: renderDesafioEsteirasTicketText(payload),
    attachments: [
      {
        filename: `ticket-${input.ticketCode}.png`,
        content: qrPng,
        contentId: QR_CID,
      },
      {
        filename: "evolve-logo.png",
        content: evolvePng,
        contentId: EVOLVE_LOGO_CID,
      },
      {
        filename: "somma-logo.png",
        content: sommaPng,
        contentId: SOMMA_LOGO_CID,
      },
    ],
  });

  if (error) {
    console.error("[desafio-esteiras-email] Falha ao enviar e-mail:", error);
    return { ok: false, error: error.message };
  }

  console.log("[desafio-esteiras-email] E-mail enviado:", result?.id);
  return { ok: true, id: result?.id };
}
