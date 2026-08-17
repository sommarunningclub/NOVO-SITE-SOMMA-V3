import "server-only";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { SITE_URL } from "@/lib/desafio-esteiras/event.config";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Descadastro do envio transacional.
 *
 * Broadcast do Resend dá URL de descadastro nativa de graça. Envio transacional
 * não dá nada: sem isto, a régua mandaria e-mail de marketing sem NENHUM jeito de
 * sair, o que viola a exigência de one-click unsubscribe do Gmail/Yahoo para
 * remetente em volume (regra de 2024) e é o tipo de coisa que derruba entregabilidade
 * do domínio inteiro, não só desta campanha.
 *
 * O token não expira em prazo curto: é o link que fica gravado num e-mail que a
 * pessoa pode abrir daqui a um ano. Ele carrega só o e-mail, não a campanha,
 * porque descadastro vale para a base inteira, não para uma campanha isolada.
 * Pedir para sair de "e-mails da Evolve" e continuar recebendo "e-mails do
 * Desafio das Esteiras" no mês seguinte seria surpresa ruim.
 */

const PROPOSITO = "campanha-descadastro";
const VALIDADE_SEGUNDOS = 60 * 60 * 24 * 365 * 5; // 5 anos: o link não deve expirar no meio da campanha

export function linkDescadastro(email: string): string {
  const token = createSignedToken(PROPOSITO, { email: email.toLowerCase() }, VALIDADE_SEGUNDOS);
  return `${SITE_URL}/api/campanhas/descadastrar?token=${encodeURIComponent(token)}`;
}

export interface ResultadoDescadastro {
  ok: boolean;
  email?: string;
  erro?: string;
}

/** Marca `descadastrado_em` em toda linha da pessoa, em qualquer campanha. */
export async function processarDescadastro(token: string | null): Promise<ResultadoDescadastro> {
  const payload = verifySignedToken<{ email?: string }>(PROPOSITO, token);
  const email = payload?.email;
  if (!email) return { ok: false, erro: "Link inválido ou expirado." };

  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, erro: "Indisponível no momento." };

  const { error } = await supabase
    .from("campanha_contatos")
    .update({ descadastrado_em: new Date().toISOString() })
    .eq("email", email)
    .is("descadastrado_em", null);

  if (error) return { ok: false, erro: "Falha ao registrar." };
  return { ok: true, email };
}
