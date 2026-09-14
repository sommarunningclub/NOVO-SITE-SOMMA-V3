import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nomeCasaCom } from "./nome";
import { SLUG_RE, situacaoDaRodada, type BuscaCampanha, type Campanha } from "./rodada";

export type { BuscaCampanha, Campanha } from "./rodada";

/**
 * Acesso ao banco do NPS da Assessoria.
 *
 * As tabelas têm RLS ligado e nenhuma policy: anon e authenticated não leem
 * nem escrevem nada. Todo acesso passa por aqui, server-side, com a service
 * role. Schema em `supabase/migrations/20260914120000_assessoria_nps.sql` e
 * `20260914170000_assessoria_nps_rodadas.sql`.
 *
 * Nada neste arquivo registra nome ou resposta em log: só código de erro.
 */

export const TB = {
  campaigns: "nps_assessoria_campaigns",
  invites: "nps_assessoria_invites",
  responses: "nps_assessoria_responses",
} as const;

/** Cookie httpOnly com o token do link pessoal. O JavaScript da página nunca vê o token. */
export const CONVITE_COOKIE = "somma_nps_convite";
export const CONVITE_MAX_AGE = 60 * 60 * 24 * 60;
export const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/;

const COLUNAS_RODADA = "id, slug, title, survey_version, reference_period, status, opens_at, closes_at";

function logErro(contexto: string, err: { code?: string; message?: string } | null | undefined): void {
  console.error(`[assessoria-nps] ${contexto}:`, err?.code ?? "", err?.message ?? "");
}

// ─── Rodada ─────────────────────────────────────────────────────────────────
/** A rodada do link /assessoria/nps/<slug>. */
export async function buscarCampanhaPorSlug(
  sb: SupabaseClient,
  slug: string | null | undefined,
  agora = new Date()
): Promise<BuscaCampanha> {
  if (!slug || slug.length > 80 || !SLUG_RE.test(slug)) return { status: "nao_encontrada" };

  const { data, error } = await sb.from(TB.campaigns).select(COLUNAS_RODADA).eq("slug", slug).maybeSingle();
  if (error) {
    logErro("buscarCampanhaPorSlug", error);
    return { status: "indisponivel" };
  }
  if (!data) return { status: "nao_encontrada" };
  return situacaoDaRodada(data as Campanha, agora);
}

/**
 * O link sem código (/assessoria/nps): a rodada publicada cuja janela contém
 * agora. O banco impede janelas publicadas sobrepostas, então há no máximo uma.
 * Sem nenhuma no ar, mostra a próxima agendada; sem próxima, encerrada.
 */
export async function buscarCampanhaAtual(sb: SupabaseClient, agora = new Date()): Promise<BuscaCampanha> {
  const iso = agora.toISOString();

  const noAr = await sb
    .from(TB.campaigns)
    .select(COLUNAS_RODADA)
    .eq("status", "active")
    .lte("opens_at", iso)
    .or(`closes_at.is.null,closes_at.gt."${iso}"`)
    .order("opens_at", { ascending: false })
    .limit(1);
  if (noAr.error) {
    logErro("buscarCampanhaAtual", noAr.error);
    return { status: "indisponivel" };
  }
  if (noAr.data?.length) return { status: "ok", campanha: noAr.data[0] as Campanha };

  const proxima = await sb
    .from(TB.campaigns)
    .select(COLUNAS_RODADA)
    .eq("status", "active")
    .gt("opens_at", iso)
    .order("opens_at", { ascending: true })
    .limit(1);
  if (proxima.error) {
    logErro("buscarCampanhaAtual (próxima)", proxima.error);
    return { status: "indisponivel" };
  }
  if (proxima.data?.length) return { status: "agendada", campanha: proxima.data[0] as Campanha };

  return { status: "encerrada", campanha: null };
}

export async function buscarRodadaPorId(sb: SupabaseClient, id: string): Promise<Campanha | null> {
  const { data, error } = await sb.from(TB.campaigns).select(COLUNAS_RODADA).eq("id", id).maybeSingle();
  if (error) {
    logErro("buscarRodadaPorId", error);
    return null;
  }
  return (data as Campanha | null) ?? null;
}

// ─── Convite ────────────────────────────────────────────────────────────────
export interface Convite {
  id: string;
  campaign_id: string;
  student_asaas_id: string;
  first_name: string;
  last_name: string;
  professor_id: string | null;
  professor_name: string | null;
  opened_at: string | null;
}

