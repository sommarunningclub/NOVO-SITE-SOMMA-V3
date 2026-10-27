import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, safeCompare, verifySignedToken } from "@/lib/auth/session-token";

/**
 * Trava do painel /assessoria/maratona-rio-2027/admin.
 *
 * O painel mostra CPF, telefone e e-mail, e o repositório é público: a senha
 * vive só na env var, sem valor padrão no código. Sem a env, o painel avisa o
 * que falta em vez de abrir. Cookie HMAC assinado (lib/auth/session-token).
 */

export const COOKIE = "rio27_admin";
const PROPOSITO = "maratona-rio-2027-admin";
const DURACAO = 60 * 60 * 12; // 12h

export const ENV_SENHA = "MARATONA_RIO_ADMIN_SENHA";

export function acessoConfigurado(): boolean {
  return Boolean(process.env[ENV_SENHA]);
}

export function senhaCorreta(tentativa: string): boolean {
  const senha = process.env[ENV_SENHA];
  return Boolean(senha) && safeCompare(tentativa.trim(), senha!.trim());
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
  return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
}

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // strict: o painel apaga cadastros; nada disso pode vir de navegação de fora.
  sameSite: "strict" as const,
  path: "/",
  maxAge: DURACAO,
};
