import { createHmac, randomBytes } from 'crypto'
import { safeCompare } from '@/lib/auth/session-token'

// TOTP (RFC 6238) compatível com Google Authenticator: SHA-1, 6 dígitos, 30 s.

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const PERIODO_S = 30
const DIGITOS = 6

export function base32Encode(buf: Buffer): string {
  let bits = 0
  let valor = 0
  let saida = ''
  for (const byte of buf) {
    valor = (valor << 8) | byte
    bits += 8
    while (bits >= 5) {
      saida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) saida += ALFABETO_BASE32[(valor << (5 - bits)) & 31]
  return saida
}

export function base32Decode(texto: string): Buffer {
  const limpo = texto.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let valor = 0
  const bytes: number[] = []
  for (const ch of limpo) {
    valor = (valor << 5) | ALFABETO_BASE32.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** Segredo novo de 160 bits, em base32 (o formato que o app autenticador lê). */
export function gerarSegredoTotp(): string {
  return base32Encode(randomBytes(20))
}

function hotp(chave: Buffer, contador: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(contador))
  const h = createHmac('sha1', chave).update(msg).digest()
  const off = h[h.length - 1] & 0xf
  const bin =
    ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(bin % 10 ** DIGITOS).padStart(DIGITOS, '0')
}

export function passoTotp(agoraMs = Date.now()): number {
  return Math.floor(agoraMs / 1000 / PERIODO_S)
}

/** Código do passo atual (usado só em teste). */
export function gerarCodigoTotp(segredo: string, agoraMs = Date.now()): string {
  return hotp(base32Decode(segredo), passoTotp(agoraMs))
}

/**
 * Confere o código aceitando um passo de folga para cada lado (relógio do
 * celular adiantado ou atrasado até 30 s). Devolve o passo que bateu, para o
 * chamador barrar reuso do mesmo código, ou null.
 */
export function verificarTotp(
  segredo: string,
  codigo: string,
  agoraMs = Date.now(),
  janela = 1
): number | null {
  const digitos = String(codigo || '').replace(/\D/g, '')
  if (digitos.length !== DIGITOS) return null
  const chave = base32Decode(segredo)
  const atual = passoTotp(agoraMs)
  for (let d = -janela; d <= janela; d++) {
    if (safeCompare(hotp(chave, atual + d), digitos)) return atual + d
  }
  return null
}

export function otpauthUrl(segredo: string, conta: string, emissor = 'SOMMA Insider'): string {
  const rotulo = encodeURIComponent(`${emissor}:${conta.replace(/:/g, ' ')}`)
  // encodeURIComponent (espaço vira %20): alguns apps leem o "+" ao pé da letra.
  const params = [
    `secret=${segredo}`,
    `issuer=${encodeURIComponent(emissor)}`,
    'algorithm=SHA1',
    `digits=${DIGITOS}`,
    `period=${PERIODO_S}`,
  ].join('&')
  return `otpauth://totp/${rotulo}?${params}`
}
