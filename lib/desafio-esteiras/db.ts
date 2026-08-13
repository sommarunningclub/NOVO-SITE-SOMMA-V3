import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { UNITS, type UnitId } from "./event.config";

export const TABLE = "evolve_treadmill_event_registrations";

export type TicketStatus = "confirmed" | "checked_in" | "cancelled";

export interface Registration {
  id: string;
  created_at: string;
  full_name: string;
  cpf: string;
  birth_date: string;
  email: string;
  phone: string;
  unit_id: string;
  ticket_code: string;
  ticket_token: string;
  status: TicketStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referral: string | null;
  origem: string | null;
  metadata: Record<string, unknown> | null;
}

/** Campos seguros para exibir na credencial pública (sem CPF, sem e-mail, sem telefone). */
export type PublicTicket = Pick<
  Registration,
  "full_name" | "unit_id" | "ticket_code" | "ticket_token" | "status" | "created_at" | "checked_in_at"
>;

export const PUBLIC_TICKET_COLUMNS =
  "full_name, unit_id, ticket_code, ticket_token, status, created_at, checked_in_at";

export interface UnitCount {
  unitId: UnitId;
  inscritos: number;
}

export interface EventStats {
  total: number;
  porUnidade: UnitCount[];
  /** `false` quando o Supabase não está configurado — a UI mostra zeros sem quebrar. */
  disponivel: boolean;
}

const ZERO_STATS: EventStats = {
  total: 0,
  porUnidade: UNITS.map((u) => ({ unitId: u.id as UnitId, inscritos: 0 })),
  disponivel: false,
};

/**
 * Contagem de inscritos por unidade. Só conta tickets válidos
 * (`confirmed` + `checked_in`); cancelados não entram no número público.
 */
export async function getEventStats(): Promise<EventStats> {
  const supabase = getServiceSupabase();
  if (!supabase) return ZERO_STATS;

  const { data, error } = await supabase
    .from(TABLE)
    .select("unit_id")
    .in("status", ["confirmed", "checked_in"]);

  if (error || !data) {
    if (error) console.error("[desafio-esteiras] getEventStats:", error.message);
    return ZERO_STATS;
  }

  const counts = new Map<string, number>(UNITS.map((u) => [u.id, 0]));
  for (const row of data as { unit_id: string }[]) {
    counts.set(row.unit_id, (counts.get(row.unit_id) ?? 0) + 1);
  }

  return {
    total: data.length,
    porUnidade: UNITS.map((u) => ({ unitId: u.id as UnitId, inscritos: counts.get(u.id) ?? 0 })),
    disponivel: true,
  };
}

export async function getTicketByToken(token: string): Promise<PublicTicket | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select(PUBLIC_TICKET_COLUMNS)
    .eq("ticket_token", token)
    .neq("status", "cancelled")
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as PublicTicket;
}
