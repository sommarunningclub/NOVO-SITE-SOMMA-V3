import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { CAPACIDADE_INTERNA, EVENTO_SLUG, type Pelotao } from "./event.config";
import { gerarTicketCode, gerarTicketToken } from "./ticket";
import type { Inscricao } from "./schema";

/**
 * Acesso à participação no evento.
 *
 * Regra do módulo: a PESSOA vive em `cadastro_site` (CPF é a identidade) e a
 * PARTICIPAÇÃO vive em `evento_participantes` (uma linha por evento+pessoa).
 * Este arquivo nunca escreve direto nas duas — quem faz isso é a função
 * `public.inscrever_no_evento`, que resolve as duas na MESMA transação.
 * Ver `supabase/migrations/20260912140000_somma_day_participacoes.sql`.
 */
export const TABELA = "evento_participantes";

export type StatusParticipacao =
  | "inscrito"
  | "confirmado"
  | "presente"
  | "cancelado"
  | "no_show";

export interface Participante {
  id: string;
  evento_id: string;
  pessoa_id: number;
  cpf: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  status: StatusParticipacao;
  ticket_code: string;
  ticket_token: string;
  pelotao: Pelotao | null;
  categoria: string | null;
  pulseira_codigo: string | null;
  checkin_em: string | null;
  origem: string;
  parceiro_slug: string | null;
  criado_em: string;
}

export interface EventoRow {
  id: string;
  titulo: string;
  slug: string | null;
  data_evento: string | null;
  horario_inicio: string | null;
  local: string | null;
  local_url: string | null;
  checkin_status: string | null;
  evento_encerrado: boolean | null;
  pelotoes: string[] | null;
}

/**
 * O evento vem do banco, não de constante: quem abre e fecha a inscrição é a
 * gestão, e o site tem que obedecer sem deploy. `null` quando a linha ainda
 * não existe — a LP trata isso como "em breve".
 */
export async function getEvento(): Promise<EventoRow | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("eventos")
    .select(
      "id, titulo, slug, data_evento, horario_inicio, local, local_url, checkin_status, evento_encerrado, pelotoes"
    )
    .eq("slug", EVENTO_SLUG)
    .maybeSingle();
  if (error) {
    console.error("[somma-day] Erro ao carregar evento:", error.message);
    return null;
  }
  return (data as EventoRow) ?? null;
}

/* ─── Identificação pelo CPF ──────────────────────────────────────────────── */

export interface Pessoa {
  id: number;
  nome_completo: string;
  email: string | null;
  whatsapp: string | null;
  data_nascimento: string | null;
}

export interface Identificacao {
  /** O CPF já está na base do Somma? */
  existe: boolean;
  /** Só o primeiro nome: o suficiente para a tela cumprimentar sem expor a pessoa. */
  primeiroNome: string | null;
  /** Campos do cadastro que faltam preencher. Vazio = não perguntamos nada. */
  faltando: string[];
  /** Preenchido quando já existe inscrição nesta edição. */
  jaInscrito: { ticket: string; pelotao: string | null; token: string } | null;
}

const VAZIO = (v: string | null | undefined) => !v || v.trim() === "";

/**
 * Resolve o CPF contra a base principal e contra a lista do evento.
 *
 * Esta função é, por natureza, um oráculo de "este CPF está no Somma?" — a
 * rota que a expõe precisa de cota por IP e tempo de resposta constante, como
 * já faz `/api/verify-cpf`.
 */
export async function identificarPorCpf(
  cpf: string,
  eventoId: string | null
): Promise<Identificacao> {
  const nada: Identificacao = { existe: false, primeiroNome: null, faltando: [], jaInscrito: null };
  const supabase = getServiceSupabase();
  if (!supabase) return nada;

  const { data: pessoa, error } = await supabase
    .from("cadastro_site")
    .select("id, nome_completo, email, whatsapp, data_nascimento")
    .eq("cpf_digits", cpf)
    .maybeSingle();

  if (error) {
    console.error("[somma-day] Erro ao identificar CPF:", error.message);
    return nada;
  }
  if (!pessoa) return nada;

  const p = pessoa as Pessoa;
  const faltando: string[] = [];
  if (VAZIO(p.nome_completo)) faltando.push("nome");
  if (VAZIO(p.email)) faltando.push("email");
  if (VAZIO(p.whatsapp)) faltando.push("telefone");
  if (VAZIO(p.data_nascimento)) faltando.push("nascimento");

  let jaInscrito: Identificacao["jaInscrito"] = null;
  if (eventoId) {
    const { data: inscricao } = await supabase
      .from(TABELA)
      .select("ticket_code, ticket_token, pelotao")
      .eq("evento_id", eventoId)
      .eq("cpf", cpf)
      .neq("status", "cancelado")
      .maybeSingle();
    if (inscricao) {
      jaInscrito = {
        ticket: inscricao.ticket_code as string,
        pelotao: (inscricao.pelotao as string) ?? null,
        token: inscricao.ticket_token as string,
      };
    }
  }

  return {
    existe: true,
    primeiroNome: p.nome_completo?.trim().split(/\s+/)[0] ?? null,
    faltando,
    jaInscrito,
  };
}

