import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSignedToken, verifySignedToken } from '@/lib/auth/session-token'

export const INSIDER_SESSION_COOKIE = 'insider_session'
const SESSION_MAX_AGE = 60 * 60 * 12 // 12h
const TOKEN_PURPOSE = 'insider'

export type InsiderSession = {
  id: number
  nome: string
}

type InsiderTokenPayload = InsiderSession & { exp: number }

export function createInsiderSessionToken(insider: InsiderSession): string {
  return createSignedToken(TOKEN_PURPOSE, insider, SESSION_MAX_AGE)
}

export async function getInsiderSession(): Promise<InsiderSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(INSIDER_SESSION_COOKIE)?.value
  const payload = verifySignedToken<InsiderTokenPayload>(TOKEN_PURPOSE, token)
  if (!payload?.id || !payload.nome) return null
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
