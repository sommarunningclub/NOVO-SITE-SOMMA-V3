import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { EVENT } from "./event.config";

/**
 * Ponte com o sistema de eventos da gestão (v0-sistema-somma-de-gestao-l7).
 *
 * O Desafio existe como um registro na tabela `eventos`, identificado pelo
 * `slug` — nunca por UUID chumbado no código. Cada inscrição guarda esse
 * `evento_id`, e um trigger no banco espelha a inscrição em `checkins`, que é
 * onde o painel da gestão lista participantes e conta check-ins.
 *
 * Ver scripts/desafio-esteiras-integracao-gestao.sql.
 */

export interface EventoGestao {
  id: string;
  titulo: string;
  data_evento: string;
  horario_inicio: string | null;
  checkin_status: "aberto" | "bloqueado" | "encerrado";
  evento_encerrado: boolean;
  local: string | null;
}

const COLUNAS = "id, titulo, data_evento, horario_inicio, checkin_status, evento_encerrado, local";

/**
 * Cache em memória do evento.
 *
 * O `evento_id` é consultado em toda inscrição; ele praticamente não muda, mas
 * `checkin_status` muda no dia. TTL curto resolve os dois casos sem transformar
 * cada inscrição numa consulta extra.
 */
let cache: { valor: EventoGestao | null; expiraEm: number } | null = null;
const TTL_MS = 60_000;

export async function getEventoGestao(forcar = false): Promise<EventoGestao | null> {
  if (!forcar && cache && cache.expiraEm > Date.now()) return cache.valor;

  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("eventos")
    .select(COLUNAS)
    .eq("slug", EVENT.gestaoSlug)
    .maybeSingle();

  if (error) {
    // Coluna `slug` ausente = integração ainda não aplicada. Não é erro fatal:
    // a LP e a inscrição seguem funcionando sem o vínculo.
    console.warn("[desafio-esteiras] evento da gestão indisponível:", error.message);
    cache = { valor: null, expiraEm: Date.now() + TTL_MS };
    return null;
  }

  const valor = (data as unknown as EventoGestao) ?? null;
  cache = { valor, expiraEm: Date.now() + TTL_MS };
  return valor;
}

/** `evento_id` para gravar na inscrição. `null` quando a integração não está aplicada. */
export async function getEventoId(): Promise<string | null> {
  return (await getEventoGestao())?.id ?? null;
}

/** Só para o painel: mostra ao operador o que a gestão está dizendo do evento. */
export async function getStatusGestao(): Promise<{
  vinculado: boolean;
  checkinStatus: EventoGestao["checkin_status"] | null;
  encerrado: boolean;
  titulo: string | null;
}> {
  const evento = await getEventoGestao(true);
  return {
    vinculado: Boolean(evento),
    checkinStatus: evento?.checkin_status ?? null,
    encerrado: evento?.evento_encerrado ?? false,
    titulo: evento?.titulo ?? null,
  };
}
