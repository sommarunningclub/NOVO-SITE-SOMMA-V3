import "server-only";
import { cache } from "react";
import { getServiceSupabase } from "@/lib/supabase";
import { SLUG } from "./config";
import type { EventoPublico, Ingresso } from "./tipos";

/**
 * Acesso ao banco da plataforma de eventos. Tudo passa por função (RPC) com a
 * service role: as regras de vaga, fila e check-in moram no Postgres, dentro
 * de transação. Nenhuma tabela evp_ é lida direto daqui.
 */

export class BancoIndisponivel extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "BancoIndisponivel";
  }
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new BancoIndisponivel("Supabase não configurado");
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new BancoIndisponivel(`${fn}: ${error.message}`);
  return data as T;
}

/**
 * Evento para a landing page. Nunca lança: sem banco, ou antes de a migration
 * rodar, a página abre com o conteúdo fixo e as inscrições em "em breve".
 */
export const lerEventoPublico = cache(async (): Promise<EventoPublico | null> => {
  try {
    return await rpc<EventoPublico | null>("evp_evento_publico", { p_slug: SLUG });
  } catch (erro) {
    console.error("[evp] Evento indisponível:", erro instanceof Error ? erro.message : erro);
    return null;
  }
});

export async function lerIngresso(token: string | null | undefined): Promise<Ingresso | null> {
  if (!token || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  try {
    return await rpc<Ingresso | null>("evp_ingresso", { p_slug: SLUG, p_ticket_token: token });
  } catch (erro) {
    console.error("[evp] Ingresso indisponível:", erro instanceof Error ? erro.message : erro);
    return null;
  }
}

/** O que a página mostra quando o banco não responde. */
export const EVENTO_VAZIO: EventoPublico = {
  slug: SLUG,
  nome: "Meeting Técnico | Maratona Monumental de Brasília 2026",
  descricao: null,
  starts_at: null,
  ends_at: null,
  local_nome: null,
  endereco: null,
  lat: null,
  lng: null,
  orientacoes_chegada: null,
  info_participacao: null,
  valor_centavos: null,
  conteudo: {},
  contato: {},
  vagas: { modo: "em_breve", capacidade: null, confirmadas: 0, vagas_livres: null, fila: 0 },
  programacao: [
    { titulo: "Recepção e credenciamento", descricao: null, horario: null },
    { titulo: "SOMMA Club e BORA Assessoria", descricao: null, horario: null },
    { titulo: "Visão geral da Maratona Monumental", descricao: null, horario: null },
    { titulo: "Análise dos percursos", descricao: null, horario: null },
    { titulo: "Estratégias de corrida", descricao: null, horario: null },
    { titulo: "Perguntas, respostas e encerramento", descricao: null, horario: null },
  ],
  profissionais: [],
  percursos: [],
};
