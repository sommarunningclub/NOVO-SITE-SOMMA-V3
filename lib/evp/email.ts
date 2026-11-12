import "server-only";
import QRCode from "qrcode";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { CAMINHO, NOME_CURTO, PREFIXO_QR, ROTULO_DISTANCIA, SITE, type DistanciaInscricao } from "./config";
import { dataLonga, horario } from "./formato";
import type { EventoPublico, StatusInscricao } from "./tipos";

/**
 * E-mail de confirmação do Meeting Técnico.
 *
 * Tabela e estilo inline, para abrir igual no Gmail, no Outlook e no app do
 * celular. Quem tem vaga confirmada recebe o QR Code dentro do e-mail (imagem
 * anexada em linha), para entrar mesmo sem internet no dia. Quem está na lista
 * de espera não recebe QR. Sem travessão na copy.
 */

const LARANJA = "#FF2C03";
const PRETO = "#080808";
const CARTAO = "#141414";
const TEXTO = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const TITULO = "'Arial Black','Helvetica Neue',Arial,sans-serif";

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type MotivoEmail = "inscricao" | "promovida" | "reenvio";

type Dados = {
  nome: string;
  email: string;
  codigo: string;
  ticketToken: string;
  distancia: DistanciaInscricao;
  status: StatusInscricao;
  posicaoFila?: number | null;
  evento: Pick<EventoPublico, "starts_at" | "ends_at" | "local_nome" | "endereco">;
  motivo: MotivoEmail;
  /** Identificador do QR. Só para inscrição confirmada. */
  qrToken?: string | null;
};

const QR_CID = "qr-meeting-tecnico";

export function urlDoIngresso(ticketToken: string, base = SITE): string {
  return `${base}${CAMINHO}/obrigado?t=${encodeURIComponent(ticketToken)}`;
}

function assunto(d: Dados): string {
  if (d.status === "lista_espera") return `Você está na lista de espera do ${NOME_CURTO}`;
  if (d.motivo === "promovida") return `Saiu a sua vaga no ${NOME_CURTO} da Monumental`;
  if (d.motivo === "reenvio") return `Seu ingresso do ${NOME_CURTO} da Monumental`;
  return `Você está dentro: ${NOME_CURTO} da Maratona Monumental`;
}

function linha(rotulo: string, valor: string): string {
  return `<tr>
    <td style="padding:10px 0;border-top:1px solid #2a2a2a;font:11px ${TEXTO};letter-spacing:2px;text-transform:uppercase;color:#8a8a8a;width:38%;vertical-align:top;">${esc(rotulo)}</td>
    <td style="padding:10px 0;border-top:1px solid #2a2a2a;font:15px ${TEXTO};color:#ffffff;vertical-align:top;">${esc(valor)}</td>
  </tr>`;
}

/**
 * `base` é de onde saem as logos. No envio é o site; a prévia local passa o
 * caminho do disco. As logos são PNG porque o Gmail não mostra SVG.
 */
