import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import type { Categoria } from "./config";

/**
 * Acesso ao banco do O LONGÃO.
 *
 * Todas as tabelas têm RLS ligado sem policy (padrão da casa): anon não lê
 * nem escreve nada; todo acesso passa por aqui, server-side, com service
 * role. As tabelas vivem em `scripts/o-longao-migration.sql`.
 */

export const TB = {
  events: "longao_events",
  crews: "longao_crews",
  teams: "longao_teams",
  athletes: "longao_athletes",
  treadmills: "longao_treadmills",
  liveSessions: "longao_live_sessions",
  leaderboard: "longao_leaderboard",
  results: "longao_results",
  sponsors: "longao_sponsors",
  consents: "longao_consents",
  auditLogs: "longao_audit_logs",
} as const;

export const EVENT_SLUG = "o-longao-2026";
export const BUCKET_LOGOS = "o-longao-logos";

export type CrewStatus = "pendente" | "aprovada" | "reprovada";
export type TeamStatus = "inscrita" | "classificada" | "finalista" | "eliminada";

/** O que a landing pode mostrar de uma crew. Nunca dados pessoais. */
export interface CrewPublica {
  id: string;
  nome: string;
  cidade: string;
  instagram: string;
  logo_url: string | null;
  categorias: Categoria[];
  classificada: boolean;
}

export interface StatsCrews {
  total: number;
  masculino: number;
  feminino: number;
}

export function logoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  return `${base}/storage/v1/object/public/${BUCKET_LOGOS}/${path}`;
}

/**
 * Crews aprovadas para a vitrine da landing. Banco fora do ar ou vazio
 * devolve lista vazia: a seção mostra o estado "grid aberto" e a página
 * nunca quebra por causa da vitrine.
 */
export async function getCrewsPublicas(): Promise<CrewPublica[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TB.crews)
    .select(`id, nome, cidade, instagram, logo_path, status, ${TB.teams}(categoria, status)`)
    .eq("status", "aprovada")
    .order("created_at", { ascending: true })
    .limit(60);

  if (error || !data) {
    if (error) console.error("[o-longao] getCrewsPublicas:", error.message);
    return [];
  }

  type Linha = {
    id: string;
    nome: string;
    cidade: string;
    instagram: string;
    logo_path: string | null;
    longao_teams?: { categoria: Categoria; status: TeamStatus }[];
  };

  return (data as unknown as Linha[]).map((c) => ({
    id: c.id,
    nome: c.nome,
    cidade: c.cidade,
    instagram: c.instagram,
    logo_url: logoUrl(c.logo_path),
    categorias: (c.longao_teams ?? []).map((t) => t.categoria),
    classificada: (c.longao_teams ?? []).some(
      (t) => t.status === "classificada" || t.status === "finalista"
    ),
  }));
}

/** Contagem de equipes inscritas (não canceladas) por categoria. */
export async function getStatsCrews(): Promise<StatsCrews> {
  const supabase = getServiceSupabase();
  if (!supabase) return { total: 0, masculino: 0, feminino: 0 };

  const { data, error } = await supabase
    .from(TB.teams)
    .select(`categoria, ${TB.crews}!inner(status)`)
    .neq(`${TB.crews}.status`, "reprovada");

  if (error || !data) {
    if (error) console.error("[o-longao] getStatsCrews:", error.message);
    return { total: 0, masculino: 0, feminino: 0 };
  }

  const linhas = data as unknown as { categoria: Categoria }[];
  const masculino = linhas.filter((t) => t.categoria === "masculino").length;
  const feminino = linhas.filter((t) => t.categoria === "feminino").length;
  return { total: linhas.length, masculino, feminino };
}
