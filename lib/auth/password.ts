import "server-only"
import { pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto"
import bcrypt from "bcryptjs"

/**
 * Verificação de senha armazenada como hash.
 *
 * O formato é lido do próprio hash, e não configurado em lugar nenhum: as
 * senhas do Insider foram semeadas direto no Postgres e podem ter saído do
 * `crypt()` do pgcrypto (bcrypt, `$2a$`) ou de um script em Node. Aceitar os
 * formatos comuns evita ter que reemitir as 25 credenciais já existentes.
 *
 * Formato desconhecido não vira "senha aceita": vira recusa com log, porque
 * degradar para comparação literal seria trocar hash por senha em texto claro.
 */

const BCRYPT_ROUNDS = 12

function comparaSegura(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function verifyPassword(senha: string, hash: string | null | undefined): Promise<boolean> {
  if (!senha || !hash) return false
  const h = hash.trim()

  // bcrypt — o que o pgcrypto produz com gen_salt('bf')
  if (/^\$2[aby]?\$/.test(h)) {
    try {
      return await bcrypt.compare(senha, h)
    } catch {
      return false
    }
  }

  // scrypt$<salt_base64>$<hash_base64>
  if (h.startsWith("scrypt$")) {
    const [, salt, esperado] = h.split("$")
    if (!salt || !esperado) return false
    try {
      const alvo = Buffer.from(esperado, "base64")
      const calculado = scryptSync(senha, Buffer.from(salt, "base64"), alvo.length)
      return comparaSegura(calculado, alvo)
    } catch {
      return false
    }
  }

  // pbkdf2$<iteracoes>$<salt_base64>$<hash_base64>
  if (h.startsWith("pbkdf2$")) {
    const [, iter, salt, esperado] = h.split("$")
    if (!iter || !salt || !esperado) return false
    try {
      const alvo = Buffer.from(esperado, "base64")
      const calculado = pbkdf2Sync(
        senha,
        Buffer.from(salt, "base64"),
        Number(iter),
        alvo.length,
        "sha256"
      )
      return comparaSegura(calculado, alvo)
    } catch {
      return false
    }
  }

  // sha256 hexadecimal puro (64 chars) — formato fraco, aceito só para não
  // trancar credencial antiga do lado de fora. Trocar por bcrypt no próximo reset.
  if (/^[0-9a-f]{64}$/i.test(h)) {
    const calculado = createHash("sha256").update(senha).digest()
    return comparaSegura(calculado, Buffer.from(h, "hex"))
  }

  console.error("[auth/password] Formato de hash não reconhecido — acesso recusado.")
  return false
}

/** Formato canônico para senhas novas e resets. */
export async function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, BCRYPT_ROUNDS)
}

/** Senha temporária legível para entregar ao insider num reset. */
export function gerarSenhaTemporaria(tamanho = 10): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(tamanho)
  let saida = ""
  for (let i = 0; i < tamanho; i++) saida += alfabeto[bytes[i] % alfabeto.length]
  return saida
}
