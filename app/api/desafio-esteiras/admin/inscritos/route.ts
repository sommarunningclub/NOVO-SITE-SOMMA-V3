import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import {
  canActOnUnit,
  escopoDaSessao,
  podeEditarCadastro,
  requireOperator,
} from "@/lib/desafio-esteiras/auth";
import { BUCKET_FOTOS, TABLE, fotoUrl, getVagasCategoria } from "@/lib/desafio-esteiras/db";
import {
  EVENT,
  FAIXAS_ETARIAS,
  UNITS,
  VAGAS_POR_CATEGORIA,
  faixaEtaria,
  getUnit,
  idadeNoEvento,
  vagasRestantes,
  vagasStatus,
} from "@/lib/desafio-esteiras/event.config";
import { edicaoCadastroSchema, adminInscricaoSchema, onlyDigits } from "@/lib/desafio-esteiras/schema";
import { formatCPF } from "@/lib/cpf";
import { generateTicketCode, generateTicketToken, ticketPertenceAUnidade } from "@/lib/desafio-esteiras/ticket";
import { getEventoId } from "@/lib/desafio-esteiras/gestao";
import { sendDesafioEsteirasTicketEmail } from "@/lib/emails/desafio-esteiras-ticket";

export const dynamic = "force-dynamic";

const MAX_CODE_TRIES = 5;

