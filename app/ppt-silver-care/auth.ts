import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Trava da proposta Somma Club × Silver Care.
 *
 * Mesma mecânica das rotas /ppt-michelob*, com cookie e segredo próprios: o
 * acesso desta apresentação é independente dos outros decks e pode receber um
 * código próprio por variável de ambiente.
 */

export const COOKIE = "ppt-silver-care";
const DIAS = 30;

/** Código próprio desta proposta; cai no padrão dos decks comerciais. */
function codigo(): string {
  return process.env.PPT_SILVER_CARE_CODE?.trim() || "258510";
}

/** Segredo para assinar o cookie. Prefixo distinto, tokens não se cruzam. */
function segredo(): string {
  return process.env.PPT_SILVER_CARE_SECRET || `somma-silver-care:${codigo()}`;
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
  path: "/ppt-silver-care",
  maxAge: 60 * 60 * 24 * DIAS,
};
