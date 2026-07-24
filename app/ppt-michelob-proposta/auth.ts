import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Trava da apresentação comercial (deck + Proposta Financeira).
 *
 * Mesma mecânica do /ppt-michelob, porém com cookie, segredo e código próprios:
 * como esta rota mostra o investimento, o acesso é independente e pode receber
 * um código diferente por variável de ambiente, sem afetar o pitch aberto.
 */

export const COOKIE = "ppt-michelob-proposta";
const DIAS = 30;

/** Código próprio da proposta; cai no código do deck e depois no padrão. */
function codigo(): string {
  return (
    process.env.PPT_MICHELOB_PROPOSTA_CODE?.trim() ||
    process.env.PPT_MICHELOB_CODE?.trim() ||
    "258510"
  );
}

/** Segredo para assinar o cookie. Prefixo distinto do deck, tokens não se cruzam. */
function segredo(): string {
  return process.env.PPT_MICHELOB_PROPOSTA_SECRET || `somma-proposta:${codigo()}`;
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
  path: "/ppt-michelob-proposta",
  maxAge: 60 * 60 * 24 * DIAS,
};