const COLUNAS =
  "id, created_at, full_name, cpf, birth_date, email, phone, unit_id, sexo, participacao, foto_path, ticket_code, ticket_token, status, checked_in_at, checked_in_by, origem, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referral, atualizado_em, evento_id, heat_number";

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
  heat_number: number | null;
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
  const escopoOperador = escopoDaSessao(auth.session);

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

  const brutos = (data ?? []) as unknown as Linha[];
  const todos = brutos.map(enriquecer);
  const cpfPorId = new Map(brutos.map((r) => [r.id, r.cpf]));

  const idFicha = sp.get("id");
  if (idFicha) {
    const row = todos.find((r) => r.id === idFicha);
    if (!row) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    return NextResponse.json({
      inscrito: { ...row, cpf: formatCPF(cpfPorId.get(row.id) ?? "") },
    });
  }

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
      const competindo = daUnidade.filter((r) => r.participacao === "competidor");
      const femininoN = competindo.filter((r) => r.sexo === "feminino").length;
      const masculinoN = competindo.filter((r) => r.sexo === "masculino").length;
      return {
        id: u.id,
        curto: u.curto,
        total: daUnidade.length,
        competidores,
        espectadores: daUnidade.length - competidores,
        checkins: daUnidade.filter((r) => r.status === "checked_in").length,
        feminino: femininoN,
        masculino: masculinoN,
        // A regra é por categoria: 12 vagas em cada, não um teto único da unidade.
        vagas: {
          feminino: {
            ocupadas: femininoN,
            total: VAGAS_POR_CATEGORIA,
            restantes: vagasRestantes(femininoN),
            status: vagasStatus(femininoN),
            baterias: [1, 2, 3].map((n) => ({
              n,
              ocupadas: daUnidade.filter((r) => r.sexo === "feminino" && r.heat_number === n).length,
            })),
            semBateria: daUnidade.filter((r) => r.sexo === "feminino" && !r.heat_number).length,
          },
          masculino: {
            ocupadas: masculinoN,
            total: VAGAS_POR_CATEGORIA,
            restantes: vagasRestantes(masculinoN),
            status: vagasStatus(masculinoN),
            baterias: [1, 2, 3].map((n) => ({
              n,
              ocupadas: daUnidade.filter((r) => r.sexo === "masculino" && r.heat_number === n).length,
            })),
            semBateria: daUnidade.filter((r) => r.sexo === "masculino" && !r.heat_number).length,
          },
        },
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

/* ── Editar / transferir / reenviar ──────────────────────────────────────── */

const statusValidos = ["confirmed", "checked_in", "cancelled"] as const;

type LinhaEdicao = {
  participacao: string;
  unit_id: string;
  status: string;
  checked_in_at: string | null;
  ticket_code: string;
  ticket_token: string;
  full_name: string;
  email: string;
};

function respostaCapacidade(message: string) {
  if (message.includes("DST_CATEGORIA_ESGOTADA")) {
    return NextResponse.json(
      { error: "Essa categoria já está com as 12 vagas preenchidas nesta unidade." },
      { status: 409 },
    );
  }
  if (message.includes("DST_BATERIA_CHEIA")) {
    return NextResponse.json(
      { error: "Essa bateria já tem 4 competidores. São 4 esteiras." },
      { status: 409 },
    );
  }
  return null;
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  let body: {
    id?: unknown;
    ids?: unknown;
    dados?: unknown;
    status?: unknown;
    heat_number?: unknown;
    transferir_para?: unknown;
    reenviar_email?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  /* O acesso de unidade marca presença e nada mais. Bloqueamos aqui, antes de
     qualquer escrita, em vez de espalhar a checagem por cada ramo abaixo: um
     ramo novo passaria despercebido, este ponto não. */
  if (!podeEditarCadastro(auth.session)) {
    const querMaisQueCheckin =
      body.dados !== undefined ||
      body.heat_number !== undefined ||
      body.transferir_para !== undefined ||
      body.reenviar_email !== undefined ||
      Array.isArray(body.ids);
    if (querMaisQueCheckin) {
      return NextResponse.json(
        { error: "Este acesso pode validar o ticket, mas não alterar o cadastro." },
        { status: 403 },
      );
    }
    // Sobra o status: e mesmo aí, só presença. Cancelar continua fora.
    const novoStatus = body.status === undefined ? null : String(body.status);
    if (novoStatus !== null && novoStatus !== "checked_in" && novoStatus !== "confirmed") {
      return NextResponse.json(
        { error: "Este acesso só marca presença. Para cancelar, fale com a organização." },
        { status: 403 },
      );
    }
  }

  const idsLote = Array.isArray(body.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 10).slice(0, 80)
    : [];

  if (idsLote.length > 0 && typeof body.transferir_para === "string") {
    if (auth.session.role !== "admin") {
      return NextResponse.json({ error: "Só o admin geral transfere em lote." }, { status: 403 });
    }
    const dest = getUnit(body.transferir_para);
    if (!dest) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });
    if (!canActOnUnit(auth.session, dest.id)) {
      return NextResponse.json({ error: "Você não pode transferir para outra unidade." }, { status: 403 });
    }

    const supabaseLote = getServiceSupabase();
    if (!supabaseLote) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

    const { data: linhas } = await supabaseLote
      .from(TABLE)
      .select("id, unit_id, status, checked_in_at, ticket_code, ticket_token, full_name, email")
      .in("id", idsLote);

    const movidos: string[] = [];
    const pulados: { nome: string; motivo: string }[] = [];
    const reenviar = body.reenviar_email === true;

    for (const bruto of (linhas ?? []) as (LinhaEdicao & { id: string })[]) {
      if (!canActOnUnit(auth.session, bruto.unit_id)) {
        pulados.push({ nome: bruto.full_name, motivo: "fora do seu escopo" });
        continue;
      }
      if (bruto.unit_id === dest.id) {
        pulados.push({ nome: bruto.full_name, motivo: "já está nessa unidade" });
        continue;
      }
      if (bruto.status === "checked_in") {
        pulados.push({ nome: bruto.full_name, motivo: "já fez check-in" });
        continue;
      }

      const atualizacao: Record<string, unknown> = {
        atualizado_em: new Date().toISOString(),
        unit_id: dest.id,
        heat_number: null,
      };
      let ticketCode = bruto.ticket_code;
      let falhou: { message: string; code?: string } | null = null;

      if (!ticketPertenceAUnidade(bruto.ticket_code, dest)) {
        for (let tentativa = 0; tentativa < MAX_CODE_TRIES; tentativa++) {
          const codigo = generateTicketCode(dest);
          const res = await supabaseLote.from(TABLE).update({ ...atualizacao, ticket_code: codigo }).eq("id", bruto.id);
          if (!res.error) {
            ticketCode = codigo;
            falhou = null;
            break;
          }
          falhou = res.error;
          if (res.error.code === "23505" && `${res.error.message} ${res.error.details ?? ""}`.includes("ticket_code")) {
            continue;
          }
          break;
        }
      } else {
        const res = await supabaseLote.from(TABLE).update(atualizacao).eq("id", bruto.id);
        falhou = res.error;
      }

      if (falhou) {
        pulados.push({
          nome: bruto.full_name,
          motivo: falhou.message.includes("DST_CATEGORIA_ESGOTADA")
            ? "categoria esgotada no destino"
            : falhou.message.includes("DST_BATERIA_CHEIA")
              ? "bateria cheia"
              : "não foi possível mover",
        });
        continue;
      }

      movidos.push(bruto.full_name);
      if (reenviar) {
        void sendDesafioEsteirasTicketEmail({
          nome: bruto.full_name,
          email: bruto.email,
          ticketCode,
          ticketToken: bruto.ticket_token,
          unit: dest,
        }).catch((err) => {
          console.error("[desafio-esteiras] e-mail lote:", err);
        });
      }
    }

    return NextResponse.json({
      ok: true,
      movidos: movidos.length,
      pulados,
      unidade: dest.id,
    });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Inscrição não informada." }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { data: atual } = await supabase
    .from(TABLE)
    .select("id, unit_id, status, checked_in_at, ticket_code, ticket_token, full_name, email, participacao")
    .eq("id", id)
    .maybeSingle();

  if (!atual) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });

  const linha = atual as LinhaEdicao;

  if (!canActOnUnit(auth.session, linha.unit_id)) {
    return NextResponse.json(
      {
        error: `Esta inscrição é da ${getUnit(linha.unit_id)?.nome ?? linha.unit_id}. Você só pode editar a sua unidade.`,
      },
      { status: 403 },
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
      atualizacao.checked_in_by =
        auth.session.role === "admin" ? "admin" : `${auth.session.role}:${auth.session.unitId}`;
    }
    if (novo !== "checked_in") {
      atualizacao.checked_in_at = null;
      atualizacao.checked_in_by = null;
    }
  }

  // Bateria: a organização distribui depois da inscrição. O limite de 4 por
  // bateria é garantido pelo trigger `dst_capacidade` no banco.
  if (body.heat_number !== undefined) {
    const n = body.heat_number;
    if (n !== null && ![1, 2, 3].includes(Number(n))) {
      return NextResponse.json({ error: "Bateria inválida (use 1, 2, 3 ou vazio)." }, { status: 400 });
    }
    // Bateria é lugar em esteira: quem só vai assistir não ocupa nenhuma.
    if (n !== null && linha.participacao !== "competidor") {
      return NextResponse.json(
        { error: "Só quem vai competir entra numa bateria." },
        { status: 409 }
      );
    }
    atualizacao.heat_number = n === null ? null : Number(n);
  }

  if (body.dados !== undefined) {
    const parsed = edicaoCadastroSchema.safeParse(body.dados);
    if (!parsed.success) {
      const primeiro = parsed.error.issues[0];
      return NextResponse.json(
        { error: primeiro?.message ?? "Dados inválidos.", campo: primeiro?.path?.[0] ?? null },
        { status: 400 },
      );
    }
    const d = parsed.data;

    if (!canActOnUnit(auth.session, d.unit_id)) {
      return NextResponse.json(
        { error: "Você não pode mover uma inscrição para outra unidade." },
        { status: 403 },
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

  if (typeof body.transferir_para === "string") {
    const dest = getUnit(body.transferir_para);
    if (!dest) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });
    if (!canActOnUnit(auth.session, dest.id)) {
      return NextResponse.json({ error: "Você não pode transferir para outra unidade." }, { status: 403 });
    }
    if (dest.id === linha.unit_id) {
      return NextResponse.json({ error: "O ticket já está nessa unidade." }, { status: 400 });
    }
    atualizacao.unit_id = dest.id;
  }

  const novaUnidadeId = (atualizacao.unit_id as string | undefined) ?? linha.unit_id;
  const destUnit = getUnit(novaUnidadeId);
  const mudouUnidade = novaUnidadeId !== linha.unit_id;

  if (mudouUnidade) {
    if (linha.status === "checked_in" && body.status === undefined) {
      return NextResponse.json(
        { error: "Desfaça o check-in antes de transferir o ticket para outra unidade." },
        { status: 409 },
      );
    }
    atualizacao.heat_number = null;
  }

  const precisaNovoCodigo = Boolean(destUnit && !ticketPertenceAUnidade(linha.ticket_code, destUnit));

  let ticketCode = linha.ticket_code;
  let error: { message: string; code?: string } | null = null;

  if (precisaNovoCodigo && destUnit) {
    for (let tentativa = 0; tentativa < MAX_CODE_TRIES; tentativa++) {
      const codigo = generateTicketCode(destUnit);
      const res = await supabase.from(TABLE).update({ ...atualizacao, ticket_code: codigo }).eq("id", id);
      if (!res.error) {
        ticketCode = codigo;
        error = null;
        break;
      }
      error = res.error;
      if (res.error.code === "23505" && `${res.error.message} ${res.error.details ?? ""}`.includes("ticket_code")) {
        continue;
      }
      break;
    }
  } else {
    const res = await supabase.from(TABLE).update(atualizacao).eq("id", id);
    error = res.error;
  }

  if (error) {
    const capacidade = respostaCapacidade(error.message);
    if (capacidade) return capacidade;
    console.error("[desafio-esteiras] editar inscrição:", error.message);
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  }

  const nomeFinal = (atualizacao.full_name as string | undefined) ?? linha.full_name;
  const emailFinal = (atualizacao.email as string | undefined) ?? linha.email;
  const unidadeFinal = destUnit ?? getUnit(linha.unit_id);

  if (body.reenviar_email === true && unidadeFinal) {
    void sendDesafioEsteirasTicketEmail({
      nome: nomeFinal,
      email: emailFinal,
      ticketCode,
      ticketToken: linha.ticket_token,
      unit: unidadeFinal,
    }).catch((err) => {
      console.error("[desafio-esteiras] Falha ao reenviar e-mail do ticket:", err);
    });
  }

  return NextResponse.json({
    ok: true,
    ticket_code: ticketCode,
    unit_id: novaUnidadeId,
    transferido: mudouUnidade,
  });
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
      { status: 403 },
    );
  }

  const ids = new Set<string>();
  const q = request.nextUrl.searchParams.get("id");
  if (q) ids.add(q);
  try {
    const body = (await request.json()) as { ids?: unknown; id?: unknown };
    if (typeof body.id === "string") ids.add(body.id);
    if (Array.isArray(body.ids)) {
      for (const x of body.ids) {
        if (typeof x === "string" && x.length > 10) ids.add(x);
      }
    }
  } catch {
    /* DELETE ?id= sem body continua válido */
  }

  const listaIds = [...ids].slice(0, 80);
  if (!listaIds.length) return NextResponse.json({ error: "Inscrição não informada." }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { data: alvos } = await supabase
    .from(TABLE)
    .select("id, cpf, evento_id, foto_path, full_name")
    .in("id", listaIds);

  const linhas = (alvos ?? []) as {
    id: string;
    cpf: string;
    evento_id: string | null;
    foto_path: string | null;
    full_name: string;
  }[];

  if (!linhas.length) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });

  const fotos = linhas.map((l) => l.foto_path).filter((p): p is string => Boolean(p));
  if (fotos.length) {
    const { error } = await supabase.storage.from(BUCKET_FOTOS).remove(fotos);
    if (error) console.warn("[desafio-esteiras] fotos não removidas:", error.message);
  }

  for (const linha of linhas) {
    if (!linha.evento_id) continue;
    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("evento_id", linha.evento_id)
      .eq("cpf", linha.cpf);
    if (error) console.warn("[desafio-esteiras] espelho não removido:", error.message);
  }

  const { error } = await supabase.from(TABLE).delete().in("id", linhas.map((l) => l.id));
  if (error) {
    console.error("[desafio-esteiras] excluir inscrição:", error.message);
    return NextResponse.json({ error: "Não foi possível excluir." }, { status: 500 });
  }

  const nomes = linhas.map((l) => l.full_name);
  console.warn(`[desafio-esteiras] ${nomes.length} inscrição(ões) excluída(s) por ${auth.session.nome}: ${nomes.join(", ")}`);
  return NextResponse.json({ ok: true, nome: nomes[0], nomes, excluídos: nomes.length });
}