/** Convite pelo token. Quem chama confere se é da rodada em jogo. */
export async function buscarConvite(sb: SupabaseClient, token: string | undefined | null): Promise<Convite | null> {
  if (!token || !TOKEN_RE.test(token)) return null;
  const { data, error } = await sb
    .from(TB.invites)
    .select("id, campaign_id, student_asaas_id, first_name, last_name, professor_id, professor_name, opened_at")
    .eq("token", token)
    .maybeSingle();
  if (error) {
    logErro("buscarConvite", error);
    return null;
  }
  return (data as Convite | null) ?? null;
}

export async function conviteRespondido(sb: SupabaseClient, conviteId: string): Promise<boolean> {
  const { count, error } = await sb
    .from(TB.responses)
    .select("id", { count: "exact", head: true })
    .eq("invite_id", conviteId);
  if (error) {
    logErro("conviteRespondido", error);
    return false;
  }
  return (count ?? 0) > 0;
}

/** Primeira abertura do link. Serve para medir quem recebeu e não abriu. */
export async function registrarAberturaDoConvite(sb: SupabaseClient, convite: Convite): Promise<void> {
  if (convite.opened_at) return;
  const { error } = await sb
    .from(TB.invites)
    .update({ opened_at: new Date().toISOString() })
    .eq("id", convite.id)
    .is("opened_at", null);
  if (error) logErro("registrarAberturaDoConvite", error);
}

// ─── Aluno pelo nome ────────────────────────────────────────────────────────
export interface AlunoIdentificado {
  student_asaas_id: string;
  professor_id: string | null;
  professor_name: string | null;
}

interface LinhaAluno {
  asaas_customer_id: string | null;
  customer_name: string | null;
  status: string | null;
  professor_id: string | null;
  linked_at: string | null;
  professors: { name: string | null } | { name: string | null }[] | null;
}

function nomeDoProfessor(l: LinhaAluno): string | null {
  const p = Array.isArray(l.professors) ? l.professors[0] : l.professors;
  return p?.name?.trim() || null;
}

/**
 * Link genérico: o nome digitado aponta para UM aluno da gestão?
 *
 * Só vincula quando a resposta é inequívoca. Dois alunos que casam com o nome
 * (homônimos, ou "Ana Silva" quando há duas Anas Silva) = nenhum vínculo. Errar
 * o vínculo é pior que não ter: contaminaria o NPS por professor.
 */
export async function identificarAlunoPorNome(
  sb: SupabaseClient,
  nomeCompleto: string
): Promise<AlunoIdentificado | null> {
  const { data, error } = await sb
    .from("professor_clients")
    .select("asaas_customer_id, customer_name, status, professor_id, linked_at, professors(name)")
    .not("asaas_customer_id", "is", null)
    .limit(5000);

  if (error || !data) {
    if (error) logErro("identificarAlunoPorNome", error);
    return null;
  }

  const candidatos = (data as unknown as LinhaAluno[]).filter(
    (l) => l.asaas_customer_id && l.customer_name && nomeCasaCom(nomeCompleto, l.customer_name)
  );
  if (new Set(candidatos.map((c) => c.asaas_customer_id)).size !== 1) return null;

  // O mesmo aluno pode ter mais de uma linha (trocou de professor): vale o
  // vínculo ativo mais recente.
  const peso = (l: LinhaAluno) => (l.status === "active" ? 1e15 : 0) + (l.linked_at ? Date.parse(l.linked_at) || 0 : 0);
  const melhor = [...candidatos].sort((a, b) => peso(b) - peso(a))[0];

  return {
    student_asaas_id: melhor.asaas_customer_id as string,
    professor_id: melhor.professor_id,
    professor_name: nomeDoProfessor(melhor),
  };
}

// ─── Resposta ───────────────────────────────────────────────────────────────
export type ResultadoInsercao =
  | { status: "criada" }
  | { status: "repetida" }
  | { status: "convite_ja_usado" }
  | { status: "erro" };

/**
 * Grava a resposta. Os dois índices únicos fazem o trabalho pesado:
 * - `envio_unico` (campanha + id do envio): o mesmo envio chegando de novo
 *   (refresh, clique duplo, retry de rede) é sucesso, não duplicata;
 * - `convite_unico`: o link pessoal já respondeu por outro envio.
 */
export async function inserirResposta(sb: SupabaseClient, linha: Record<string, unknown>): Promise<ResultadoInsercao> {
  const { error } = await sb.from(TB.responses).insert(linha);
  if (!error) return { status: "criada" };

  if (error.code === "23505") {
    const texto = `${error.message ?? ""} ${error.details ?? ""}`;
    if (texto.includes("nps_assessoria_responses_envio_unico")) return { status: "repetida" };
    if (texto.includes("nps_assessoria_responses_convite_unico")) return { status: "convite_ja_usado" };
  }
  logErro("inserirResposta", error);
  return { status: "erro" };
}
