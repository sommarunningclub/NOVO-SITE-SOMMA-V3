import 'server-only'
import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { getAuthSecret } from '@/lib/auth/session-token'

// Código de acesso por e-mail do Insider Connect: alternativa ao Google
// Authenticator. Só o HMAC do código vai para o banco.

export const CODIGO_EMAIL_VALIDADE_MIN = 10
export const CODIGO_EMAIL_MAX_TENTATIVAS = 5
/** Espera mínima entre dois envios para o mesmo insider. */
export const CODIGO_EMAIL_INTERVALO_S = 60
/** Máximo de envios por hora para o mesmo insider. */
export const CODIGO_EMAIL_MAX_ENVIOS_HORA = 5

export function gerarCodigoEmail(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashCodigoEmail(insiderId: string | number, codigo: string): string {
  return createHmac('sha256', getAuthSecret())
    .update(`insider-codigo-email:${insiderId}:${codigo}`)
    .digest('hex')
}

export function codigoEmailConfere(insiderId: string | number, codigo: string, hashSalvo: string): boolean {
  const a = Buffer.from(hashCodigoEmail(insiderId, codigo))
  const b = Buffer.from(String(hashSalvo || ''))
  return a.length === b.length && timingSafeEqual(a, b)
}

/** "miguel.souza@gmail.com" → "mi•••••••••@gmail.com" */
export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.trim().split('@')
  if (!usuario || !dominio) return 'seu e-mail cadastrado'
  const visivel = usuario.length <= 2 ? usuario.slice(0, 1) : usuario.slice(0, 2)
  return `${visivel}${'•'.repeat(Math.max(3, usuario.length - visivel.length))}@${dominio}`
}

export function emailValido(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
