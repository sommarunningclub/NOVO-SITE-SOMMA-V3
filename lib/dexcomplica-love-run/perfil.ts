import "server-only";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";

const PURPOSE = "love-run-perfil";
/** 20 min: tempo de sobra para preencher o formulário de transferência. */
const TTL = 60 * 20;

/**
 * Token curto que autoriza ver e transferir UMA inscrição.
 *
 * Emitido só depois de conferir CPF + e-mail. A rota de transferência nunca
 * aceita CPF avulso, e o acesso expira sozinho.
 */
export function criarTokenPerfil(id: string): string {
  return createSignedToken(PURPOSE, { id }, TTL);
}

export function lerTokenPerfil(token: string | null | undefined): string | null {
  const payload = verifySignedToken<{ id: string }>(PURPOSE, token);
  return typeof payload?.id === "string" && payload.id ? payload.id : null;
}
