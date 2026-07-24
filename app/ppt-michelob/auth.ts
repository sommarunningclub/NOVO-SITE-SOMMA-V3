import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Trava da apresentação.
 *
 * A verificação acontece só no servidor: a senha nunca vai para o navegador e
 * o conteúdo do deck só é renderizado depois que o cookie está válido. Um
 * bloqueio feito no cliente não protegeria nada, porque tanto a senha quanto os
 * slides já teriam sido baixados junto com a página.
 */

export const COOKIE = "ppt-michelob";
const DIAS = 30;

/** Trocável por variável de ambiente na Vercel, sem precisar de novo deploy. */
function codigo(): string {
  return process.env.PPT_MICHELOB_CODE?.trim() || "258510";
}

/** Segredo para assinar o cookie. Sem ele, cai no próprio código. */
function segredo(): string {
  return process.env.PPT_MICHELOB_SECRET || `somma:${codigo()}`;
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
  path: "/ppt-michelob",
  maxAge: 60 * 60 * 24 * DIAS,
};
