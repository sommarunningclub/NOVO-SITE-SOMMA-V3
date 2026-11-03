import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSignedToken, verifySignedToken } from '@/lib/auth/session-token'

export const INSIDER_SESSION_COOKIE = 'insider_session'
const SESSION_MAX_AGE = 60 * 60 * 12 // 12h
const TOKEN_PURPOSE = 'insider'

// Etapa entre o CPF e o código do Google Authenticator.
export const INSIDER_MFA_COOKIE = 'insider_mfa'
const MFA_MAX_AGE = 60 * 10 // 10 min para digitar o código
const MFA_PURPOSE = 'insider-mfa'

export type InsiderSession = {
  id: number
  nome: string
}

// `mfa: true` marca que o código do autenticador foi conferido. Token sem a
// marca (emitido antes do 2FA existir) não vale mais.
type InsiderTokenPayload = InsiderSession & { exp: number; mfa?: boolean }

export type InsiderMfaPendente = InsiderSession & {
  /** Presente só no primeiro acesso: o segredo que está sendo cadastrado. */
  segredoNovo?: string
}

export function createInsiderSessionToken(insider: InsiderSession): string {
  return createSignedToken(
    TOKEN_PURPOSE,
    { id: insider.id, nome: insider.nome, mfa: true },
    SESSION_MAX_AGE
  )
}

export async function getInsiderSession(): Promise<InsiderSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(INSIDER_SESSION_COOKIE)?.value
  const payload = verifySignedToken<InsiderTokenPayload>(TOKEN_PURPOSE, token)
  if (!payload?.id || !payload.nome || payload.mfa !== true) return null
  return { id: payload.id, nome: payload.nome }
}

export async function setInsiderSessionCookie(insider: InsiderSession): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(INSIDER_SESSION_COOKIE, createInsiderSessionToken(insider), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearInsiderSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(INSIDER_SESSION_COOKIE)
  cookieStore.set(INSIDER_MFA_COOKIE, '', { path: '/api/insider', maxAge: 0 })
}

export async function setInsiderMfaCookie(pendente: InsiderMfaPendente): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(INSIDER_MFA_COOKIE, createSignedToken(MFA_PURPOSE, pendente, MFA_MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/insider',
    maxAge: MFA_MAX_AGE,
  })
}

export async function getInsiderMfaPendente(): Promise<InsiderMfaPendente | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(INSIDER_MFA_COOKIE)?.value
  const payload = verifySignedToken<InsiderMfaPendente & { exp: number }>(MFA_PURPOSE, token)
  if (!payload?.id || !payload.nome) return null
  return {
    id: payload.id,
    nome: payload.nome,
    ...(payload.segredoNovo ? { segredoNovo: payload.segredoNovo } : {}),
  }
}

export async function clearInsiderMfaCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(INSIDER_MFA_COOKIE, '', { path: '/api/insider', maxAge: 0 })
}

export async function requireInsiderAuth(): Promise<
  { ok: true; insider: InsiderSession } | { ok: false; response: NextResponse }
> {
  const insider = await getInsiderSession()
  if (!insider) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autorizado. Faça login no Insider Conect.' }, { status: 401 }),
    }
  }
  return { ok: true, insider }
}
