import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, safeCompare, verifySignedToken } from "@/lib/auth/session-token";

/**
 * Acesso ao módulo de campanhas.
 *
 * Papel único: quem entra aqui dispara e-mail para a base inteira, então não
 * existe versão "só olhar" que valha a complexidade de dois papéis. A senha vive
 * em `CAMPANHAS_ADMIN_PASSWORD`.
 *
 * Não reusa o auth do Desafio das Esteiras de propósito: aquele tem papéis de
 * unidade e prazo de vida amarrados a um evento com data. Amarrar campanhas a
 * isso faria a régua expirar junto com o evento.
 */

const COOKIE = "camp_op";
const PURPOSE = "campanhas-operador";
const MAX_AGE = 60 * 60 * 8; // 8h: uma jornada, não uma sessão eterna

export const COOKIE_OPTS = {
  httpOnly: true,
  // `strict`: nenhuma navegação vinda de fora carrega o cookie, então um link
  // hostil não chega ao painel já autenticado. O custo é que abrir /admin por
  // um link de e-mail mostra o login uma vez — recarregar resolve. Para um
  // painel que dispara e-mail para a base inteira, é troca barata.
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export interface CampanhaSession {
  role: "admin";
}

export function authConfigured(): boolean {
  return Boolean(process.env.CAMPANHAS_ADMIN_PASSWORD);
}

/** Comparação de tempo constante: nunca `===` em senha. */
export function resolveLogin(senha: string): CampanhaSession | null {
  const esperada = process.env.CAMPANHAS_ADMIN_PASSWORD;
  if (!esperada || !senha) return null;
  return safeCompare(senha, esperada) ? { role: "admin" } : null;
}

export function sessionCookie(session: CampanhaSession) {
  return {
    name: COOKIE,
    value: createSignedToken(PURPOSE, { role: session.role }, MAX_AGE),
    opts: COOKIE_OPTS,
  };
}

export const CLEAR_COOKIE = {
  name: COOKIE,
  value: "",
  opts: { ...COOKIE_OPTS, maxAge: 0 },
};

export async function getSession(): Promise<CampanhaSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const payload = verifySignedToken<{ role?: string }>(PURPOSE, token);
  return payload?.role === "admin" ? { role: "admin" } : null;
}

/**
 * Porta de entrada das rotas de API. Devolve a sessão ou a resposta de recusa,
 * para a rota poder fazer `if (!auth.ok) return auth.response` numa linha.
 */
export async function requireCampanhaAuth(): Promise<
  { ok: true; session: CampanhaSession } | { ok: false; response: NextResponse }
> {
  if (!authConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso não configurado. Defina CAMPANHAS_ADMIN_PASSWORD." },
        { status: 503 }
      ),
    };
  }
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) };
  }
  return { ok: true, session };
}
