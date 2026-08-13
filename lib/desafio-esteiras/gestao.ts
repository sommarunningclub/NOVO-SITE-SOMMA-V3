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

/**
 * O check-in do Desafio segue a chave da gestão.
 *
 * Quem abre e fecha o check-in é o painel da gestão, no card do evento. Aqui a
 * gente só obedece: enquanto estiver `bloqueado` ou `encerrado`, ninguém valida
 * ticket — nem a unidade, nem o operador, nem o admin. Existe um interruptor
 * só, e ele fica num lugar só.
 *
 * Duas decisões que valem explicar:
 *
 * - Leitura fresca (`forcar`), sem cache. Destravar na gestão precisa valer no
 *   segundo seguinte, com a fila na porta; são 96 validações no evento
 *   inteiro, então a consulta extra não custa nada.
 *
 * - Sem vínculo com a gestão, libera. Se a integração não foi aplicada ou o
 *   banco não respondeu, o certo é a portaria continuar andando: travar a fila
 *   por causa de uma falha de rede seria pior do que deixar entrar.
 */
export async function checkinLiberado(): Promise<
  { liberado: true } | { liberado: false; status: "bloqueado" | "encerrado" }
> {
  const evento = await getEventoGestao(true);
  if (!evento) return { liberado: true };
  if (evento.checkin_status === "aberto") return { liberado: true };
  return { liberado: false, status: evento.checkin_status };
}

/** A recusa que a portaria lê, dizendo onde destravar. */
export function motivoCheckinBloqueado(status: "bloqueado" | "encerrado"): string {
  return status === "encerrado"
    ? "O check-in deste evento foi encerrado no painel da gestão."
    : "O check-in ainda não foi liberado. A organização abre no painel da gestão, no card do evento.";
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
