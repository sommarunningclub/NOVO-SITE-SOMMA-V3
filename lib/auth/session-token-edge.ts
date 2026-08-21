/**
 * Verificação do token de sessão no Edge (middleware).
 *
 * Mesma assinatura de `lib/auth/session-token.ts` — HMAC-SHA256 sobre
 * `${purpose}:${payloadBase64Url}` — só que com Web Crypto em vez de
 * `node:crypto`, que não existe no runtime do middleware.
 *
 * Os dois arquivos precisam concordar byte a byte. Se um dia o formato do token
 * mudar num, muda no outro: o sintoma de esquecer é o middleware devolver todo
 * mundo para a tela de login mesmo com sessão boa.
 */

const encoder = new TextEncoder();

function base64UrlToBytes(valor: string): Uint8Array {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const preenchido = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob(preenchido);
  const bytes = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bruto = "";
  for (const b of bytes) bruto += String.fromCharCode(b);
  return btoa(bruto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function segredo(): string | null {
  return process.env.AUTH_SECRET || process.env.INSIDER_SESSION_SECRET || null;
}

export async function verifySignedTokenEdge<T extends Record<string, unknown>>(
  purpose: string,
  token: string | undefined | null
): Promise<T | null> {
  if (!token) return null;

  const secret = segredo();
  if (!secret) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let esperada: string;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const assinatura = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${purpose}:${encoded}`)
    );
    esperada = bytesToBase64Url(new Uint8Array(assinatura));
  } catch {
    return null;
  }

  // Comparação de tempo constante: sem timingSafeEqual no Edge, é feita à mão.
  if (esperada.length !== signature.length) return null;
  let diferenca = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferenca |= esperada.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diferenca !== 0) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encoded))
    ) as T & { exp?: number };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
