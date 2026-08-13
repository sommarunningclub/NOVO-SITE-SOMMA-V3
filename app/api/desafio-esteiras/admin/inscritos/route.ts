import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { canActOnUnit, requireOperator } from "@/lib/desafio-esteiras/auth";
import { BUCKET_FOTOS, TABLE, fotoUrl } from "@/lib/desafio-esteiras/db";
import {
  FAIXAS_ETARIAS,
  UNITS,
  faixaEtaria,
  getUnit,
  idadeNoEvento,
  vagasCompetidorStatus,
  vagasRestantes,
} from "@/lib/desafio-esteiras/event.config";
import { edicaoCadastroSchema, onlyDigits } from "@/lib/desafio-esteiras/schema";

export const dynamic = "force-dynamic";

const COLUNAS =
  "id, created_at, full_name, cpf, birth_date, email, phone, unit_id, sexo, participacao, foto_path, ticket_code, ticket_token, status, checked_in_at, checked_in_by, origem, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referral, atualizado_em, evento_id";

/** O CPF é a chave da inscrição e não é editável — mostramos só o suficiente para conferir. */
function maskCpf(cpf: string): string {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return "—";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

/**
 * As colunas de `COLUNAS`, explícitas.
 *
 * Sem index signature de propósito: com `[k: string]: unknown` o spread em
 * `enriquecer` perde os campos concretos e o TypeScript deixa de checar quem
 * usa `full_name`, `phone` e afins.
 */
interface Linha {
  id: string;
  created_at: string;
  full_name: string;
  cpf: string;
  birth_date: string | null;
  email: string;
  phone: string;
  unit_id: string;
  sexo: string | null;
  participacao: string;
  foto_path: string | null;
  ticket_code: string;
  ticket_token: string;
  status: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  origem: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referral: string | null;
  atualizado_em: string | null;
  evento_id: string | null;
}

function enriquecer(r: Linha) {
  const idade = idadeNoEvento(r.birth_date);
  return {
    ...r,
    cpf: undefined,
    cpf_mascarado: maskCpf(r.cpf),
    foto_url: fotoUrl(r.foto_path),
    tem_foto: Boolean(r.foto_path),
    idade,
    faixa_etaria: faixaEtaria(idade),
  };
}

/* ── Listar / buscar ─────────────────────────────────────────────────────── */

/**
 * Inscritos para a tela de gestão, com tudo o que o painel precisa mostrar e
 * filtrar: idade calculada na data do evento, faixa etária, categoria, UTMs
 * completas e situação da foto.
 *
 * O CPF continua mascarado — identifica a inscrição, mas não é alterável nem
 * precisa ser lido inteiro. Operador de unidade só enxerga a própria unidade.
 */
export async function GET(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const escopoOperador = auth.session.role === "operador" ? auth.session.unitId : null;

  // Puxamos o conjunto que o operador pode ver e filtramos em memória: são
  // centenas de linhas, e assim os totais do resumo continuam batendo com os
  // filtros aplicados sem uma segunda consulta.
  let query = supabase.from(TABLE).select(COLUNAS).order("created_at", { ascending: false }).limit(2000);
  if (escopoOperador) query = query.eq("unit_id", escopoOperador);

  const { data, error } = await query;
  if (error) {
    console.error("[desafio-esteiras] listar inscritos:", error.message);
    return NextResponse.json({ error: "Não foi possível carregar." }, { status: 500 });
  }

  const todos = ((data ?? []) as unknown as Linha[]).map(enriquecer);

  /* Resumo — sempre sobre o escopo inteiro, não sobre o filtro atual, para o
     operador ter o retrato da unidade mesmo enquanto procura alguém. */
  const validos = todos.filter((r) => r.status !== "cancelled");
  const unidadesVisiveis = escopoOperador ? UNITS.filter((u) => u.id === escopoOperador) : UNITS;

  const idades = validos.map((r) => r.idade).filter((n): n is number => n !== null);
  const resumo = {
    total: validos.length,
    cancelados: todos.length - validos.length,
    competidores: validos.filter((r) => r.participacao === "competidor").length,
    espectadores: validos.filter((r) => r.participacao === "espectador").length,
    checkins: validos.filter((r) => r.status === "checked_in").length,
    comFoto: validos.filter((r) => r.tem_foto).length,
    semCategoria: validos.filter((r) => !r.sexo).length,
    porSexo: {
      feminino: validos.filter((r) => r.sexo === "feminino").length,
      masculino: validos.filter((r) => r.sexo === "masculino").length,
    },
    idadeMedia: idades.length ? Math.round(idades.reduce((s, n) => s + n, 0) / idades.length) : null,
    idadeMin: idades.length ? Math.min(...idades) : null,
    idadeMax: idades.length ? Math.max(...idades) : null,
    porFaixa: FAIXAS_ETARIAS.map((f) => ({
      id: f.id,
      nome: f.nome,
      n: validos.filter((r) => r.faixa_etaria === f.id).length,
    })),
    porUnidade: unidadesVisiveis.map((u) => {
      const daUnidade = validos.filter((r) => r.unit_id === u.id);
      const competidores = daUnidade.filter((r) => r.participacao === "competidor").length;
      return {
        id: u.id,
        curto: u.curto,
        total: daUnidade.length,
        competidores,
        espectadores: daUnidade.length - competidores,
        checkins: daUnidade.filter((r) => r.status === "checked_in").length,
        feminino: daUnidade.filter((r) => r.sexo === "feminino").length,
        masculino: daUnidade.filter((r) => r.sexo === "masculino").length,
        vagasCompetidores: u.vagasCompetidores,
        vagasRestantes: vagasRestantes(u, competidores),
        vagasStatus: vagasCompetidorStatus(u, competidores),
      };
    }),
    porOrigem: Object.entries(
      validos.reduce<Record<string, number>>((acc, r) => {
        const k = r.utm_source || "(direto)";
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([fonte, n]) => ({ fonte, n }))
      .sort((a, b) => b.n - a.n),
  };

  /* Filtros da listagem */
  const unidade = sp.get("unidade");
  const status = sp.get("status");
  const sexo = sp.get("sexo");
  const participacao = sp.get("participacao");
  const faixa = sp.get("faixa");
  const foto = sp.get("foto");
  const ordem = sp.get("ordem") ?? "recentes";

  const digitos = onlyDigits(q);
  const termo = q.toLowerCase();

  let lista = todos.filter((r) => {
    if (unidade && r.unit_id !== unidade) return false;
    if (status && r.status !== status) return false;
    if (sexo === "sem" ? Boolean(r.sexo) : sexo && r.sexo !== sexo) return false;
    if (participacao && r.participacao !== participacao) return false;
    if (faixa && r.faixa_etaria !== faixa) return false;
    if (foto === "com" && !r.tem_foto) return false;
    if (foto === "sem" && r.tem_foto) return false;

    if (q.length >= 3) {
      const alvo = [
        String(r.full_name ?? "").toLowerCase(),
        String(r.email ?? "").toLowerCase(),
        String(r.ticket_code ?? "").toLowerCase(),
      ].join(" ");
      const bateTexto = alvo.includes(termo);
      const bateNumero =
        digitos.length >= 4 &&
        (onlyDigits(String(r.phone ?? "")).includes(digitos) || onlyDigits(r.cpf ?? "").includes(digitos));
      if (!bateTexto && !bateNumero) return false;
    }
    return true;
  });

  lista = lista.sort((a, b) => {
    if (ordem === "nome") return String(a.full_name).localeCompare(String(b.full_name), "pt-BR");
    if (ordem === "idade") return (b.idade ?? -1) - (a.idade ?? -1);
    if (ordem === "idade-asc") return (a.idade ?? 999) - (b.idade ?? 999);
    if (ordem === "antigos") return a.created_at.localeCompare(b.created_at);
    return b.created_at.localeCompare(a.created_at);
  });

  return NextResponse.json({
    inscritos: lista.slice(0, 500),
    truncado: lista.length > 500,
    filtrados: lista.length,
    resumo,
    escopo: escopoOperador ?? "todas",
    role: auth.session.role,
  });
}

/* ── Editar ──────────────────────────────────────────────────────────────── */

const statusValidos = ["confirmed", "checked_in", "cancelled"] as const;

export async function PATCH(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  let body: { id?: unknown; dados?: unknown; status?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Inscrição não informada." }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { data: atual } = await supabase
    .from(TABLE)
    .select("id, unit_id, status, checked_in_at")
    .eq("id", id)
    .maybeSingle();

  if (!atual) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });

  const linha = atual as { unit_id: string; status: string; checked_in_at: string | null };

  if (!canActOnUnit(auth.session, linha.unit_id)) {
    return NextResponse.json(
      {
        error: `Esta inscrição é da ${getUnit(linha.unit_id)?.nome ?? linha.unit_id}. Você só pode editar a sua unidade.`,
      },
      { status: 403 }
    );
  }

  const atualizacao: Record<string, unknown> = { atualizado_em: new Date().toISOString() };

  if (body.status !== undefined) {
    const novo = String(body.status);
    if (!statusValidos.includes(novo as (typeof statusValidos)[number])) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    atualizacao.status = novo;
    if (novo === "checked_in" && !linha.checked_in_at) {
      atualizacao.checked_in_at = new Date().toISOString();
      atualizacao.checked_in_by = auth.session.role === "admin" ? "admin" : `operador:${auth.session.unitId}`;
    }
    if (novo !== "checked_in") {
      atualizacao.checked_in_at = null;
      atualizacao.checked_in_by = null;
    }
  }

  if (body.dados !== undefined) {
    const parsed = edicaoCadastroSchema.safeParse(body.dados);
    if (!parsed.success) {
      const primeiro = parsed.error.issues[0];
      return NextResponse.json(
        { error: primeiro?.message ?? "Dados inválidos.", campo: primeiro?.path?.[0] ?? null },
        { status: 400 }
      );
    }
    const d = parsed.data;

    if (!canActOnUnit(auth.session, d.unit_id)) {
      return NextResponse.json(
        { error: "Você não pode mover uma inscrição para outra unidade." },
        { status: 403 }
      );
    }

    Object.assign(atualizacao, {
      full_name: d.full_name.replace(/\s+/g, " ").trim(),
      email: d.email,
      phone: d.phone,
      unit_id: d.unit_id,
      sexo: d.sexo,
      participacao: d.participacao,
    });

    if (d.remover_foto) {
      const { data: comFoto } = await supabase.from(TABLE).select("foto_path").eq("id", id).maybeSingle();
      const path = (comFoto as { foto_path: string | null } | null)?.foto_path;
      if (path) {
        await supabase.storage.from(BUCKET_FOTOS).remove([path]);
        atualizacao.foto_path = null;
      }
    }
  }

  const { error } = await supabase.from(TABLE).update(atualizacao).eq("id", id);
  if (error) {
    console.error("[desafio-esteiras] editar inscrição:", error.message);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/* ── Excluir ─────────────────────────────────────────────────────────────── */

/**
 * Exclusão definitiva.
 *
 * Só o admin geral apaga — operador de unidade cancela, não destrói. A remoção
 * é em cascata manual porque o trigger de espelho só cobre INSERT/UPDATE:
 * apagamos a linha em `checkins` e a foto no bucket, senão sobrariam órfãos no
 * painel da gestão e no storage.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  if (auth.session.role !== "admin") {
    return NextResponse.json(
      { error: "Só o admin geral pode excluir. Use 'Cancelar' para tirar a pessoa do evento." },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Inscrição não informada." }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { data: alvo } = await supabase
    .from(TABLE)
    .select("id, cpf, evento_id, foto_path, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!alvo) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  const linha = alvo as { cpf: string; evento_id: string | null; foto_path: string | null; full_name: string };

  if (linha.evento_id) {
    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("evento_id", linha.evento_id)
      .eq("cpf", linha.cpf);
    if (error) console.warn("[desafio-esteiras] espelho não removido:", error.message);
  }

  if (linha.foto_path) {
    const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([linha.foto_path]);
    if (error) console.warn("[desafio-esteiras] foto não removida:", error.message);
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error("[desafio-esteiras] excluir inscrição:", error.message);
    return NextResponse.json({ error: "Não foi possível excluir." }, { status: 500 });
  }

  console.warn(`[desafio-esteiras] inscrição excluída por ${auth.session.nome}: ${linha.full_name}`);
  return NextResponse.json({ ok: true, nome: linha.full_name });
}
