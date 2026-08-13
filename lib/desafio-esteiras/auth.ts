import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, safeCompare, verifySignedToken } from "@/lib/auth/session-token";
import { UNITS, type UnitId } from "./event.config";

/**
 * Acesso operacional do evento.
 *
 * - `admin`    → vê e valida tudo, em qualquer unidade.
 * - `operador` → vê e valida SOMENTE a própria unidade.
 *
 * As senhas vivem em variáveis de ambiente (uma por papel). Nenhuma senha
 * é comparada com `===`: usamos comparação de tempo constante.
 */
export type OperatorRole = "admin" | "operador";

export interface OperatorSession {
  role: OperatorRole;
  /** `null` para o admin geral. */
  unitId: UnitId | null;
  nome: string;
}

const COOKIE = "dst_op";
const PURPOSE = "desafio-esteiras-operador";
const MAX_AGE = 60 * 60 * 12; // 12h — cobre um dia de operação sem sessão eterna

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

/** Nome da env var de senha de cada operador de unidade. */
export function unitPasswordEnv(unitId: string): string {
  return `DESAFIO_ESTEIRAS_OP_${unitId.toUpperCase().replace(/-/g, "_")}_PASSWORD`;
}

/** Descobre o papel a partir da senha digitada. Retorna `null` se nenhuma bater. */
export function resolveRole(password: string): OperatorSession | null {
  if (!password) return null;

  const adminPass = process.env.DESAFIO_ESTEIRAS_ADMIN_PASSWORD;
  if (adminPass && safeCompare(password, adminPass)) {
    return { role: "admin", unitId: null, nome: "Admin geral" };
  }

  for (const unit of UNITS) {
    const pass = process.env[unitPasswordEnv(unit.id)];
    if (pass && safeCompare(password, pass)) {
      return { role: "operador", unitId: unit.id as UnitId, nome: `Operador ${unit.curto}` };
    }
  }

  return null;
}

export function sessionCookie(session: OperatorSession): { name: string; value: string; opts: typeof COOKIE_OPTS } {
  return {
    name: COOKIE,
    value: createSignedToken(PURPOSE, session as unknown as Record<string, unknown>, MAX_AGE),
    opts: COOKIE_OPTS,
  };
}

export const CLEAR_COOKIE = { name: COOKIE, value: "", opts: { ...COOKIE_OPTS, maxAge: 0 } };

/** Lê a sessão do cookie. Use em Server Components e rotas. */
export async function getOperatorSession(): Promise<OperatorSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  const payload = verifySignedToken<Record<string, unknown> & OperatorSession>(PURPOSE, token);
  if (!payload) return null;
  if (payload.role !== "admin" && payload.role !== "operador") return null;
  return { role: payload.role, unitId: payload.unitId ?? null, nome: payload.nome };
}

type Guard = { ok: true; session: OperatorSession } | { ok: false; response: NextResponse };

/** Guarda para rotas de API do admin. */
export async function requireOperator(): Promise<Guard> {
  const session = await getOperatorSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

/** Um operador de unidade não pode tocar em inscrição de outra unidade. */
export function canActOnUnit(session: OperatorSession, unitId: string): boolean {
  return session.role === "admin" || session.unitId === unitId;
}

/** Existe pelo menos uma senha configurada? Serve para avisar no login. */
export function authConfigured(): boolean {
  if (process.env.DESAFIO_ESTEIRAS_ADMIN_PASSWORD) return true;
  return UNITS.some((u) => Boolean(process.env[unitPasswordEnv(u.id)]));
}
