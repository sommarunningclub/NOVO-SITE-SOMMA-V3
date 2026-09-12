import "server-only";
import QRCode from "qrcode";
import { CORES } from "./event.config";
import { urlObrigado } from "./ticket";

/**
 * QR da credencial.
 *
 * O conteúdo é só a URL do ticket (que carrega o token opaco) — nenhum dado
 * pessoal viaja no código. Em SVG para a tela (nítido em qualquer densidade,
 * inclusive impresso) e em PNG para o e-mail, porque cliente de e-mail não
 * renderiza SVG de forma confiável.
 */
export async function ticketQrSvg(token: string): Promise<string> {
  const svg = await QRCode.toString(urlObrigado(token), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: CORES.tinta, light: "#ffffff" },
  });
  return svg
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace("<svg ", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ');
}

export async function ticketQrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(urlObrigado(token), {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 560,
    color: { dark: CORES.tinta, light: "#ffffff" },
  });
}