/** Dados do cadastro para completar o que o formulário não perguntou. */
export async function getPessoaPorCpf(cpf: string): Promise<Pessoa | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("cadastro_site")
    .select("id, nome_completo, email, whatsapp, data_nascimento")
    .eq("cpf_digits", cpf)
    .maybeSingle();
  return (data as Pessoa) ?? null;
}

export type ResultadoInscricao =
  | { ok: true; participante: Participante; jaEstava: boolean }
  | { ok: false; motivo: "sem_banco" | "sem_evento" | "lotado" | "erro"; detalhe?: string };

/**
 * Inscreve em uma chamada só. Idempotente por CPF + evento: reenviar o
 * formulário devolve a MESMA credencial em vez de criar uma segunda inscrição
 * (é o que acontece hoje em `checkins`, onde 4.112 pessoas viraram 8.771 linhas).
 */
export async function inscrever(
  dados: Inscricao,
  evento: EventoRow
): Promise<ResultadoInscricao> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, motivo: "sem_banco" };

  // Gerado aqui (crypto do Node, não do Postgres) e comparado com o que volta:
  // se a função devolveu outro código, é porque a inscrição já existia.
  const ticketNovo = gerarTicketCode();

  const { data, error } = await supabase.rpc("inscrever_no_evento", {
    p_evento_id: evento.id,
    p_cpf: dados.cpf,
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone,
    p_ticket_code: ticketNovo,
    p_ticket_token: gerarTicketToken(),
    p_sexo: null,
    p_nascimento: dados.nascimento,
    p_pelotao: dados.pelotao,
    p_categoria: null,
    p_origem: dados.parceiro ? "parceiro" : "site",
    p_parceiro_slug: dados.parceiro ?? null,
    p_lote: null,
    p_utm: dados.utm ?? {},
    p_metadata: {},
    // O teto é aplicado no banco, sob advisory lock: contar aqui e inserir
    // depois deixaria duas inscrições simultâneas furarem o limite juntas.
    p_capacidade: CAPACIDADE_INTERNA,
  });

  if (error) {
    if (error.message?.includes("EVENTO_LOTADO")) return { ok: false, motivo: "lotado" };
    console.error("[somma-day] Erro ao inscrever:", error.message, error.details);
    return { ok: false, motivo: "erro", detalhe: error.message };
  }

  const participante = (Array.isArray(data) ? data[0] : data) as Participante | null;
  if (!participante) return { ok: false, motivo: "erro" };

  return { ok: true, participante, jaEstava: participante.ticket_code !== ticketNovo };
}

export async function getParticipantePorToken(token: string): Promise<Participante | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .eq("ticket_token", token)
    .maybeSingle();
  if (error) {
    console.error("[somma-day] Erro ao buscar credencial:", error.message);
    return null;
  }
  return (data as Participante) ?? null;
}

export interface Stats {
  inscritos: number;
  presentes: number;
  porPelotao: Record<string, number>;
}

/** Números para a LP e para o admin. Sem dado pessoal — só contagem. */
export async function getStats(eventoId: string): Promise<Stats> {
  const vazio: Stats = { inscritos: 0, presentes: 0, porPelotao: {} };
  const supabase = getServiceSupabase();
  if (!supabase) return vazio;

  const { data, error } = await supabase
    .from(TABELA)
    .select("status, pelotao")
    .eq("evento_id", eventoId)
    .neq("status", "cancelado");

  if (error) {
    console.error("[somma-day] Erro ao contar inscritos:", error.message);
    return vazio;
  }

  const linhas = (data ?? []) as { status: StatusParticipacao; pelotao: string | null }[];
  const porPelotao: Record<string, number> = {};
  for (const l of linhas) {
    if (l.pelotao) porPelotao[l.pelotao] = (porPelotao[l.pelotao] ?? 0) + 1;
  }
  return {
    inscritos: linhas.length,
    presentes: linhas.filter((l) => l.status === "presente").length,
    porPelotao,
  };
}
