import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, safeCompare, verifySignedToken } from "@/lib/auth/session-token";

/**
 * Trava do /check-in/interno: a equipe inscreve convidados em eventos com a
 * parte pública fechada.
 *
 * O repositório é público, então a senha vive só na env var, sem valor padrão
 * no código. Sem a env, a página avisa o que falta em vez de abrir. O acesso
 * vira um cookie HMAC assinado (lib/auth/session-token), válido por 7 dias.
 */

export const COOKIE = "checkin_interno";
const PROPOSITO = "check-in-interno";
const DURACAO = 60 * 60 * 24 * 7;

export const ENV_SENHA = "CHECKIN_INTERNO_SENHA";

export function acessoConfigurado(): boolean {
  return Boolean(process.env[ENV_SENHA]?.trim());
}

export function senhaCorreta(tentativa: string): boolean {
  const senha = process.env[ENV_SENHA]?.trim();
  return Boolean(senha) && safeCompare(tentativa.trim(), senha!);
}

export function tokenDeAcesso(): string {
  return createSignedToken(PROPOSITO, { ok: true }, DURACAO);
}

export async function temAcesso(): Promise<boolean> {
  if (!acessoConfigurado()) return false;
  const jar = await cookies();
  return Boolean(verifySignedToken(PROPOSITO, jar.get(COOKIE)?.value));
}

/** Para as rotas de API: devolve a resposta 401 pronta quando não há sessão. */
export async function exigirAcesso(): Promise<NextResponse | null> {
  if (await temAcesso()) return null;
  return NextResponse.json({ error: "Sessão expirada. Entre de novo com a senha." }, { status: 401 });
}

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // lax: abre já logado vindo de link no WhatsApp; POST de outro site continua sem cookie.
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURACAO,
};
