import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

/**
 * Senha das contas da equipe: scrypt do próprio Node, sem dependência nova.
 * Formato guardado: scrypt$N$r$p$<sal>$<hash>, em base64url.
 */

const N = 16384;
const R = 8;
const P = 1;
const TAMANHO = 32;

function derivar(senha: string, sal: Buffer, n: number, r: number, p: number, tamanho: number): Promise<Buffer> {
  return new Promise((ok, falha) =>
    scryptCb(senha.normalize("NFKC"), sal, tamanho, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (erro, chave) =>
      erro ? falha(erro) : ok(chave)
    )
  );
}

export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = await derivar(senha, sal, N, R, P, TAMANHO);
  return ["scrypt", N, R, P, sal.toString("base64url"), chave.toString("base64url")].join("$");
}

/**
 * Sem hash (conta inexistente), faz a mesma conta contra um sal fixo e devolve
 * false: a resposta leva o mesmo tempo, e ninguém descobre e-mail pelo relógio.
 */
export async function conferirSenha(senha: string, hash: string | null | undefined): Promise<boolean> {
  try {
    const partes = (hash ?? "").split("$");
    if (partes.length !== 6 || partes[0] !== "scrypt") {
      await derivar(senha, Buffer.alloc(16, 7), N, R, P, TAMANHO);
      return false;
    }
    const [, n, r, p, sal, esperado] = partes;
    const alvo = Buffer.from(esperado, "base64url");
    const chave = await derivar(senha, Buffer.from(sal, "base64url"), Number(n), Number(r), Number(p), alvo.length);
    return chave.length === alvo.length && timingSafeEqual(chave, alvo);
  } catch {
    return false;
  }
}
