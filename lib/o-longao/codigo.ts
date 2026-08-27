import { randomBytes } from "crypto";

/**
 * Código e token da inscrição.
 *
 * `codigo` é o identificador legível que a crew guarda (LNG-8F4X29): curto,
 * sem caracteres ambíguos, ditável por telefone. `crew_token` é o segredo
 * opaco que autoriza ações da própria crew (subir logo, ver inscrição):
 * 32 bytes aleatórios, sem dado pessoal, inviável de adivinhar.
 */

/** Alfabeto sem ambíguos (0/O, 1/I/L fora). */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALFABETO[bytes[i] % ALFABETO.length];
  return out;
}

export function generateCrewCode(): string {
  return `LNG-${randomCode(6)}`;
}

export function generateCrewToken(): string {
  return randomBytes(32).toString("base64url");
}

export function normalizeCrewCode(raw: string): string {
  return String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}
