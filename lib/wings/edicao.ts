import "server-only"
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token"

/**
 * Token de edição da equipe do Wings.
 *
 * O cadastro é público e sem conta: quem monta a equipe não tem senha nem
 * e-mail cadastrado. Sem nada amarrando a edição, a rota de PATCH aceitava o
 * `id` de qualquer equipe — bastava buscar pelo nome para reescrever a lista de
 * atletas de um concorrente.
 *
 * O token nasce junto com a equipe e é devolvido uma única vez, para o
 * navegador guardar. Quem tem o token editou porque criou; quem não tem passa
 * pelo staff (`WINGS_ADMIN_KEY`), que é o caminho para equipes cadastradas
 * antes desta trava existir.
 */

const PURPOSE = "wings-equipe-edicao"
/** 60 dias: cobre a temporada inteira da competição. */
const TTL = 60 * 60 * 24 * 60

export function criarTokenEdicao(atleticaId: string): string {
  return createSignedToken(PURPOSE, { atleticaId }, TTL)
}

export function lerTokenEdicao(token: string | null | undefined): string | null {
  const payload = verifySignedToken<{ atleticaId?: string }>(PURPOSE, token)
  return payload?.atleticaId ?? null
}
