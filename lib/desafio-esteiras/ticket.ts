import "server-only";
import { randomBytes } from "crypto";
import { EVENT_PATH, SITE_URL, type EventUnit } from "./event.config";

/**
 * Alfabeto Crockford-like sem caracteres ambíguos (0/O, 1/I/L). O código é lido
 * em voz alta e digitado no balcão de check-in — evitar confusão é requisito.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** DST-VP-8F4X29 — DST (Desafio das eSTeiras) + prefixo da unidade + 6 chars. */
export function generateTicketCode(unit: EventUnit): string {
  return `DST-${unit.ticketPrefix}-${randomCode(6)}`;
}

/** O código impresso precisa bater com a unidade atual — senão a transferência reemite. */
export function ticketPertenceAUnidade(ticketCode: string, unit: EventUnit): boolean {
  return ticketCode.toUpperCase().startsWith(`DST-${unit.ticketPrefix}-`);
}

/**
 * Token do QR e da URL do ticket. 32 bytes → base64url (43 chars).
 * Não carrega dado pessoal: é só um identificador impossível de adivinhar.
 */
export function generateTicketToken(): string {
  return randomBytes(32).toString("base64url");
}

export function ticketUrl(token: string): string {
  return `${SITE_URL}${EVENT_PATH}/confirmado/${token}`;
}

/** Conteúdo do QR Code: a própria URL do ticket (abre a credencial no celular). */
export function qrPayload(token: string): string {
  return ticketUrl(token);
}

/** Aceita a URL completa do QR ou só o token, e devolve o token. */
export function extractToken(raw: string): string {
  const value = raw.trim();
  const match = value.match(/\/confirmado\/([A-Za-z0-9_-]{20,})/);
  if (match) return match[1];
  return value;
}

/** Normaliza um código digitado: maiúsculo, sem espaço, com hífens no lugar. */
export function normalizeTicketCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean.startsWith("DST")) return raw.trim().toUpperCase();
  const rest = clean.slice(3);
  const prefix = rest.slice(0, 2);
  const code = rest.slice(2);
  return code ? `DST-${prefix}-${code}` : `DST-${prefix}`;
}
