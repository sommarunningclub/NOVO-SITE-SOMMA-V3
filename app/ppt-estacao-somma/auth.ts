import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Trava da apresentação Estação SOMMA (SOMMA Club + Evolve).
 *
 * Mesma mecânica dos outros decks comerciais (/ppt-silver-care, /ppt-michelob*):
 * código de 6 dígitos verificado no servidor e cookie assinado próprio desta
 * rota, então o acesso é independente das demais apresentações.
 */

export const COOKIE = "ppt-estacao-somma";
const DIAS = 30;

/** Código desta apresentação. Pode ser trocado por variável de ambiente. */
function codigo(): string {
  return process.env.PPT_ESTACAO_SOMMA_CODE?.trim() || "101010";
}

/** Segredo para assinar o cookie. Prefixo distinto, tokens não se cruzam. */
function segredo(): string {
  return process.env.PPT_ESTACAO_SOMMA_SECRET || `somma-estacao:${codigo()}`;
}

function assina(valor: string): string {
  return createHmac("sha256", segredo()).update(valor).digest("hex");
}

/** Comparação em tempo constante, para não vazar o acerto pelo tempo de resposta. */
function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function senhaCorreta(tentativa: string): boolean {
  return iguais(tentativa.trim(), codigo());
}

/** Valor gravado no cookie: assinado, então não dá para forjar. */
export function tokenDeAcesso(): string {
  return assina("liberado");
}

export function cookieValido(valor: string | undefined): boolean {
  if (!valor) return false;
  return iguais(valor, tokenDeAcesso());
}

export async function temAcesso(): Promise<boolean> {
  const jar = await cookies();
  return cookieValido(jar.get(COOKIE)?.value);
}

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/ppt-estacao-somma",
  maxAge: 60 * 60 * 24 * DIAS,
};
