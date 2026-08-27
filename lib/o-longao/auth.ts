import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, verifySignedToken, safeCompare, authSecretConfigured } from "@/lib/auth/session-token";

/**
 * Autenticação do painel do O LONGÃO.
 *
 * Mesmo modelo dos outros módulos de admin: uma senha de operação em env
 * var, cookie HMAC assinado com `AUTH_SECRET`, e o middleware de `/admin/*`
 * conhecendo o módulo (base `o-longao`, cookie `lgo_op`). Sem senha
 * configurada o painel avisa qual env var falta em vez de abrir.
 */

export const SESSION_COOKIE = "lgo_op";
const TOKEN_PURPOSE = "o-longao-operador";
const SESSION_MAX_AGE = 60 * 60 * 12; // 12h

const ENV_ADMIN = "O_LONGAO_ADMIN_PASSWORD";

export type OperatorSession = {
  role: "admin";
  nome: string;
};

type TokenPayload = OperatorSession & { exp: number };

export function authConfigured(): boolean {
  return Boolean(process.env[ENV_ADMIN]) && authSecretConfigured();
}

export function envSugerida(): string {
  return ENV_ADMIN;
}

/** A senha define o acesso. Comparação sempre em tempo constante. */
export function resolveLogin(senha: string): OperatorSession | null {
  const admin = process.env[ENV_ADMIN];
  if (admin && safeCompare(senha, admin)) {
    return { role: "admin", nome: "Organização" };
  }
  return null;
}

export function createSessionToken(session: OperatorSession): string {
  return createSignedToken(TOKEN_PURPOSE, session, SESSION_MAX_AGE);
}

export async function getOperatorSession(): Promise<OperatorSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifySignedToken<TokenPayload>(TOKEN_PURPOSE, token);
  if (!payload?.role) return null;
  return { role: payload.role, nome: payload.nome };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // strict: o painel aprova, reprova e apaga inscrições; nenhuma dessas
    // ações deve poder ser disparada por navegação vinda de outro site.
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function requireOperator(): Promise<
  { ok: true; session: OperatorSession } | { ok: false; response: NextResponse }
> {
  const session = await getOperatorSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autorizado. Faça login no painel." }, { status: 401 }),
    };
  }
  return { ok: true, session };
}
