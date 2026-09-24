/**
 * Celular brasileiro sem API — DDD da Anatel + nono dígito 9.
 * Não consulta operadora: só recusa número que não pode existir.
 *
 * Não existe regra de "faixa" depois do 9: a Anatel já distribui 9 0xxx a
 * 9 5xxx (em 24/09/2026 a base do site tinha 31 celulares assim, em 61, 63,
 * 11 e 81) e a regra antiga barrava gente de verdade na inscrição.
 */

/** DDDs em uso no Brasil (Anatel). 23, 50, 70 etc. não existem. */
export const DDD_BRASIL = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24",
  "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

export type MotivoTelefone = "curto" | "ddd" | "fixo" | "invalido";

export const TELEFONE_MSG: Record<MotivoTelefone, string> = {
  curto: "Celular precisa ter DDD + 9 dígitos",
  ddd: "DDD inválido",
  fixo: "Use o celular com DDD (WhatsApp)",
  invalido: "Telefone inválido — confira o número",
};

/** Dígitos do celular, sem +55 e sem zero à esquerda do DDD. */
export function normalizarTelefoneBR(raw: string): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.startsWith("0") && (d.length === 11 || d.length === 12)) d = d.slice(1);
  return d;
}

export function checarCelularBR(
  raw: string,
): { ok: true } | { ok: false; motivo: MotivoTelefone } {
  const d = normalizarTelefoneBR(raw);
  if (d.length === 10) return { ok: false, motivo: "fixo" };
  if (d.length !== 11) return { ok: false, motivo: "curto" };

  if (!DDD_BRASIL.has(d.slice(0, 2))) return { ok: false, motivo: "ddd" };
  if (d[2] !== "9") return { ok: false, motivo: "fixo" };

  const aposNono = d.slice(3);
  if (/^(\d)\1+$/.test(d) || /^(\d)\1+$/.test(aposNono)) {
    return { ok: false, motivo: "invalido" };
  }

  return { ok: true };
}

export function isValidCelularBR(raw: string): boolean {
  return checarCelularBR(raw).ok;
}