/* ── Cadastrar pelo painel ───────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  if (!podeEditarCadastro(auth.session)) {
    return NextResponse.json(
      { error: "Este acesso acompanha e valida ticket, mas não cadastra." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const bruto = (body ?? {}) as { enviar_email?: unknown };
  const parsed = adminInscricaoSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos.", campo: first?.path?.[0] ?? null },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (!canActOnUnit(auth.session, data.unit_id)) {
    return NextResponse.json({ error: "Você só pode cadastrar na sua unidade." }, { status: 403 });
  }

  const unit = getUnit(data.unit_id);
  if (!unit) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });
  if (unit.status === "esgotada" || unit.status === "encerrada") {
    return NextResponse.json({ error: `As inscrições para a ${unit.nome} estão encerradas.` }, { status: 409 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  if (data.participacao === "competidor") {
    const vagas = await getVagasCategoria(unit.id, data.sexo);
    if (vagas && vagas.restantes <= 0) {
      const categoria = data.sexo === "feminino" ? "feminino" : "masculino";
      return NextResponse.json(
        {
          error: `As ${VAGAS_POR_CATEGORIA} vagas da categoria ${categoria} na ${unit.nome} acabaram. Cadastre como espectador ou escolha outra unidade.`,
        },
        { status: 409 },
      );
    }
  }

  const { data: existente } = await supabase
    .from(TABLE)
    .select("ticket_token, unit_id, status, full_name")
    .eq("cpf", data.cpf)
    .maybeSingle();

  if (existente) {
    const unidadeExistente = getUnit(existente.unit_id);
    return NextResponse.json(
      {
        error: `Este CPF já tem inscrição${unidadeExistente ? ` na ${unidadeExistente.nome}` : ""} (${existente.full_name}).`,
        ja_inscrito: true,
      },
      { status: 409 },
    );
  }

  const evento_id = await getEventoId();
  const ticket_token = generateTicketToken();
  const registro = {
    ...(evento_id ? { evento_id } : {}),
    full_name: data.full_name.replace(/\s+/g, " ").trim(),
    cpf: data.cpf,
    birth_date: data.birth_date,
    email: data.email,
    phone: data.phone,
    unit_id: unit.id,
    sexo: data.sexo,
    participacao: data.participacao,
    ticket_token,
    status: "confirmed" as const,
    origem: "admin",
    metadata: {
      evento: EVENT.nome,
      evento_data: EVENT.inicioISO,
      cadastrado_por: auth.session.nome,
      role: auth.session.role,
    },
  };

  const enviarEmail = bruto.enviar_email !== false;

  for (let tentativa = 0; tentativa < MAX_CODE_TRIES; tentativa++) {
    const ticket_code = generateTicketCode(unit);
    const { data: inserido, error } = await supabase
      .from(TABLE)
      .insert({ ...registro, ticket_code })
      .select("ticket_token, ticket_code")
      .single();

    if (!error && inserido) {
      if (enviarEmail) {
        void sendDesafioEsteirasTicketEmail({
          nome: registro.full_name,
          email: data.email,
          ticketCode: inserido.ticket_code,
          ticketToken: inserido.ticket_token,
          unit,
        }).catch((err) => {
          console.error("[desafio-esteiras] Falha ao enviar e-mail do ticket (admin):", err);
        });
      }

      return NextResponse.json({
        ok: true,
        ticket_token: inserido.ticket_token,
        ticket_code: inserido.ticket_code,
        unit_id: unit.id,
      });
    }

    const capacidade = error?.message ? respostaCapacidade(error.message) : null;
    if (capacidade) return capacidade;

    if (error?.code === "23505") {
      const detalhe = `${error.message} ${error.details ?? ""}`;
      if (detalhe.includes("cpf")) {
        return NextResponse.json({ error: "Este CPF já tem inscrição confirmada.", ja_inscrito: true }, { status: 409 });
      }
      if (detalhe.includes("ticket_code")) continue;
      return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 409 });
    }

    console.error("[desafio-esteiras] cadastro admin falhou:", error?.message, error?.code);
    return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }

  return NextResponse.json({ error: "Não foi possível gerar o ticket. Tente novamente." }, { status: 500 });
}
