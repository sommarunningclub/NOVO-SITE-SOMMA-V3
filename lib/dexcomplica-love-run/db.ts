import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { EVENTO_SLUG } from "./event.config";
import type { EventoOperacional } from "./estado";
import type { Inscricao } from "./schema";
import { gerarTicketCode, gerarTicketToken } from "./ticket";

/**
 * Persistência do Love Run, toda em estruturas que já existem no Somma:
 *
 * - `public.eventos` (slug `dexcomplica-love-run`): o evento. A gestão abre,
 *   fecha, define pelotões e vagas; o /check-in lista e manda para a LP.
 * - `public.inscrever_no_evento(...)`: cria/acha a pessoa em `cadastro_site`
 *   pelo CPF e grava a inscrição em `evento_participantes` NA MESMA transação,
 *   com teto de vagas sob advisory lock e unicidade (evento, pessoa).
 * - `public.checkins`: a lista que a gestão opera. Espelhada logo depois.
 *
 * Nada aqui roda no navegador: service role só no servidor.
 */

const TABELA = "evento_participantes";

export interface EventoRow extends EventoOperacional {
  id: string;
  titulo: string;
  slug: string | null;
  data_evento: string | null;
  horario_inicio: string | null;
}

export interface Participante {
  id: string;
  evento_id: string;
  pessoa_id: number;
  cpf: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  status: "inscrito" | "confirmado" | "presente" | "cancelado" | "no_show";
  ticket_code: string;
  ticket_token: string;
  pelotao: string | null;
  checkin_em: string | null;
  metadata: Record<string, unknown> | null;
  criado_em: string;
}

/** `select('*')` de propósito: funciona antes e depois da coluna `capacidade` existir. */
export async function getEvento(): Promise<EventoRow | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("eventos").select("*").eq("slug", EVENTO_SLUG).maybeSingle();
  if (error) {
    console.error("[love-run] Erro ao carregar evento:", error.message);
    return null;
  }
  return (data as EventoRow) ?? null;
}

/** Inscrições que ocupam vaga (mesma conta da trava da função no banco). */
export async function contarInscritos(eventoId: string): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(TABELA)
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .neq("status", "cancelado");
  if (error) {
    console.error("[love-run] Erro ao contar inscritos:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getParticipacao(eventoId: string, cpf: string): Promise<Participante | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .eq("evento_id", eventoId)
    .eq("cpf", cpf)
    .neq("status", "cancelado")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Participante) ?? null;
}

export async function getParticipantePorToken(token: string): Promise<Participante | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABELA).select("*").eq("ticket_token", token).maybeSingle();
  if (error) {
    console.error("[love-run] Erro ao buscar ingresso:", error.message);
    return null;
  }
  return (data as Participante) ?? null;
}

export async function getEventoPorId(id: string): Promise<EventoRow | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("eventos").select("*").eq("id", id).maybeSingle();
  return (data as EventoRow) ?? null;
}

export type ResultadoInscricao =
  | { ok: true; participante: Participante; jaEstava: boolean }
  | { ok: false; motivo: "sem_banco" | "lotado" | "erro" };

export async function inscrever(dados: Inscricao, evento: EventoRow): Promise<ResultadoInscricao> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, motivo: "sem_banco" };

  // Se a função devolver outro código, a inscrição já existia (corrida entre
  // dois envios simultâneos do mesmo CPF): a resposta é a mesma inscrição.
  const ticketNovo = gerarTicketCode();

  const { data, error } = await supabase.rpc("inscrever_no_evento", {
    p_evento_id: evento.id,
    p_cpf: dados.cpf,
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone,
    p_ticket_code: ticketNovo,
    p_ticket_token: gerarTicketToken(),
    p_sexo: dados.sexo,
    p_nascimento: null,
    p_pelotao: dados.pelotao,
    p_categoria: null,
    p_origem: "site",
    p_parceiro_slug: null,
    p_lote: null,
    p_utm: dados.utm ?? {},
    // `evento_participantes` não tem coluna de sexo: vai no metadata, e o
    // leitor da gestão usa daqui quando precisa criar a linha em `checkins`.
    p_metadata: { sexo: dados.sexo, marketing_optin: dados.marketing === true, lp: EVENTO_SLUG },
    p_capacidade: typeof evento.capacidade === "number" ? evento.capacidade : null,
    p_atualizar_cadastro: false,
  });

  if (error) {
    if (error.message?.includes("EVENTO_LOTADO")) return { ok: false, motivo: "lotado" };
    console.error("[love-run] Erro ao inscrever:", error.code, error.message);
    return { ok: false, motivo: "erro" };
  }

  const participante = (Array.isArray(data) ? data[0] : data) as Participante | null;
  if (!participante) return { ok: false, motivo: "erro" };

  // Só quem CRIOU a inscrição espelha. A função serializa o evento sob
  // advisory lock, então em envios simultâneos do mesmo CPF exatamente um
  // recebe o próprio código de volta; se todos espelhassem, a conferência
  // "já está na lista?" correria em paralelo e duplicaria a linha em
  // `checkins` (pego pelo teste de integração em 27/10/2026).
  const jaEstava = participante.ticket_code !== ticketNovo;
  if (!jaEstava) await espelharNoCheckin(participante, evento, dados.sexo);
  return { ok: true, participante, jaEstava };
}

/**
 * Copia a inscrição para `checkins`, a lista da gestão e do balcão.
 * Idempotente por CPF + evento (nas duas grafias, como o /api/checkin). Não
 * derruba a inscrição: se falhar, a gestão traz a pessoa sozinha ao abrir a
 * lista (sincronização do módulo Check-in).
 */
async function espelharNoCheckin(p: Participante, evento: EventoRow, sexo: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  const cpf = String(p.cpf ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) return;
  const mascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

  const { data: existente, error: erroBusca } = await supabase
    .from("checkins")
    .select("id")
    .eq("evento_id", evento.id)
    .in("cpf", [cpf, mascarado])
    .limit(1);
  if (erroBusca) {
    console.error("[love-run] Erro ao conferir lista de check-in:", erroBusca.message);
    return;
  }
  if (existente && existente.length > 0) return;

  const { error } = await supabase.from("checkins").insert({
    nome_completo: p.nome_completo,
    email: p.email,
    telefone: p.telefone,
    cpf,
    sexo,
    pelotao: p.pelotao,
    data_do_evento: evento.data_evento,
    nome_do_evento: evento.titulo ?? "",
    evento_id: evento.id,
    data_hora_checkin: p.criado_em,
    validacao_do_checkin: false,
  });
  if (error) console.error("[love-run] Erro ao espelhar no check-in:", error.message);
}
