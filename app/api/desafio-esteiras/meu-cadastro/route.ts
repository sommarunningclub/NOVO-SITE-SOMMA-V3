import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { TABLE, fotoUrl } from "@/lib/desafio-esteiras/db";
import { acessoCadastroSchema, edicaoCadastroSchema } from "@/lib/desafio-esteiras/schema";
import { clientIp, rateLimit } from "@/lib/desafio-esteiras/rate-limit";
import { getUnit, inscricoesAbertas } from "@/lib/desafio-esteiras/event.config";
import {
  criarTokenEdicao,
  lerTokenEdicao,
  removerFoto,
} from "@/lib/desafio-esteiras/perfil";

export const dynamic = "force-dynamic";

const CAMPOS =
  "id, full_name, cpf, birth_date, email, phone, unit_id, sexo, participacao, foto_path, ticket_code, ticket_token, status";

/**
 * Acesso ao próprio cadastro: CPF + data de nascimento.
 *
 * O CPF sozinho não prova identidade — circula em nota fiscal, cadastro de loja
 * e vazamento. Pedir a data de nascimento junto eleva a barreira sem exigir
 * senha. Somado a isso: 5 tentativas por IP a cada 10 minutos, e a resposta de
 * erro é sempre a mesma, para não servir de oráculo de "este CPF existe".
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limite = await rateLimit(`dst:meu-cadastro:${ip}`, 5, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = acessoCadastroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const { data } = await supabase
    .from(TABLE)
    .select(CAMPOS)
    .eq("cpf", parsed.data.cpf)
    .eq("birth_date", parsed.data.birth_date)
    .neq("status", "cancelled")
    .maybeSingle();

  // Mensagem única de propósito: CPF certo com data errada e CPF inexistente
  // respondem igual, então a tela não confirma se um CPF está cadastrado.
  if (!data) {
    return NextResponse.json(
      { error: "Não encontramos uma inscrição com esses dados. Confira o CPF e a data de nascimento." },
      { status: 404 }
    );
  }

  const r = data as unknown as Record<string, string | null>;

  return NextResponse.json({
    token: criarTokenEdicao(r.id as string),
    cadastro: {
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      unit_id: r.unit_id,
      sexo: r.sexo,
      participacao: r.participacao,
      foto_url: fotoUrl(r.foto_path),
      ticket_code: r.ticket_code,
      ticket_token: r.ticket_token,
    },
  });
}

/**
 * Salva as alterações. Exige o token curto devolvido pelo POST — assim a
 * escrita não aceita CPF avulso e a sessão de edição expira sozinha.
 */
export async function PATCH(request: NextRequest) {
  const ip = clientIp(request);
  const limite = await rateLimit(`dst:editar:${ip}`, 20, 600);
  if (!limite.ok) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde." }, { status: 429 });
  }

  let body: { token?: unknown; dados?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const id = lerTokenEdicao(typeof body.token === "string" ? body.token : null);
  if (!id) {
    return NextResponse.json(
      { error: "Sua sessão de edição expirou. Informe CPF e data de nascimento de novo." },
      { status: 401 }
    );
  }

  const parsed = edicaoCadastroSchema.safeParse(body.dados);
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    return NextResponse.json(
      { error: primeiro?.message ?? "Dados inválidos.", campo: primeiro?.path?.[0] ?? null },
      { status: 400 }
    );
  }
  const dados = parsed.data;

  const unidade = getUnit(dados.unit_id);
  if (!unidade) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });
  if (unidade.status === "esgotada" || unidade.status === "encerrada") {
    return NextResponse.json(
      { error: `A ${unidade.nome} não está recebendo mais inscrições.` },
      { status: 409 }
    );
  }

  // Trocar de unidade depois das inscrições encerradas mexeria na logística da
  // noite; os demais dados continuam editáveis.
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const { data: atual } = await supabase.from(TABLE).select("unit_id, foto_path").eq("id", id).maybeSingle();
  if (!atual) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });

  const trocouUnidade = (atual as { unit_id: string }).unit_id !== dados.unit_id;
  if (trocouUnidade && !inscricoesAbertas()) {
    return NextResponse.json(
      { error: "As inscrições foram encerradas. Não é mais possível trocar de unidade." },
      { status: 409 }
    );
  }

  const fotoAtual = (atual as { foto_path: string | null }).foto_path;
  if (dados.remover_foto && fotoAtual) await removerFoto(fotoAtual);

  const { error } = await supabase
    .from(TABLE)
    .update({
      full_name: dados.full_name,
      email: dados.email,
      phone: dados.phone,
      unit_id: dados.unit_id,
      sexo: dados.sexo,
      participacao: dados.participacao,
      ...(dados.remover_foto ? { foto_path: null } : {}),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[desafio-esteiras] falha ao editar cadastro:", error.message);
    return NextResponse.json({ error: "Não foi possível salvar. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, trocou_unidade: trocouUnidade });
}
