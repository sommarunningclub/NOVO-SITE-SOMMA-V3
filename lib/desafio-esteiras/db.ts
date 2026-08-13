import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import {
  UNITS,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  VAGAS_TOTAIS,
  vagasRestantes,
  vagasStatus,
  type Participacao,
  type Sexo,
  type UnitId,
} from "./event.config";

export const TABLE = "evolve_treadmill_event_registrations";
export const BUCKET_FOTOS = "desafio-esteiras-perfis";

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
  sexo: Sexo | null;
  participacao: Participacao;
  foto_path: string | null;
  atualizado_em: string | null;
}

/**
 * URL pública da foto de perfil.
 *
 * Guardamos o caminho no banco e montamos a URL aqui: se o domínio do storage
 * mudar, nenhuma linha precisa ser reescrita.
 */
export function fotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET_FOTOS}/${path}`;
}

/** Campos seguros para exibir na credencial pública (sem CPF, sem e-mail, sem telefone). */
export type PublicTicket = Pick<
  Registration,
  | "full_name"
  | "unit_id"
  | "ticket_code"
  | "ticket_token"
  | "status"
  | "created_at"
  | "checked_in_at"
  | "sexo"
  | "participacao"
> & { heat_number: number | null };

export const PUBLIC_TICKET_COLUMNS =
  "full_name, unit_id, ticket_code, ticket_token, status, created_at, checked_in_at, sexo, participacao, heat_number";

export interface UnitCount {
  unitId: UnitId;
  inscritos: number;
  competidores: number;
  espectadores: number;
  /** Ocupação das 12 vagas de cada categoria — a regra da competição. */
  feminino: number;
  masculino: number;
}

export interface EventStats {
  total: number;
  totalCompetidores: number;
  porUnidade: UnitCount[];
  /** `false` quando o Supabase não está configurado — a UI mostra zeros sem quebrar. */
  disponivel: boolean;
}

const ZERO_STATS: EventStats = {
  total: 0,
  totalCompetidores: 0,
  porUnidade: UNITS.map((u) => ({
    unitId: u.id as UnitId,
    inscritos: 0,
    competidores: 0,
    espectadores: 0,
    feminino: 0,
    masculino: 0,
  })),
  disponivel: false,
};

/**
 * Contagem por unidade. Só conta tickets válidos (`confirmed` + `checked_in`);
 * cancelados não entram no número público. O total inclui quem só vai assistir
 * — é o número de gente que a unidade vai receber.
 */
export async function getEventStats(): Promise<EventStats> {
  const supabase = getServiceSupabase();
  if (!supabase) return ZERO_STATS;

  const { data, error } = await supabase
    .from(TABLE)
    .select("unit_id, participacao, sexo")
    .in("status", ["confirmed", "checked_in"]);

  if (error || !data) {
    if (error) console.error("[desafio-esteiras] getEventStats:", error.message);
    return ZERO_STATS;
  }

  const linhas = data as { unit_id: string; participacao: Participacao | null; sexo: Sexo | null }[];
  type Acc = { inscritos: number; competidores: number; feminino: number; masculino: number };
  const counts = new Map<string, Acc>(
    UNITS.map((u) => [u.id, { inscritos: 0, competidores: 0, feminino: 0, masculino: 0 }])
  );

  for (const row of linhas) {
    const atual = counts.get(row.unit_id);
    if (!atual) continue;
    atual.inscritos += 1;
    // `participacao` tem default 'competidor' no banco; null só apareceria
    // em linha anterior à migration, e aí tratamos como competidor.
    const compete = row.participacao !== "espectador";
    if (!compete) continue;
    atual.competidores += 1;
    // Só quem compete ocupa vaga de categoria — é essa conta que a regra limita.
    if (row.sexo === "feminino") atual.feminino += 1;
    if (row.sexo === "masculino") atual.masculino += 1;
  }

  const porUnidade = UNITS.map((u) => {
    const c = counts.get(u.id) ?? { inscritos: 0, competidores: 0, feminino: 0, masculino: 0 };
    return {
      unitId: u.id as UnitId,
      inscritos: c.inscritos,
      competidores: c.competidores,
      espectadores: c.inscritos - c.competidores,
      feminino: c.feminino,
      masculino: c.masculino,
    };
  });

  return {
    total: linhas.length,
    totalCompetidores: porUnidade.reduce((s, u) => s + u.competidores, 0),
    porUnidade,
    disponivel: true,
  };
}

/**
 * Contadores no formato que os componentes da LP consomem.
 *
 * Existe para as páginas não repetirem o mapeamento — e para que a regra das
 * vagas (12 por categoria) entre uma vez só, aqui.
 */
export async function getStatsIniciais() {
  const stats = await getEventStats();
  return {
    total: stats.total,
    totalCompetidores: stats.totalCompetidores,
    vagasTotais: VAGAS_TOTAIS,
    vagasPorUnidade: VAGAS_POR_UNIDADE,
    vagasPorCategoria: VAGAS_POR_CATEGORIA,
    disponivel: stats.disponivel,
    unidades: stats.porUnidade.map((u) => {
      const unit = UNITS.find((x) => x.id === u.unitId)!;
      const esgotada =
        vagasStatus(u.feminino) === "esgotada" && vagasStatus(u.masculino) === "esgotada";
      return {
        id: u.unitId,
        inscritos: u.inscritos,
        competidores: u.competidores,
        espectadores: u.espectadores,
        status: esgotada ? ("esgotada" as const) : unit.status,
        capacidade: unit.capacidade,
        categorias: {
          feminino: {
            ocupadas: u.feminino,
            total: VAGAS_POR_CATEGORIA,
            restantes: vagasRestantes(u.feminino),
            status: vagasStatus(u.feminino),
          },
          masculino: {
            ocupadas: u.masculino,
            total: VAGAS_POR_CATEGORIA,
            restantes: vagasRestantes(u.masculino),
            status: vagasStatus(u.masculino),
          },
        },
        vagasCompetidores: VAGAS_POR_UNIDADE,
        competidoresRestantes: Math.max(0, VAGAS_POR_UNIDADE - u.feminino - u.masculino),
      };
    }),
  };
}

/* ── Grade pública de competidores ───────────────────────────────────────── */

export interface Competidor {
  /** Só o primeiro nome vai para o público — a página é indexável. */
  nome: string;
  unitId: string;
  sexo: Sexo;
  fotoUrl: string | null;
  /** Inicial para o avatar de quem não enviou foto. */
  inicial: string;
}

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;

/**
 * Quem vai disputar, para a grade da home.
 *
 * Devolve apenas primeiro nome, unidade, categoria e foto — nunca CPF, e-mail,
 * telefone ou nome completo. Quem só vai assistir não entra, e quem se
 * inscreveu antes de existir o campo `sexo` também não (não dá para colocar
 * numa categoria sem o dado).
 */
export async function getCompetidores(): Promise<{ lista: Competidor[]; disponivel: boolean }> {
  const supabase = getServiceSupabase();
  if (!supabase) return { lista: [], disponivel: false };

  const { data, error } = await supabase
    .from(TABLE)
    .select("full_name, unit_id, sexo, foto_path, created_at")
    .eq("participacao", "competidor")
    .not("sexo", "is", null)
    .in("status", ["confirmed", "checked_in"])
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.error("[desafio-esteiras] getCompetidores:", error.message);
    return { lista: [], disponivel: false };
  }

  const lista = (data as { full_name: string; unit_id: string; sexo: Sexo; foto_path: string | null }[]).map(
    (r) => {
      const nome = primeiroNome(r.full_name);
      return {
        nome,
        unitId: r.unit_id,
        sexo: r.sexo,
        fotoUrl: fotoUrl(r.foto_path),
        inicial: nome.charAt(0).toUpperCase(),
      };
    }
  );

  return { lista, disponivel: true };
}

/**
 * Vagas restantes de uma categoria numa unidade, lidas na hora.
 *
 * A API chama isto antes de gravar para dar um erro claro à pessoa. A garantia
 * de verdade contra corrida é o trigger `dst_capacidade` no banco — este número
 * pode estar desatualizado por milissegundos, o do banco não.
 */
export async function getVagasCategoria(
  unitId: string,
  sexo: Sexo
): Promise<{ ocupadas: number; restantes: number } | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("unit_id", unitId)
    .eq("sexo", sexo)
    .eq("participacao", "competidor")
    .neq("status", "cancelled");

  if (error) {
    console.error("[desafio-esteiras] getVagasCategoria:", error.message);
    return null;
  }

  const ocupadas = count ?? 0;
  return { ocupadas, restantes: Math.max(0, VAGAS_POR_CATEGORIA - ocupadas) };
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
