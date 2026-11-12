import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, randomInt } from "node:crypto";
import { getAuthSecret } from "@/lib/auth/session-token";
import { PREFIXO_CODIGO } from "./config";

/**
 * Proteção do CPF e geração dos identificadores do ingresso.
 *
 * O CPF nunca é gravado em claro. Vai para o banco em duas formas:
 *   - cifrado (AES-256-GCM), para o admin conseguir ler quando precisa;
 *   - HMAC-SHA256, que é o que impede a segunda inscrição do mesmo CPF e
 *     permite a busca por CPF no credenciamento sem decifrar ninguém.
 *
 * As duas chaves saem de um segredo só (HKDF), `EVP_DADOS_SECRET`. Sem ele, o
 * sistema usa o segredo de sessão do site (AUTH_SECRET), que já existe em
 * produção. ATENÇÃO: depois da primeira inscrição, esse segredo não pode
 * mudar. Trocar deixa os CPFs gravados ilegíveis e desliga a deduplicação.
 */

function segredoBase(): string {
  return process.env.EVP_DADOS_SECRET || getAuthSecret();
}

let cache: { base: string; cifra: Buffer; hmac: Buffer } | null = null;

function chaves() {
  const base = segredoBase();
  if (cache?.base === base) return cache;
  const derivar = (info: string) => Buffer.from(hkdfSync("sha256", base, "somma-evp-v1", info, 32));
  cache = { base, cifra: derivar("cpf-cifra"), hmac: derivar("cpf-hmac") };
  return cache;
}

/** v1.<iv>.<tag>.<dados>, tudo em base64url. */
export function cifrarCpf(cpf: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chaves().cifra, iv);
  const dados = Buffer.concat([c.update(cpf, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), dados.toString("base64url")].join(".");
}

export function decifrarCpf(cifrado: string): string | null {
  try {
    const [versao, iv, tag, dados] = cifrado.split(".");
    if (versao !== "v1" || !iv || !tag || !dados) return null;
    const d = createDecipheriv("aes-256-gcm", chaves().cifra, Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(dados, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** O evento entra na conta: o mesmo CPF em outro evento gera outro valor. */
export function hmacCpf(slug: string, cpf: string): string {
  return createHmac("sha256", chaves().hmac).update(`${slug}:${cpf}`).digest("base64url");
}

/** Identificador aleatório de 192 bits. Serve de token do ingresso e do QR. */
export function novoToken(): string {
  return randomBytes(24).toString("base64url");
}

// Sem 0/O, 1/I/L: a equipe lê e digita o código no dia.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function novoCodigo(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return `${PREFIXO_CODIGO}-${s}`;
}
