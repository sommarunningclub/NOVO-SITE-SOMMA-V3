import "server-only";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { SITE_URL } from "@/lib/desafio-esteiras/event.config";
import { getServiceSupabase } from "@/lib/supabase";
import { paginar } from "@/lib/campanhas/envio";

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

/**
 * Grava em `descadastros_globais`, uma tabela por e-mail, não por linha de
 * campanha. É o que faz "descadastrar" valer para qualquer campanha futura:
 * uma linha nova em `campanha_contatos` (de uma campanha que ainda não existia
 * quando a pessoa saiu) nasce sem saber que aquele e-mail já pediu pra sair, e
 * é a tabela global, consultada à parte, que fecha esse furo.
 *
 * Também carimba as linhas de `campanha_contatos` que já existem, só para o
 * painel mostrar a data certa; quem decide se manda e-mail ou não é sempre a
 * tabela global.
 */
export async function processarDescadastro(token: string | null): Promise<ResultadoDescadastro> {
  const payload = verifySignedToken<{ email?: string }>(PROPOSITO, token);
  const email = payload?.email;
  if (!email) return { ok: false, erro: "Link inválido ou expirado." };

  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, erro: "Indisponível no momento." };

  const agora = new Date().toISOString();

  const { error } = await supabase
    .from("descadastros_globais")
    .upsert({ email, descadastrado_em: agora }, { onConflict: "email", ignoreDuplicates: true });
  if (error) return { ok: false, erro: "Falha ao registrar." };

  await supabase
    .from("campanha_contatos")
    .update({ descadastrado_em: agora })
    .eq("email", email)
    .is("descadastrado_em", null);

  return { ok: true, email };
}

/**
 * Todo mundo que já pediu para sair, de qualquer campanha. É contra isto, não
 * contra a coluna por linha de `campanha_contatos`, que toda régua precisa
 * filtrar a base — é o que faz "descadastrar" valer antes mesmo de uma campanha
 * nova existir.
 */
export async function descadastradosGlobalmente(): Promise<Set<string>> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const linhas = await paginar<{ email: string }>((de, ate) =>
    supabase.from("descadastros_globais").select("email").range(de, ate)
  );
  return new Set(linhas.map((r) => r.email.toLowerCase()));
}
