import { createHmac, timingSafeEqual } from 'crypto'

export function getAuthSecret(): string {
  const secret =
    process.env.INSIDER_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('Configure INSIDER_SESSION_SECRET, AUTH_SECRET ou SUPABASE_SERVICE_ROLE_KEY')
  }
  return secret
}

function signPayload(encoded: string, purpose: string): string {
  return createHmac('sha256', getAuthSecret()).update(`${purpose}:${encoded}`).digest('base64url')
}

export function createSignedToken(
  purpose: string,
  payload: Record<string, unknown>,
  maxAgeSeconds: number
): string {
  const body = { ...payload, exp: Date.now() + maxAgeSeconds * 1000 }
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url')
  return `${encoded}.${signPayload(encoded, purpose)}`
}

export function verifySignedToken<T extends Record<string, unknown>>(
  purpose: string,
  token: string | undefined | null
): T | null {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = signPayload(encoded, purpose)
  try {
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as T & { exp?: number }
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) return false
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}
