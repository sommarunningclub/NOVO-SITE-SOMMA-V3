import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Segredo de assinatura das sessões (cookies de admin, token de checkout).
 *
 * `AUTH_SECRET` é a única fonte. `INSIDER_SESSION_SECRET` continua aceito
 * porque foi o primeiro nome usado e ainda pode estar configurado em produção —
 * mas AUTH_SECRET vem primeiro, para a migração ser só definir a nova variável.
 *
 * O que sumiu daqui de propósito: o fallback para `SUPABASE_SERVICE_ROLE_KEY`.
 * Reaproveitar a chave de acesso total ao banco como chave de assinatura junta
 * dois segredos de gravidades diferentes: vazar um cookie forjado passaria a
 * ser o mesmo problema que vazar o banco inteiro, e rotacionar um obrigaria a
 * rotacionar o outro.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.INSIDER_SESSION_SECRET
  if (!secret) {
    throw new Error(
      'AUTH_SECRET não configurado. Gere um segredo dedicado (openssl rand -base64 32) ' +
        'e defina AUTH_SECRET no ambiente.'
    )
  }
  return secret
}

/** Existe segredo configurado? Serve para a rota recusar cedo, com 503. */
export function authSecretConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET || process.env.INSIDER_SESSION_SECRET)
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

  let expected: string
  try {
    expected = signPayload(encoded, purpose)
  } catch {
    // Sem AUTH_SECRET não existe token válido: recusa em vez de deixar passar.
    return null
  }

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