export function montarEmail(d: Dados, qrSrc?: string | null, base = SITE): { subject: string; html: string; text: string } {
  const logo = (arquivo: string) => `${base}${CAMINHO}/email/${arquivo}`;
  const primeiro = d.nome.trim().split(/\s+/)[0] || d.nome;
  const espera = d.status === "lista_espera";
  const url = urlDoIngresso(d.ticketToken);
  const data = dataLonga(d.evento.starts_at) ?? "Em breve";
  const hora = horario(d.evento.starts_at, d.evento.ends_at) ?? "Em breve";
  const local = d.evento.local_nome ?? "Local em definição";

  const titulo = espera ? "LISTA DE ESPERA." : "YOU'RE IN.";
  const abertura = espera
    ? `${primeiro}, as vagas do Meeting Técnico estão preenchidas e você entrou na lista de espera${
        d.posicaoFila ? `, na posição ${d.posicaoFila}` : ""
      }. Se uma vaga abrir, ela é sua pela ordem de chegada, e a gente avisa neste e-mail.`
    : d.motivo === "promovida"
      ? `${primeiro}, uma vaga abriu e ela é sua. Sua participação no Meeting Técnico está confirmada.`
      : `Obrigado pela inscrição, ${primeiro}. Sua participação no Meeting Técnico está confirmada.`;
  const apoio = espera
    ? "Enquanto isso, o link abaixo mostra a sua situação atualizada."
    : qrSrc
      ? "No dia, apresente este QR Code na recepção. Ele é pessoal: não encaminhe este e-mail. O mesmo ingresso fica na página abaixo."
      : "No dia, apresente o QR Code do seu ingresso na recepção. Ele fica na página abaixo, que é só sua: não compartilhe o link.";
  const blocoQr =
    qrSrc && !espera
      ? `<tr><td align="center" style="background:#F4F1EA;border-radius:14px;padding:22px;">
        <img src="${qrSrc}" width="200" height="200" alt="QR Code do seu ingresso" style="display:block;width:200px;height:200px;border:0;">
        <div style="font:700 20px ${TEXTO};letter-spacing:2px;color:#080808;padding-top:12px;">${esc(d.codigo)}</div>
        <div style="font:12px ${TEXTO};color:#555555;padding-top:4px;">Apresente na recepção</div>
      </td></tr>
      <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>`
      : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:${PRETO};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PRETO};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding-bottom:26px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;"><img src="${logo("somma-logo.png")}" width="112" height="30" alt="SOMMA Club" style="display:block;border:0;width:112px;height:30px;color:#ffffff;font:700 14px ${TEXTO};"></td>
          <td style="width:22px;font-size:0;line-height:0;">&nbsp;</td>
          <td style="vertical-align:middle;"><img src="${logo("bora-logo.png")}" width="110" height="28" alt="BORA Assessoria" style="display:block;border:0;width:110px;height:28px;color:#ffffff;font:700 14px ${TEXTO};"></td>
        </tr></table>
      </td></tr>
      <tr><td style="font:900 44px/1 ${TITULO};color:#ffffff;letter-spacing:-1px;padding-bottom:20px;">${titulo}</td></tr>
      <tr><td style="font:16px/1.55 ${TEXTO};color:#d6d6d6;padding-bottom:24px;">${esc(abertura)}</td></tr>
      <tr><td style="background:${CARTAO};border-radius:14px;padding:22px 22px 12px;">
        <div style="font:11px ${TEXTO};letter-spacing:2px;text-transform:uppercase;color:#8a8a8a;">Meeting Técnico</div>
        <div style="font:700 19px/1.3 ${TEXTO};color:#ffffff;padding:6px 0 14px;">Maratona Monumental de Brasília 2026</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${linha("Nome", d.nome)}
          ${linha("Distância", ROTULO_DISTANCIA[d.distancia])}
          ${linha("Data", data)}
          ${linha("Horário", hora)}
          ${linha("Local", d.evento.endereco ? `${local}, ${d.evento.endereco}` : local)}
          ${linha("Código", d.codigo)}
        </table>
      </td></tr>
      <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>
      ${blocoQr}
      <tr><td style="padding:12px 0 10px;">
        <a href="${url}" style="display:inline-block;background:${LARANJA};color:#ffffff;font:700 14px ${TEXTO};letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:16px 26px;border-radius:999px;">
          ${espera ? "Ver minha situação" : "Abrir meu ingresso"}
        </a>
      </td></tr>
      <tr><td style="font:14px/1.55 ${TEXTO};color:#a8a8a8;padding:8px 0 26px;">${esc(apoio)}</td></tr>
      <tr><td style="border-top:1px solid #2a2a2a;padding-top:18px;font:12px/1.6 ${TEXTO};color:#7a7a7a;">
        O Meeting Técnico é um encontro do SOMMA Club e da BORA Assessoria. Não é um evento da organização da Maratona Monumental de Brasília.<br>
        Você recebeu este e-mail porque se inscreveu em sommaclub.com.br${CAMINHO}.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    titulo,
    "",
    abertura,
    "",
    `Nome: ${d.nome}`,
    `Distância: ${ROTULO_DISTANCIA[d.distancia]}`,
    `Data: ${data}`,
    `Horário: ${hora}`,
    `Local: ${local}`,
    `Código: ${d.codigo}`,
    "",
    `${espera ? "Minha situação" : "Meu ingresso"}: ${url}`,
    "",
    apoio,
  ].join("\n");

  return { subject: assunto(d), html, text };
}

/** Nunca lança: a inscrição já está gravada, e e-mail fora do ar não pode virar erro na tela. */
export async function enviarConfirmacao(d: Dados): Promise<{ ok: boolean; motivo?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) return { ok: false, motivo: "nao_configurado" };
  try {
    const comQr = d.status === "confirmada" && Boolean(d.qrToken);
    const qrPng = comQr
      ? await QRCode.toBuffer(`${PREFIXO_QR}${d.qrToken}`, { margin: 1, width: 400, errorCorrectionLevel: "M", color: { dark: "#080808", light: "#F4F1EA" } })
      : null;
    const { subject, html, text } = montarEmail(d, qrPng ? `cid:${QR_CID}` : null);
    const { error } = await resend.emails.send({
      from,
      to: d.email,
      subject,
      html,
      text,
      ...(qrPng ? { attachments: [{ filename: `ingresso-${d.codigo}.png`, content: qrPng, contentId: QR_CID }] } : {}),
    });
    if (error) {
      console.error("[evp] E-mail não enviado:", error.message);
      return { ok: false, motivo: "falha" };
    }
    return { ok: true };
  } catch (erro) {
    console.error("[evp] E-mail não enviado:", erro instanceof Error ? erro.message : erro);
    return { ok: false, motivo: "falha" };
  }
}
