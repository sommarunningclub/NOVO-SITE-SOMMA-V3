import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { formatarData } from "@/lib/check-in/eventos";
import { getEvento, type EventoRow } from "@/lib/dexcomplica-love-run/db";
import { pelotoesValidos } from "@/lib/dexcomplica-love-run/estado";

/**
 * O /check-in/interno vale para UM evento só: o Dexcomplica Love Run de
 * sábado (o slug vem de lib/dexcomplica-love-run/event.config). A LP e o
 * /check-in continuam fechados; só este link fura a fila, e só até gastar a
 * cota abaixo. Depois disso o link "vence" e o formulário trava.
 *
 * A cota conta as inscrições ativas feitas por aqui (metadata.via), então uma
 * inscrição cancelada na gestão devolve a vaga ao link.
 */

/** 80 em produção. Fora dela, `CHECKIN_INTERNO_VAGAS_TESTE` encurta a cota para testar o bloqueio. */
export const VAGAS_LINK =
  (process.env.NODE_ENV !== "production" && Number(process.env.CHECKIN_INTERNO_VAGAS_TESTE)) || 80;
export const VIA_INTERNO = "check-in-interno";

const TABELA = "evento_participantes";

export type EventoInterno = {
  id: string;
  titulo: string;
  data: string;
  dataFormatada: string;
  local: string;
  pelotoes: string[];
};

export type SituacaoLink = {
  evento: EventoInterno | null;
  /** A linha completa, para a rota de inscrição. */
  linha: EventoRow | null;
  usadas: number;
  restantes: number;
  /** Cota gasta ou evento já passou: o formulário trava. */
  encerrado: boolean;
  motivo: "ok" | "esgotado" | "passou" | "sem_evento";
  erro?: string;
};

export function hojeEmBrasilia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

/** Inscrições ativas feitas pelo link interno. Lança se o banco falhar (para não liberar vaga às cegas). */
export async function contarUsadasNoLink(eventoId: string): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Banco indisponível");
  const { count, error } = await supabase
    .from(TABELA)
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .neq("status", "cancelado")
    .eq("metadata->>via", VIA_INTERNO);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Teto a passar para `inscrever_no_evento`: quem está no evento POR FORA do
 * link + a cota do link. A função conta todos os inscritos sob advisory lock;
 * como o público está fechado, a parcela de fora não muda e o teto é o mesmo
 * para todos os envios simultâneos, então juntos eles não passam da cota.
 * (Somar "total - usadas" em duas leituras separadas deixava o teto crescer
 * entre uma leitura e outra: 6 envios simultâneos passavam numa cota de 3.)
 */
export async function capacidadeDoLink(eventoId: string): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Banco indisponível");
  const { count, error } = await supabase
    .from(TABELA)
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .neq("status", "cancelado")
    .or(`metadata->>via.is.null,metadata->>via.neq.${VIA_INTERNO}`);
  if (error) throw new Error(error.message);
  return (count ?? 0) + VAGAS_LINK;
}

export async function situacaoDoLink(): Promise<SituacaoLink> {
  const vazio = { evento: null, linha: null, usadas: 0, restantes: 0, encerrado: true } as const;
  const linha = await getEvento();
  if (!linha || !linha.data_evento) return { ...vazio, motivo: "sem_evento" };

  const evento: EventoInterno = {
    id: linha.id,
    titulo: linha.titulo,
    data: linha.data_evento,
    dataFormatada: formatarData(linha.data_evento),
    local: (linha as EventoRow & { local?: string | null }).local || "Parque da Cidade, Brasília, DF",
    pelotoes: pelotoesValidos(linha.pelotoes),
  };

  let usadas: number;
  try {
    usadas = await contarUsadasNoLink(linha.id);
  } catch (e) {
    return { ...vazio, evento, linha, motivo: "sem_evento", erro: e instanceof Error ? e.message : String(e) };
  }
  const restantes = Math.max(0, VAGAS_LINK - usadas);

  if (linha.data_evento < hojeEmBrasilia()) {
    return { evento, linha, usadas, restantes, encerrado: true, motivo: "passou" };
  }
  if (restantes === 0) return { evento, linha, usadas, restantes, encerrado: true, motivo: "esgotado" };
  return { evento, linha, usadas, restantes, encerrado: false, motivo: "ok" };
}
