import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireOperator } from "@/lib/o-longao/auth";
import { BUCKET_LOGOS, EVENT_SLUG, TB, logoUrl } from "@/lib/o-longao/db";
import type { CrewStatus, TeamStatus } from "@/lib/o-longao/db";
import { formatCPF } from "@/lib/cpf";
import { filtroIlike } from "@/lib/postgrest-filtro";

export const dynamic = "force-dynamic";

/* ── Tipos das linhas que lemos ─────────────────────────────────────────── */

type Categoria = "masculino" | "feminino";
type PagamentoStatus = "isento" | "pendente" | "pago";
type Fase = "seletiva" | "final";

const STATUS_CREW: CrewStatus[] = ["pendente", "aprovada", "reprovada"];
const STATUS_TEAM: TeamStatus[] = ["inscrita", "classificada", "finalista", "eliminada"];
const STATUS_PAGAMENTO: PagamentoStatus[] = ["isento", "pendente", "pago"];
const CATEGORIAS: Categoria[] = ["masculino", "feminino"];

interface TeamLinha {
  id: string;
  categoria: Categoria;
  status: TeamStatus;
  seletiva_km: number | null;
  seletiva_posicao: number | null;
  seletiva_bateria: number | null;
  final_km: number | null;
  final_posicao: number | null;
}

interface CrewLinha {
  id: string;
  codigo: string;
  nome: string;
  instagram: string;
  cidade: string;
  logo_path: string | null;
  status: CrewStatus;
  pagamento_status: PagamentoStatus;
  pagamento_marcado_em: string | null;
  notas_internas: string | null;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_telefone: string;
  responsavel_whatsapp: string;
  responsavel_email: string;
  capitao_nome: string;
  capitao_telefone: string;
  capitao_email: string;
  created_at: string;
  longao_teams?: TeamLinha[];
}

interface AtletaLinha {
  id: string;
  team_id: string;
  tipo: "titular" | "reserva";
  ordem: number;
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  email: string;
  instagram: string | null;
  camiseta: string;
  emergencia_nome: string;
  emergencia_telefone: string;
}

const COLUNAS_CREW =
  "id, codigo, nome, instagram, cidade, logo_path, status, pagamento_status, pagamento_marcado_em, notas_internas, responsavel_nome, responsavel_cpf, responsavel_telefone, responsavel_whatsapp, responsavel_email, capitao_nome, capitao_telefone, capitao_email, created_at";

const COLUNAS_TEAM =
  "id, categoria, status, seletiva_km, seletiva_posicao, seletiva_bateria, final_km, final_posicao";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function digitos(v: string): string {
  return String(v || "").replace(/\D/g, "");
}

