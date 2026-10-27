import "server-only";
import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { CORES, EVENTO_PATH, PREFIXO_TICKET, SITE_URL } from "./event.config";

/** Sem 0/O, 1/I/L: o código é lido em voz alta e digitado no balcão. */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function codigo(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALFABETO[bytes[i] % ALFABETO.length];
  return out;
}

/** DLR-8F4X29. Único no banco (`evento_participantes_ticket_code_key`). */
export function gerarTicketCode(): string {
  return `${PREFIXO_TICKET}-${codigo(6)}`;
}

/**
 * Token do QR e da URL do ingresso: 32 bytes aleatórios em base64url. Não
 * carrega dado pessoal e não dá para adivinhar, então a URL pode ir no QR.
 */
export function gerarTicketToken(): string {
  return randomBytes(32).toString("base64url");
}

export function caminhoIngresso(token: string): string {
  return `${EVENTO_PATH}/ingresso/${token}`;
}

/**
 * O conteúdo do QR. É a URL completa (e não só o token) porque assim a
 * câmera de qualquer celular abre o ingresso, e o leitor da gestão extrai o
 * token do fim da URL (`/ingresso/<token>`).
 */
export function urlIngresso(token: string): string {
  return `${SITE_URL}${caminhoIngresso(token)}`;
}

export function tokenValido(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token);
}

export async function qrSvg(token: string): Promise<string> {
  const svg = await QRCode.toString(urlIngresso(token), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: CORES.tinta, light: "#ffffff" },
  });
  return svg
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace("<svg ", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="QR Code do ingresso" ');
}

export async function qrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(urlIngresso(token), {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 600,
    color: { dark: CORES.tinta, light: "#ffffff" },
  });
}
