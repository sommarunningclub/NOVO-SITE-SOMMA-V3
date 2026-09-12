import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import {
  ABERTURA,
  BENEFICIOS,
  CORES,
  CRONOGRAMA,
  DATA_EXTENSO,
  ENDERECO_COMPLETO,
  EVENTO_TITULO,
  LARGADA,
  LOCAL_COMPLETO,
  MAPS_URL,
  MOTE,
  PELOTOES_ROTULO,
  SITE_URL,
  type Pelotao,
} from "@/lib/somma-day/event.config";
import { ticketQrPng } from "@/lib/somma-day/qr";
import { urlObrigado } from "@/lib/somma-day/ticket";

const QR_CID = "somma-day-qr";
const LOGO_CID = "somma-day-logo";

function assetPng(arquivo: string): Buffer {
  return readFileSync(join(process.cwd(), "public/somma-day/email", arquivo));
}

export interface SommaDayTicketEmail {
  nome: string;
  email: string;
  ticketCode: string;
  ticketToken: string;
  pelotao: string | null;
  /** Reenvio de quem já estava inscrito — o e-mail não pode parecer inscrição nova. */
  reenvio?: boolean;
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

export function sommaDayTicketSubject(reenvio = false): string {
  return reenvio
    ? "Seu ticket do SOMMA DAY (de novo, para não perder)"
    : "Tá dentro: seu ticket do SOMMA DAY";
}

/**
 * E-mail da confirmação.
 *
 * Tabelas, largura fixa e estilo inline: é o único jeito de um HTML sobreviver
 * ao Outlook, ao Gmail e ao app de e-mail do celular ao mesmo tempo. O QR vai
 * como anexo inline (cid:) porque imagem remota costuma chegar bloqueada — e o
 * QR é justamente o que a pessoa precisa ver sem clicar em "exibir imagens".
 */
export function renderSommaDayTicketEmail(dados: {
  nome: string;
  ticketCode: string;
  urlTicket: string;
  pelotao: string | null;
  qrSrc: string;
  logoSrc: string;
  reenvio?: boolean;
}): string {
  const nome = escapar(primeiroNome(dados.nome));
  const code = escapar(dados.ticketCode);
  const url = escapar(dados.urlTicket);
  const pelotao = dados.pelotao
    ? escapar(PELOTOES_ROTULO[dados.pelotao as Pelotao] ?? dados.pelotao)
    : "A definir";

  const linhasCronograma = CRONOGRAMA.map(
    (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2ddcc;width:74px;font-weight:800;color:${CORES.vermelho};font-size:14px">${item.hora}</td>
        <td style="padding:8px 0 8px 14px;border-bottom:1px solid #e2ddcc;font-size:14px;color:#101010">${escapar(item.titulo)}</td>
      </tr>`
  ).join("");

  const beneficios = BENEFICIOS.map(
    (b) =>
      `<span style="display:inline-block;border:2px solid #101010;border-radius:999px;padding:5px 12px;margin:0 6px 8px 0;font-size:12px;font-weight:700;text-transform:uppercase">${escapar(b)}</span>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapar(EVENTO_TITULO)}</title>
</head>
<body style="margin:0;padding:0;background:${CORES.creme};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#101010">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Seu código é ${code}. ${escapar(DATA_EXTENSO)}, ${escapar(LOCAL_COMPLETO)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CORES.creme};padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:3px solid #101010;border-radius:18px;overflow:hidden">

      <tr><td align="center" style="padding:28px 24px 8px;background:${CORES.creme}">
        <img src="${escapar(dados.logoSrc)}" width="180" alt="SOMMA DAY" style="display:block;width:180px;max-width:60%;height:auto"/>
      </td></tr>

      <tr><td align="center" style="padding:8px 28px 24px;background:${CORES.creme}">
        <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#6b6659">
          ${dados.reenvio ? "Você já está dentro" : "Inscrição confirmada"}
        </p>
        <p style="margin:10px 0 0;font-size:40px;line-height:1;font-weight:900;letter-spacing:-.02em">TÁ DENTRO, ${nome.toUpperCase()}.</p>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#3a372f">
          ${escapar(MOTE)} Guarde este e-mail: o código abaixo é o que vira sua pulseira na entrada.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:26px 24px;background:${CORES.amarelo};border-top:3px solid #101010;border-bottom:3px solid #101010">
        <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:.24em;text-transform:uppercase">Seu código</p>
        <p style="margin:8px 0 0;font-size:38px;line-height:1;font-weight:900;letter-spacing:.06em">${code}</p>
        <img src="${escapar(dados.qrSrc)}" width="190" alt="QR code do seu ticket" style="display:block;width:190px;height:auto;margin:18px auto 0;border:3px solid #101010;border-radius:12px;background:#fff"/>
        <p style="margin:14px 0 0;font-size:13px;font-weight:700">Apresente o QR ou o código no credenciamento.</p>
      </td></tr>

      <tr><td style="padding:26px 28px 8px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:14px;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6659">Quando</td>
            <td style="padding-bottom:14px;font-size:15px;font-weight:800;text-align:right">${escapar(DATA_EXTENSO)}</td>
          </tr>
          <tr>
            <td style="padding-bottom:14px;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6659">Horário</td>
            <td style="padding-bottom:14px;font-size:15px;font-weight:800;text-align:right">Abertura ${escapar(ABERTURA)} · largada ${escapar(LARGADA)}</td>
          </tr>
          <tr>
            <td style="padding-bottom:14px;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6659">Onde</td>
            <td style="padding-bottom:14px;font-size:15px;font-weight:800;text-align:right">${escapar(ENDERECO_COMPLETO)}</td>
          </tr>
          <tr>
            <td style="font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6659">Seu pelotão</td>
            <td style="font-size:15px;font-weight:800;text-align:right">${pelotao}</td>
          </tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:22px 28px 6px">
        <a href="${url}" style="display:inline-block;background:${CORES.vermelho};color:${CORES.creme};text-decoration:none;padding:16px 30px;border:3px solid #101010;border-radius:999px;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Abrir meu ticket</a>
        <br/>
        <a href="${escapar(MAPS_URL)}" style="display:inline-block;margin-top:12px;color:#101010;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Como chegar</a>
      </td></tr>

      <tr><td style="padding:24px 28px 6px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6659">O dia inteiro</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${linhasCronograma}</table>
      </td></tr>

      <tr><td style="padding:24px 28px 8px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6659">O que a pulseira libera</p>
        ${beneficios}
      </td></tr>

      <tr><td style="padding:18px 28px 30px">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b6659">
          Sem a pulseira não há acesso aos benefícios oficiais. Chegue com folga: às ${escapar(LARGADA)} os pelotões saem.
        </p>
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#9b9689">
          SOMMA Club · Brasília, DF · <a href="${SITE_URL}" style="color:#9b9689">sommaclub.com.br</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function renderSommaDayTicketTexto(dados: {
  nome: string;
  ticketCode: string;
  urlTicket: string;
  pelotao: string | null;
}): string {
  const pelotao = dados.pelotao
    ? PELOTOES_ROTULO[dados.pelotao as Pelotao] ?? dados.pelotao
    : "a definir";
  return [
    `TÁ DENTRO, ${primeiroNome(dados.nome).toUpperCase()}.`,
    "",
    MOTE,
    "",
    `Seu código: ${dados.ticketCode}`,
    `Pelotão: ${pelotao}`,
    "",
    DATA_EXTENSO,
    `Abertura ${ABERTURA} · largada ${LARGADA}`,
    ENDERECO_COMPLETO,
    "",
    `Seu ticket: ${dados.urlTicket}`,
    `Como chegar: ${MAPS_URL}`,
    "",
    "Apresente o código no credenciamento para receber sua pulseira.",
    "Sem pulseira não há acesso aos benefícios oficiais.",
    "",
    "SOMMA Club · Brasília, DF",
  ].join("\n");
}

/**
 * Envia e nunca derruba a inscrição.
 *
 * A vaga já está gravada quando esta função roda: se a Resend estiver fora do
 * ar, a pessoa continua inscrita e vê o ticket na tela. Por isso o retorno é
 * um resultado, não uma exceção.
 */
export async function enviarSommaDayTicket(
  input: SommaDayTicketEmail
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.warn("[somma-day-email] Resend não configurado — ticket não enviado.");
    return { ok: false, error: "Resend não configurado" };
  }

  try {
    const qrPng = await ticketQrPng(input.ticketToken);
    const logoPng = assetPng("logo.png");
    const urlTicket = urlObrigado(input.ticketToken);

    const { data, error } = await resend.emails.send({
      from,
      to: input.email,
      subject: sommaDayTicketSubject(input.reenvio),
      html: renderSommaDayTicketEmail({
        nome: input.nome,
        ticketCode: input.ticketCode,
        urlTicket,
        pelotao: input.pelotao,
        qrSrc: `cid:${QR_CID}`,
        logoSrc: `cid:${LOGO_CID}`,
        reenvio: input.reenvio,
      }),
      text: renderSommaDayTicketTexto({
        nome: input.nome,
        ticketCode: input.ticketCode,
        urlTicket,
        pelotao: input.pelotao,
      }),
      attachments: [
        { filename: `ticket-${input.ticketCode}.png`, content: qrPng, contentId: QR_CID },
        { filename: "somma-day.png", content: logoPng, contentId: LOGO_CID },
      ],
    });

    if (error) {
      console.error("[somma-day-email] Falha ao enviar:", error);
      return { ok: false, error: error.message };
    }
    console.log("[somma-day-email] Ticket enviado:", data?.id);
    return { ok: true };
  } catch (erro) {
    console.error("[somma-day-email] Erro inesperado:", erro);
    return { ok: false, error: String(erro) };
  }
}
