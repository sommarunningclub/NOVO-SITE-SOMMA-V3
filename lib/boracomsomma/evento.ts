import "server-only";
import { getServiceSupabase, getSupabase } from "@/lib/supabase";
import { EVENTO_PADRAO, SLUG } from "./config";

/**
 * Estado do check-in, lido da linha do evento em `eventos` (slug boracomsomma).
 * - sem-evento: a gestão ainda não criou o evento; a página mostra "em breve".
 * - aberto / bloqueado / encerrado: o status que a gestão escolheu.
 */
export type EstadoCheckin = "sem-evento" | "aberto" | "bloqueado" | "encerrado";

export type EventoBora = {
  id: string | null;
  titulo: string;
  /** yyyy-mm-dd */
  data: string;
  /** hh:mm */
  horario: string;
  local: string;
  localUrl: string | null;
  pelotoes: string[];
  estado: EstadoCheckin;
};

type Linha = {
  id: string;
  titulo: string | null;
  data_evento: string;
  horario_inicio: string | null;
  local: string | null;
  local_url: string | null;
  pelotoes: string[] | null;
  checkin_status: string | null;
  evento_encerrado: boolean | null;
};

const CAMPOS = "id, titulo, data_evento, horario_inicio, local, local_url, pelotoes, checkin_status, evento_encerrado";

export function padrao(): EventoBora {
  return {
    id: null,
    titulo: EVENTO_PADRAO.titulo,
    data: EVENTO_PADRAO.data,
    horario: EVENTO_PADRAO.horario,
    local: `${EVENTO_PADRAO.local}, ${EVENTO_PADRAO.cidade}`,
    localUrl: null,
    pelotoes: EVENTO_PADRAO.pelotoes,
    estado: "sem-evento",
  };
}

function mapear(l: Linha): EventoBora {
  const status = l.checkin_status;
  const estado: EstadoCheckin =
    l.evento_encerrado || status === "encerrado" ? "encerrado" : status === "aberto" ? "aberto" : "bloqueado";
  const pelotoes = (l.pelotoes ?? []).filter((p) => typeof p === "string" && p.trim());
  return {
    id: l.id,
    titulo: l.titulo?.trim() || EVENTO_PADRAO.titulo,
    data: l.data_evento,
    horario: (l.horario_inicio || EVENTO_PADRAO.horario).slice(0, 5),
    // Os locais da gestão vêm com travessão ("Parque da Cidade — Brasília, DF").
    local: (l.local?.trim() || `${EVENTO_PADRAO.local}, ${EVENTO_PADRAO.cidade}`).replace(/\s+[—–]\s+/g, ", "),
    localUrl: l.local_url?.trim() || null,
    pelotoes: pelotoes.length ? pelotoes : EVENTO_PADRAO.pelotoes,
    estado,
  };
}

/**
 * Evento da LP. Na leitura pública usa a chave anônima (a mesma do /check-in);
 * na rota de inscrição, a service role, para o servidor decidir com o dado real.
 */
export async function buscarEvento(opts: { servidor?: boolean } = {}): Promise<EventoBora> {
  const supabase = opts.servidor ? getServiceSupabase() : getSupabase();
  if (!supabase) return padrao();
  const { data, error } = await supabase
    .from("eventos")
    .select(CAMPOS)
    .eq("slug", SLUG)
    .order("data_evento", { ascending: false })
    .limit(1)
    .maybeSingle<Linha>();
  if (error) {
    console.error("[boracomsomma] Falha ao ler o evento:", error.message);
    return padrao();
  }
  return data ? mapear(data) : padrao();
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function partesDaData(data: string) {
  const [y, m, d] = data.split("-").map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return {
    dia: String(d).padStart(2, "0"),
    mes: MESES[m - 1],
    mesLongo: MESES_LONGOS[m - 1],
    semana: DIAS[dia],
    ano: y,
  };
}

export function horarioCurto(h: string) {
  const [hh, mm] = h.split(":");
  return mm === "00" ? `${hh}h` : `${hh}h${mm}`;
}
