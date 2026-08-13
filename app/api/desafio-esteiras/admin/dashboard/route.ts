import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireOperator } from "@/lib/desafio-esteiras/auth";
import { TABLE } from "@/lib/desafio-esteiras/db";
import { UNITS } from "@/lib/desafio-esteiras/event.config";
import { getStatusGestao } from "@/lib/desafio-esteiras/gestao";

export const dynamic = "force-dynamic";

type Linha = {
  unit_id: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referral: string | null;
  full_name: string;
  ticket_code: string;
};

/**
 * Métricas do evento em uma chamada só.
 *
 * A tabela é pequena (centenas de linhas) — puxar tudo e agregar em memória é
 * mais barato e mais flexível que múltiplos count() no Postgres, e não exige
 * criar RPCs. O front chama isso em polling; nada de Realtime porque a tabela
 * está com RLS sem policy (a anon key não pode ler, por segurança).
 */
export async function GET() {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  let query = supabase
    .from(TABLE)
    .select(
      "unit_id, status, created_at, checked_in_at, utm_source, utm_medium, utm_campaign, referral, full_name, ticket_code"
    )
    .order("created_at", { ascending: false });

  if (auth.session.role === "operador" && auth.session.unitId) {
    query = query.eq("unit_id", auth.session.unitId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[desafio-esteiras] dashboard:", error.message);
    return NextResponse.json({ error: "Não foi possível carregar os dados." }, { status: 500 });
  }

  const linhas = (data ?? []) as Linha[];
  const validas = linhas.filter((l) => l.status !== "cancelled");

  const unidadesVisiveis =
    auth.session.role === "operador" && auth.session.unitId
      ? UNITS.filter((u) => u.id === auth.session.unitId)
      : UNITS;

  const porUnidade = unidadesVisiveis.map((u) => {
    const daUnidade = validas.filter((l) => l.unit_id === u.id);
    const checkins = daUnidade.filter((l) => l.status === "checked_in").length;
    return {
      id: u.id,
      nome: u.nome,
      curto: u.curto,
      inscritos: daUnidade.length,
      checkins,
      pendentes: daUnidade.length - checkins,
      capacidade: u.capacidade,
    };
  });

  const checkins = validas.filter((l) => l.status === "checked_in").length;

  // Conversão por origem (utm_source), com referral como fallback.
  const origens = new Map<string, { inscritos: number; checkins: number }>();
  for (const l of validas) {
    const chave = l.utm_source || (l.referral ? "referral" : "(direto)");
    const atual = origens.get(chave) ?? { inscritos: 0, checkins: 0 };
    atual.inscritos += 1;
    if (l.status === "checked_in") atual.checkins += 1;
    origens.set(chave, atual);
  }

  const campanhas = new Map<string, number>();
  for (const l of validas) {
    if (!l.utm_campaign) continue;
    const chave = `${l.utm_source ?? "?"} · ${l.utm_medium ?? "?"} · ${l.utm_campaign}`;
    campanhas.set(chave, (campanhas.get(chave) ?? 0) + 1);
  }

  // Séries temporais (fuso de Brasília).
  const porDia = new Map<string, number>();
  const porHora = new Map<string, number>();
  for (const l of validas) {
    const d = new Date(l.created_at);
    const dia = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
    const hora = d.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
    });
    porHora.set(hora, (porHora.get(hora) ?? 0) + 1);
  }

  // Estado do evento no painel da gestão — informativo, para o operador saber
  // se o espelho está ativo e o que a gestão está dizendo do check-in.
  const gestao = await getStatusGestao();

  return NextResponse.json({
    gestao,
    escopo: auth.session.role === "operador" ? auth.session.unitId : "todas",
    role: auth.session.role,
    nome: auth.session.nome,
    total: validas.length,
    cancelados: linhas.length - validas.length,
    checkins,
    pendentes: validas.length - checkins,
    porUnidade,
    origens: [...origens.entries()]
      .map(([fonte, v]) => ({ fonte, ...v }))
      .sort((a, b) => b.inscritos - a.inscritos),
    campanhas: [...campanhas.entries()]
      .map(([campanha, inscritos]) => ({ campanha, inscritos }))
      .sort((a, b) => b.inscritos - a.inscritos)
      .slice(0, 12),
    porDia: [...porDia.entries()].map(([dia, n]) => ({ dia, n })).reverse(),
    porHora: [...porHora.entries()].map(([hora, n]) => ({ hora, n })).reverse().slice(-24),
    ultimos: validas.slice(0, 15).map((l) => ({
      full_name: l.full_name,
      ticket_code: l.ticket_code,
      unit_id: l.unit_id,
      status: l.status,
      created_at: l.created_at,
    })),
    atualizado_em: new Date().toISOString(),
  });
}
