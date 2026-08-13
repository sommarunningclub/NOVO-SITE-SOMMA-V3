import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { canActOnUnit, requireOperator } from "@/lib/desafio-esteiras/auth";
import { BUCKET_FOTOS, TABLE, fotoUrl } from "@/lib/desafio-esteiras/db";
import { getUnit } from "@/lib/desafio-esteiras/event.config";
import { edicaoCadastroSchema, onlyDigits } from "@/lib/desafio-esteiras/schema";

export const dynamic = "force-dynamic";

const COLUNAS =
  "id, created_at, full_name, cpf, birth_date, email, phone, unit_id, sexo, participacao, foto_path, ticket_code, ticket_token, status, checked_in_at, checked_in_by, origem, utm_source, atualizado_em, evento_id";

/** O CPF é a chave da inscrição e não é editável — mostramos só o suficiente para conferir. */
function maskCpf(cpf: string): string {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return "—";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

interface Linha {
  id: string;
  cpf: string;
  foto_path: string | null;
  unit_id: string;
  [k: string]: unknown;
}

const publico = (r: Linha) => ({
  ...r,
  cpf: undefined,
  cpf_mascarado: maskCpf(r.cpf),
  foto_url: fotoUrl(r.foto_path),
});

/* ── Listar / buscar ─────────────────────────────────────────────────────── */

/**
 * Inscritos para a tela de gestão do admin.
 *
 * Diferente de `/admin/buscar` (que é o balcão de check-in e devolve o mínimo),
 * aqui vêm os campos editáveis. O CPF continua mascarado: ele identifica a
 * inscrição mas não é alterável, então não há razão para exibi-lo inteiro.
 * Operador de unidade só enxerga a própria unidade.
 */
export async function GET(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const unidadeFiltro = request.nextUrl.searchParams.get("unidade");
  const statusFiltro = request.nextUrl.searchParams.get("status");

  let query = supabase.from(TABLE).select(COLUNAS).order("created_at", { ascending: false }).limit(300);

  if (auth.session.role === "operador" && auth.session.unitId) {
    query = query.eq("unit_id", auth.session.unitId);
  } else if (unidadeFiltro && getUnit(unidadeFiltro)) {
    query = query.eq("unit_id", unidadeFiltro);
  }

  if (statusFiltro && ["confirmed", "checked_in", "cancelled"].includes(statusFiltro)) {
    query = query.eq("status", statusFiltro);
  }

  if (q.length >= 3) {
    const digitos = onlyDigits(q);
    const termo = q.replace(/[%,()]/g, " ").trim();
    if (digitos.length >= 10) {
      query = query.or(`cpf.eq.${digitos},phone.eq.${digitos}`);
    } else if (/^DST/i.test(q)) {
      query = query.ilike("ticket_code", `%${termo}%`);
    } else {
      query = query.or(`full_name.ilike.%${termo}%,email.ilike.%${termo}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("[desafio-esteiras] listar inscritos:", error.message);
    return NextResponse.json({ error: "Não foi possível carregar." }, { status: 500 });
  }

  return NextResponse.json({
    inscritos: ((data ?? []) as unknown as Linha[]).map(publico),
    escopo: auth.session.role === "operador" ? auth.session.unitId : "todas",
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

  // Operador não mexe em inscrição de outra unidade — nem para ler, nem para editar.
  if (!canActOnUnit(auth.session, linha.unit_id)) {
    return NextResponse.json(
      { error: `Esta inscrição é da ${getUnit(linha.unit_id)?.nome ?? linha.unit_id}. Você só pode editar a sua unidade.` },
      { status: 403 }
    );
  }

  const atualizacao: Record<string, unknown> = { atualizado_em: new Date().toISOString() };

  // Mudança só de status (cancelar / reativar / desfazer check-in).
  if (body.status !== undefined) {
    const novo = String(body.status);
    if (!statusValidos.includes(novo as (typeof statusValidos)[number])) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    atualizacao.status = novo;
    // O CHECK do banco exige carimbo quando o status é checked_in, e limpar o
    // carimbo ao sair desse estado evita "check-in fantasma" no relatório.
    if (novo === "checked_in" && !linha.checked_in_at) {
      atualizacao.checked_in_at = new Date().toISOString();
      atualizacao.checked_in_by = auth.session.role === "admin" ? "admin" : `operador:${auth.session.unitId}`;
    }
    if (novo !== "checked_in") {
      atualizacao.checked_in_at = null;
      atualizacao.checked_in_by = null;
    }
  }

  // Edição dos dados do participante.
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

    // Um operador não pode empurrar alguém para outra unidade (sairia do escopo dele).
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
 *
 * Para o uso do dia a dia, cancelar (PATCH status=cancelled) é o caminho:
 * some das contagens e da grade, mas o histórico continua.
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

  // 1. Espelho na gestão (o trigger não cobre DELETE).
  if (linha.evento_id) {
    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("evento_id", linha.evento_id)
      .eq("cpf", linha.cpf);
    if (error) console.warn("[desafio-esteiras] espelho não removido:", error.message);
  }

  // 2. Foto no bucket.
  if (linha.foto_path) {
    const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([linha.foto_path]);
    if (error) console.warn("[desafio-esteiras] foto não removida:", error.message);
  }

  // 3. A inscrição.
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error("[desafio-esteiras] excluir inscrição:", error.message);
    return NextResponse.json({ error: "Não foi possível excluir." }, { status: 500 });
  }

  console.warn(`[desafio-esteiras] inscrição excluída por ${auth.session.nome}: ${linha.full_name}`);
  return NextResponse.json({ ok: true, nome: linha.full_name });
}
