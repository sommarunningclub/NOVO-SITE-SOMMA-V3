import { cookies } from 'next/headers'
import { createSignedToken, verifySignedToken } from '@/lib/auth/session-token'

export const WINGS_ADMIN_COOKIE = 'wings_admin_session'
const TOKEN_PURPOSE = 'wings_admin'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24h

type WingsAdminToken = { role: 'staff'; exp: number }

export function createWingsAdminSessionToken(): string {
  return createSignedToken(TOKEN_PURPOSE, { role: 'staff' }, SESSION_MAX_AGE)
}

export async function isStaffAuthorized(): Promise<boolean> {
  if (!process.env.WINGS_ADMIN_KEY) return false
  const cookieStore = await cookies()
  const token = cookieStore.get(WINGS_ADMIN_COOKIE)?.value
  const payload = verifySignedToken<WingsAdminToken>(TOKEN_PURPOSE, token)
  return payload?.role === 'staff'
}

export async function setWingsAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(WINGS_ADMIN_COOKIE, createWingsAdminSessionToken(), {
    httpOnly: true,
    // `strict`: painel de cronometragem, sem entrada por link externo.
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearWingsAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(WINGS_ADMIN_COOKIE)
}
