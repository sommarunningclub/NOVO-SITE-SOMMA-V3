import "server-only";
import { randomBytes } from "crypto";
import { EVENTO_PATH, SITE_URL } from "./event.config";

/**
 * Alfabeto sem caracteres ambíguos (0/O, 1/I/L). O código é lido em voz alta e
 * digitado no balcão de check-in — confusão ali custa fila.
 */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function codigo(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALFABETO[bytes[i] % ALFABETO.length];
  return out;
}

/** SD-8F4X29 — SOMMA DAY + 6 caracteres. */
export function gerarTicketCode(): string {
  return `SD-${codigo(6)}`;
}

/**
 * Token do QR e da URL da credencial. 32 bytes → base64url (43 chars).
 * Não carrega dado pessoal: é só um identificador impossível de adivinhar.
 */
export function gerarTicketToken(): string {
  return randomBytes(32).toString("base64url");
}

/** A página de confirmação — é o link que vai no e-mail e no fim da inscrição. */
export function urlObrigado(token: string): string {
  return `${SITE_URL}${EVENTO_PATH}/obrigado/${token}`;
}

/** Mantida para os links já emitidos; a rota redireciona para /obrigado. */
export function urlCredencial(token: string): string {
  return `${SITE_URL}${EVENTO_PATH}/credencial/${token}`;
}

/** Aceita a URL completa lida do QR ou só o token, e devolve o token. */
export function extrairToken(raw: string): string {
  const valor = String(raw ?? "").trim();
  return valor.match(/\/(?:credencial|obrigado)\/([A-Za-z0-9_-]{20,})/)?.[1] ?? valor;
}