/** CPF do responsável na listagem: só o suficiente para conferir. */
function mascararCpf(cpf: string): string {
  const d = digitos(cpf);
  if (d.length !== 11) return "...";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

// A busca vai para dentro de um `.or()`, que o PostgREST reparsa: escapar só
// os curingas do LIKE não basta, porque vírgula, ponto e parêntese viram
// sintaxe. `filtroIlike` (lib/postgrest-filtro) devolve o valor entre aspas,
// que é a defesa que o próprio PostgREST oferece.

function semSupabase() {
  return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
}

function texto(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

function numeroOuNulo(v: unknown): number | null | undefined {
  if (v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Registra a ação do painel. Nunca derruba a rota se a auditoria falhar. */
async function auditar(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  eventId: string | null,
  acao: string,
  alvoTabela: string,
  alvoId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from(TB.auditLogs).insert({
    event_id: eventId,
    ator: "admin",
    acao,
    alvo_tabela: alvoTabela,
    alvo_id: alvoId,
    payload,
  });
  if (error) console.error("[o-longao] audit:", error.message);
}

async function getEventId(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>
): Promise<string | null> {
  const { data } = await supabase.from(TB.events).select("id").eq("slug", EVENT_SLUG).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/* ── GET ────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const supabase = getServiceSupabase();
  if (!supabase) return semSupabase();

  const eventId = await getEventId(supabase);
  if (!eventId) return NextResponse.json({ error: "Edição não encontrada." }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) return fichaCompleta(supabase, eventId, id);

  const status = searchParams.get("status");
  const categoria = searchParams.get("categoria");
  const busca = (searchParams.get("busca") ?? "").trim();

  let query = supabase
    .from(TB.crews)
    .select(`${COLUNAS_CREW}, ${TB.teams}(${COLUNAS_TEAM})`)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (status && STATUS_CREW.includes(status as CrewStatus)) {
    query = query.eq("status", status);
  }
  if (busca.length >= 3) {
    const t = filtroIlike(busca);
    query = query.or(`nome.ilike.${t},instagram.ilike.${t},cidade.ilike.${t}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[o-longao] admin listar:", error.message);
    return NextResponse.json({ error: "Falha ao carregar inscrições." }, { status: 500 });
  }

  let linhas = (data ?? []) as unknown as CrewLinha[];

  // Categoria filtra pela equipe, não pela crew: a crew fica se tiver ao menos
  // uma equipe da categoria pedida.
  if (categoria && CATEGORIAS.includes(categoria as Categoria)) {
    linhas = linhas.filter((c) => (c.longao_teams ?? []).some((t) => t.categoria === categoria));
  }

  // Contagem de atletas por crew: um select à parte, agrupado em memória.
  const ids = linhas.map((c) => c.id);
  const porCrew = new Map<string, number>();
  if (ids.length > 0) {
    const { data: atletas, error: erroAtletas } = await supabase
      .from(TB.athletes)
      .select("crew_id")
      .in("crew_id", ids);
    if (erroAtletas) console.error("[o-longao] admin atletas:", erroAtletas.message);
    for (const a of (atletas ?? []) as { crew_id: string }[]) {
      porCrew.set(a.crew_id, (porCrew.get(a.crew_id) ?? 0) + 1);
    }
  }

  const crews = linhas.map((c) => {
    const teams = c.longao_teams ?? [];
    return {
      id: c.id,
      codigo: c.codigo,
      nome: c.nome,
      instagram: c.instagram,
      cidade: c.cidade,
      logo_url: logoUrl(c.logo_path),
      status: c.status,
      pagamento_status: c.pagamento_status,
      responsavel_nome: c.responsavel_nome,
      responsavel_cpf: mascararCpf(c.responsavel_cpf),
      responsavel_email: c.responsavel_email,
      responsavel_whatsapp: c.responsavel_whatsapp,
      created_at: c.created_at,
      categorias: teams.map((t) => t.categoria),
      teams,
      atletas: porCrew.get(c.id) ?? 0,
    };
  });

  // O resumo é do escopo inteiro (todas as crews da edição), não da página.
  const resumo = await calcularResumo(supabase, eventId);

  return NextResponse.json({ crews, resumo });
}

async function calcularResumo(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  eventId: string
) {
  const vazio = {
    total: 0,
    pendentes: 0,
    aprovadas: 0,
    reprovadas: 0,
    equipes_masculino: 0,
    equipes_feminino: 0,
  };

  const [{ data: todas, error: e1 }, { data: equipes, error: e2 }] = await Promise.all([
    supabase.from(TB.crews).select("status").eq("event_id", eventId),
    supabase.from(TB.teams).select("categoria").eq("event_id", eventId),
  ]);

  if (e1 || e2) {
    console.error("[o-longao] admin resumo:", e1?.message ?? e2?.message);
    return vazio;
  }

  const listaCrews = (todas ?? []) as { status: CrewStatus }[];
  const listaTeams = (equipes ?? []) as { categoria: Categoria }[];

  return {
    total: listaCrews.length,
    pendentes: listaCrews.filter((c) => c.status === "pendente").length,
    aprovadas: listaCrews.filter((c) => c.status === "aprovada").length,
    reprovadas: listaCrews.filter((c) => c.status === "reprovada").length,
    equipes_masculino: listaTeams.filter((t) => t.categoria === "masculino").length,
    equipes_feminino: listaTeams.filter((t) => t.categoria === "feminino").length,
  };
}

async function fichaCompleta(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  eventId: string,
  id: string
) {
  const { data, error } = await supabase
    .from(TB.crews)
    .select(`${COLUNAS_CREW}, ${TB.teams}(${COLUNAS_TEAM})`)
    .eq("event_id", eventId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[o-longao] admin ficha:", error.message);
    return NextResponse.json({ error: "Falha ao carregar a ficha." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Crew não encontrada." }, { status: 404 });

  const crew = data as unknown as CrewLinha;
  const teams = crew.longao_teams ?? [];

  const [{ data: atletas }, { data: consents }] = await Promise.all([
    supabase
      .from(TB.athletes)
      .select(
        "id, team_id, tipo, ordem, nome, cpf, nascimento, telefone, email, instagram, camiseta, emergencia_nome, emergencia_telefone"
      )
      .eq("crew_id", crew.id)
      .order("ordem", { ascending: true }),
    supabase
      .from(TB.consents)
      .select("tipo, aceito_em")
      .eq("crew_id", crew.id)
      .order("aceito_em", { ascending: true }),
  ]);

  const listaAtletas = (atletas ?? []) as AtletaLinha[];

  return NextResponse.json({
    crew: {
      id: crew.id,
      codigo: crew.codigo,
      nome: crew.nome,
      instagram: crew.instagram,
      cidade: crew.cidade,
      logo_url: logoUrl(crew.logo_path),
      status: crew.status,
      pagamento_status: crew.pagamento_status,
      pagamento_marcado_em: crew.pagamento_marcado_em,
      notas_internas: crew.notas_internas,
      responsavel_nome: crew.responsavel_nome,
      responsavel_cpf: formatCPF(crew.responsavel_cpf),
      responsavel_telefone: crew.responsavel_telefone,
      responsavel_whatsapp: crew.responsavel_whatsapp,
      responsavel_email: crew.responsavel_email,
      capitao_nome: crew.capitao_nome,
      capitao_telefone: crew.capitao_telefone,
      capitao_email: crew.capitao_email,
      created_at: crew.created_at,
      teams: teams.map((t) => ({
        ...t,
        atletas: listaAtletas
          .filter((a) => a.team_id === t.id)
          .map((a) => ({
            id: a.id,
            nome: a.nome,
            cpf: formatCPF(a.cpf),
            nascimento: a.nascimento,
            telefone: a.telefone,
            email: a.email,
            instagram: a.instagram,
            camiseta: a.camiseta,
            emergencia_nome: a.emergencia_nome,
            emergencia_telefone: a.emergencia_telefone,
            tipo: a.tipo,
            ordem: a.ordem,
          })),
      })),
      consents: (consents ?? []) as { tipo: string; aceito_em: string }[],
    },
  });
}

/* ── PATCH ──────────────────────────────────────────────────────────────── */

export async function PATCH(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const supabase = getServiceSupabase();
  if (!supabase) return semSupabase();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const acao = typeof body.acao === "string" ? body.acao : "";
  if (!id || !acao) return NextResponse.json({ error: "Informe id e ação." }, { status: 400 });

  const eventId = await getEventId(supabase);

  const { data: atual, error: erroAtual } = await supabase
    .from(TB.crews)
    .select(COLUNAS_CREW)
    .eq("id", id)
    .maybeSingle();

  if (erroAtual) {
    console.error("[o-longao] admin patch load:", erroAtual.message);
    return NextResponse.json({ error: "Falha ao carregar a crew." }, { status: 500 });
  }
  if (!atual) return NextResponse.json({ error: "Crew não encontrada." }, { status: 404 });
  const antes = atual as unknown as CrewLinha;

  if (acao === "equipe") return patchEquipe(supabase, eventId, antes, body);
  if (acao === "publicar_resultados") return publicarResultados(supabase, eventId, antes, body);

  const patch: Record<string, unknown> = {};

  if (acao === "status") {
    const status = typeof body.status === "string" ? body.status : "";
    if (!STATUS_CREW.includes(status as CrewStatus)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    patch.status = status;
  } else if (acao === "notas") {
    patch.notas_internas = texto(body.notas_internas) ?? "";
  } else if (acao === "pagamento") {
    const pg = typeof body.pagamento_status === "string" ? body.pagamento_status : "";
    if (!STATUS_PAGAMENTO.includes(pg as PagamentoStatus)) {
      return NextResponse.json({ error: "Status de pagamento inválido." }, { status: 400 });
    }
    patch.pagamento_status = pg;
    patch.pagamento_marcado_em = pg === "pago" ? new Date().toISOString() : null;
  } else if (acao === "editar") {
    const campos = [
      "nome",
      "cidade",
      "instagram",
      "responsavel_telefone",
      "responsavel_whatsapp",
      "responsavel_email",
      "capitao_nome",
      "capitao_telefone",
      "capitao_email",
    ] as const;

    for (const campo of campos) {
      if (!(campo in body)) continue;
      const valor = texto(body[campo]);
      if (!valor) {
        return NextResponse.json({ error: `Preencha ${campo.replace(/_/g, " ")}.` }, { status: 400 });
      }
      if (campo.endsWith("email") && !valor.includes("@")) {
        return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
      }
      patch[campo] = campo === "instagram" ? valor.replace(/^@/, "").toLowerCase() : valor;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada para salvar." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }

  const { data: depois, error } = await supabase
    .from(TB.crews)
    .update(patch)
    .eq("id", id)
    .select(COLUNAS_CREW)
    .maybeSingle();

  if (error || !depois) {
    console.error("[o-longao] admin patch:", error?.message);
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
  }

  const diff: Record<string, unknown> = {};
  for (const chave of Object.keys(patch)) {
    diff[chave] = {
      de: (antes as unknown as Record<string, unknown>)[chave] ?? null,
      para: patch[chave],
    };
  }
  await auditar(supabase, eventId, `crew_${acao}`, TB.crews, id, { codigo: antes.codigo, diff });

  const registro = depois as unknown as CrewLinha;
  return NextResponse.json({
    ok: true,
    crew: { ...registro, responsavel_cpf: formatCPF(registro.responsavel_cpf) },
  });
}

async function patchEquipe(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  eventId: string | null,
  crew: CrewLinha,
  body: Record<string, unknown>
) {
  const teamId = typeof body.team_id === "string" ? body.team_id : "";
  if (!teamId) return NextResponse.json({ error: "Informe a equipe." }, { status: 400 });

  const { data: antesTeam } = await supabase
    .from(TB.teams)
    .select(COLUNAS_TEAM)
    .eq("id", teamId)
    .eq("crew_id", crew.id)
    .maybeSingle();

  if (!antesTeam) return NextResponse.json({ error: "Equipe não encontrada." }, { status: 404 });

  const patch: Record<string, unknown> = {};

  if ("status" in body) {
    const st = typeof body.status === "string" ? body.status : "";
    if (!STATUS_TEAM.includes(st as TeamStatus)) {
      return NextResponse.json({ error: "Status de equipe inválido." }, { status: 400 });
    }
    patch.status = st;
  }

  for (const campo of ["seletiva_km", "seletiva_posicao", "seletiva_bateria", "final_km", "final_posicao"] as const) {
    if (!(campo in body)) continue;
    const n = numeroOuNulo(body[campo]);
    if (n === undefined) {
      return NextResponse.json({ error: `Valor inválido em ${campo.replace(/_/g, " ")}.` }, { status: 400 });
    }
    patch[campo] = n;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para salvar." }, { status: 400 });
  }

  const { data: depois, error } = await supabase
    .from(TB.teams)
    .update(patch)
    .eq("id", teamId)
    .select(COLUNAS_TEAM)
    .maybeSingle();

  if (error || !depois) {
    console.error("[o-longao] admin equipe:", error?.message);
    return NextResponse.json({ error: "Falha ao salvar a equipe." }, { status: 500 });
  }

  const diff: Record<string, unknown> = {};
  for (const chave of Object.keys(patch)) {
    diff[chave] = {
      de: (antesTeam as unknown as Record<string, unknown>)[chave] ?? null,
      para: patch[chave],
    };
  }
  await auditar(supabase, eventId, "equipe_editar", TB.teams, teamId, {
    crew: crew.codigo,
    diff,
  });

  return NextResponse.json({ ok: true, team: depois as unknown as TeamLinha });
}

async function publicarResultados(
  supabase: NonNullable<ReturnType<typeof getServiceSupabase>>,
  eventId: string | null,
  crew: CrewLinha,
  body: Record<string, unknown>
) {
  const fase = typeof body.fase === "string" ? body.fase : "";
  const categoria = typeof body.categoria === "string" ? body.categoria : "";

  if (fase !== "seletiva" && fase !== "final") {
    return NextResponse.json({ error: "Fase inválida." }, { status: 400 });
  }
  if (!CATEGORIAS.includes(categoria as Categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!eventId) return NextResponse.json({ error: "Edição não encontrada." }, { status: 404 });

  const { data: equipes, error } = await supabase
    .from(TB.teams)
    .select(COLUNAS_TEAM)
    .eq("event_id", eventId)
    .eq("categoria", categoria);

  if (error) {
    console.error("[o-longao] admin publicar:", error.message);
    return NextResponse.json({ error: "Falha ao ler as equipes." }, { status: 500 });
  }

  const campoPos = fase === "seletiva" ? "seletiva_posicao" : "final_posicao";
  const campoKm = fase === "seletiva" ? "seletiva_km" : "final_km";
  const agora = new Date().toISOString();

  const linhas = ((equipes ?? []) as unknown as TeamLinha[])
    .filter((t) => {
      const pos = t[campoPos as "seletiva_posicao" | "final_posicao"];
      return typeof pos === "number" && pos > 0;
    })
    .map((t) => ({
      event_id: eventId,
      team_id: t.id,
      fase: fase as Fase,
      categoria,
      posicao: t[campoPos as "seletiva_posicao" | "final_posicao"] as number,
      km: t[campoKm as "seletiva_km" | "final_km"] ?? 0,
      publicado: true,
      publicado_em: agora,
    }));

  if (linhas.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma equipe dessa categoria tem posição preenchida." },
      { status: 400 }
    );
  }

  const { error: erroUpsert } = await supabase
    .from(TB.results)
    .upsert(linhas, { onConflict: "event_id,fase,categoria,posicao" });

  if (erroUpsert) {
    console.error("[o-longao] admin publicar upsert:", erroUpsert.message);
    return NextResponse.json({ error: "Falha ao publicar os resultados." }, { status: 500 });
  }

  await auditar(supabase, eventId, "publicar_resultados", TB.results, eventId, {
    origem: crew.codigo,
    fase,
    categoria,
    publicados: linhas.length,
  });

  return NextResponse.json({ ok: true, publicados: linhas.length, fase, categoria });
}

/* ── DELETE ─────────────────────────────────────────────────────────────── */

export async function DELETE(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const supabase = getServiceSupabase();
  if (!supabase) return semSupabase();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Informe o id da crew." }, { status: 400 });

  const { data, error } = await supabase
    .from(TB.crews)
    .select("id, codigo, nome, logo_path, event_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[o-longao] admin delete load:", error.message);
    return NextResponse.json({ error: "Falha ao carregar a crew." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Crew não encontrada." }, { status: 404 });

  const crew = data as { id: string; codigo: string; nome: string; logo_path: string | null; event_id: string };

  // Equipes, atletas e consentimentos caem por cascade.
  const { error: erroDelete } = await supabase.from(TB.crews).delete().eq("id", id);
  if (erroDelete) {
    console.error("[o-longao] admin delete:", erroDelete.message);
    return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });
  }

  if (crew.logo_path) {
    const { error: erroLogo } = await supabase.storage.from(BUCKET_LOGOS).remove([crew.logo_path]);
    if (erroLogo) console.error("[o-longao] admin delete logo:", erroLogo.message);
  }

  await auditar(supabase, crew.event_id, "crew_excluir", TB.crews, id, {
    codigo: crew.codigo,
    nome: crew.nome,
    logo_path: crew.logo_path,
  });

  console.warn(`[o-longao] crew excluída pelo painel: ${crew.codigo} (${crew.nome})`);

  return NextResponse.json({ ok: true });
}
