import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { formatarData } from "@/lib/check-in/eventos";
import { EVENTO_SLUG as SLUG_LOVE_RUN } from "@/lib/dexcomplica-love-run/event.config";

/**
 * Eventos em que a equipe pode inscrever pelo /check-in/interno: todos de hoje
 * em diante (horário de Brasília), qualquer que seja o estado da parte pública
 * (aberto, bloqueado, encerrado ou oculto no /check-in). É justamente para
 * colocar gente dentro quando o público está fechado.
 */

export const PELOTOES_PADRAO = ["4km", "6km", "8km"];

export type EventoInterno = {
  id: string;
  titulo: string;
  slug: string | null;
  data: string;
  dataFormatada: string;
  horarioInicio: string;
  local: string;
  tipo: "corrida" | "personalizado";
  pelotoes: string[];
  /** Situação da parte pública, só para mostrar na tela. */
  publico: "aberto" | "fechado" | "oculto";
  /** Evento com LP própria e ingresso (hoje só o Dexcomplica Love Run). */
  comIngresso: boolean;
};

type Linha = {
  id: string;
  titulo: string;
  slug: string | null;
  data_evento: string;
  horario_inicio: string | null;
  local: string | null;
  tipo: "corrida" | "personalizado" | null;
  checkin_status: string | null;
  evento_encerrado: boolean | null;
  oculto_no_checkin_publico: boolean | null;
  pelotoes: string[] | null;
};

export function hojeEmBrasilia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

function mapear(row: Linha): EventoInterno {
  const pelotoes = (row.pelotoes ?? []).map((p) => String(p ?? "").trim()).filter(Boolean);
  const publico =
    row.oculto_no_checkin_publico === true
      ? "oculto"
      : row.checkin_status === "aberto" && row.evento_encerrado !== true
        ? "aberto"
        : "fechado";
  return {
    id: row.id,
    titulo: row.titulo,
    slug: row.slug,
    data: row.data_evento,
    dataFormatada: formatarData(row.data_evento),
    horarioInicio: row.horario_inicio ?? "",
    local: row.local || "Parque da Cidade, Brasília, DF",
    tipo: row.tipo === "personalizado" ? "personalizado" : "corrida",
    pelotoes: pelotoes.length > 0 ? pelotoes : PELOTOES_PADRAO,
    publico,
    comIngresso: row.slug === SLUG_LOVE_RUN,
  };
}

export async function listarEventosInternos(): Promise<{ eventos: EventoInterno[]; erro?: string }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { eventos: [], erro: "Banco indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)." };
  const { data, error } = await supabase
    .from("eventos")
    .select(
      "id, titulo, slug, data_evento, horario_inicio, local, tipo, checkin_status, evento_encerrado, oculto_no_checkin_publico, pelotoes"
    )
    .gte("data_evento", hojeEmBrasilia())
    .order("data_evento", { ascending: true })
    .limit(30);
  if (error) return { eventos: [], erro: error.message };
  return { eventos: ((data ?? []) as Linha[]).map(mapear) };
}

export async function buscarEventoInterno(id: string): Promise<EventoInterno | null> {
  const { eventos } = await listarEventosInternos();
  return eventos.find((e) => e.id === id) ?? null;
}
