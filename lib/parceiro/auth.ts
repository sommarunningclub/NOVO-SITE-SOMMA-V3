import "server-only";
import { cookies } from "next/headers";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Trava do acesso exclusivo do parceiro (/parceiro-somma-club).
 *
 * Mesma mecânica dos decks comerciais (`lib/ppt/auth.ts`): a verificação
 * acontece só no servidor e o painel só é renderizado depois que o cookie
 * assinado está válido. A diferença é a origem do código — aqui ele não vem de
 * variável de ambiente, e sim da tabela `codigo_parceiro`, porque cada parceiro
 * tem o seu e a lista muda sem deploy.
 *
 * Por que a consulta usa a service role: a policy que existia deixava QUALQUER
 * um ler os códigos ativos com a chave anônima, que é pública (vai no HTML).
 * Uma trava cujo segredo o visitante consegue baixar não tranca nada. A leitura
 * passou a ser server-side e a policy anônima foi removida na migration
 * 20260920190000_codigo_parceiro_acesso.sql.
 */

const DIAS = 30;
const MAX_AGE = 60 * 60 * 24 * DIAS;
const PURPOSE = "parceiro:checkin";

export const COOKIE = "parceiro_somma_club";

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/parceiro-somma-club",
  maxAge: MAX_AGE,
};

export interface Parceiro {
  nome: string;
}

/** Normaliza como a tabela guarda: sem espaços nas pontas e em caixa alta. */
export function normalizarCodigo(bruto: unknown): string {
  return String(bruto ?? "").trim().toUpperCase();
}

/**
 * Confere o código contra a tabela e devolve o parceiro dono dele.
 *
 * Código inativo não entra: `ativo` é o botão de desligar o acesso de um
 * parceiro sem precisar apagar a linha (e perder o histórico de `last_access`).
 */
export async function validarCodigo(bruto: unknown): Promise<Parceiro | null> {
  const codigo = normalizarCodigo(bruto);
  if (!codigo) return null;

  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("codigo_parceiro")
    .select("id, nome_parceiro")
    .eq("codigo", codigo)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) return null;

  // Registrar o acesso é o que a coluna `last_access` existe para fazer; se
  // falhar, o parceiro entra do mesmo jeito — é telemetria, não autorização.
  await supabase
    .from("codigo_parceiro")
    .update({ last_access: new Date().toISOString() })
    .eq("id", data.id);

  return { nome: String(data.nome_parceiro ?? "").trim() || "Parceiro Somma" };
}

export function tokenDeAcesso(parceiro: Parceiro): string {
  return createSignedToken(PURPOSE, { nome: parceiro.nome }, MAX_AGE);
}

/** Parceiro da sessão atual, ou null se não houver cookie válido. */
export async function parceiroAtual(): Promise<Parceiro | null> {
  const jar = await cookies();
  const payload = verifySignedToken<{ nome?: string }>(PURPOSE, jar.get(COOKIE)?.value);
  if (!payload?.nome) return null;
  return { nome: payload.nome };
}
