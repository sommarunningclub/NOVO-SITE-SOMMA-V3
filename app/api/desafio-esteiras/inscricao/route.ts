import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { registrationSchema } from "@/lib/desafio-esteiras/schema";
import { generateTicketCode, generateTicketToken } from "@/lib/desafio-esteiras/ticket";
import { TABLE } from "@/lib/desafio-esteiras/db";
import { clientIp, rateLimit } from "@/lib/desafio-esteiras/rate-limit";
import { getEventoId } from "@/lib/desafio-esteiras/gestao";
import {
  EVENT,
  getUnit,
  inscricoesAbertas,
  unitStatusFor,
} from "@/lib/desafio-esteiras/event.config";

export const dynamic = "force-dynamic";

/** Tentativas de gerar um ticket_code que não colida com um já existente. */
const MAX_CODE_TRIES = 5;

export async function POST(request: NextRequest) {
  // 1. Freio de rajada — 5 tentativas por IP a cada 10 minutos.
  const ip = clientIp(request);
  const limit = rateLimit(`dst:inscricao:${ip}`, 5, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // 2. O evento aceita inscrição agora?
  if (!inscricoesAbertas()) {
    return NextResponse.json(
      { error: "As inscrições para o Desafio das Esteiras não estão abertas." },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // 3. Validação (a mesma que roda no cliente — aqui é a que vale).
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: first?.message ?? "Dados inválidos.",
        campo: first?.path?.[0] ?? null,
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Honeypot preenchido = bot. Respondemos 200 sem gravar para não dar sinal.
  if (data.website) {
    return NextResponse.json({ ok: true, ticket_token: null }, { status: 200 });
  }

  const unit = getUnit(data.unit_id);
  if (!unit) {
    return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });
  }
  if (unit.status === "esgotada" || unit.status === "encerrada") {
    return NextResponse.json(
      { error: `As inscrições para a ${unit.nome} estão encerradas.` },
      { status: 409 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Serviço indisponível no momento. Tente novamente em instantes." },
      { status: 503 }
    );
  }

  // 4. Capacidade da unidade — só bloqueia quando a organização definiu um limite.
  if (unit.capacidade !== null) {
    const { count } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("unit_id", unit.id)
      .in("status", ["confirmed", "checked_in"]);

    if (unitStatusFor(unit, count ?? 0) === "esgotada") {
      return NextResponse.json(
        { error: `A ${unit.nome} está com as vagas esgotadas. Escolha outra unidade.` },
        { status: 409 }
      );
    }
  }

  // 5. Duplicidade por CPF — checagem amigável antes do INSERT.
  //    O índice UNIQUE no banco é quem realmente garante (corrida entre requests).
  const { data: existente } = await supabase
    .from(TABLE)
    .select("ticket_token, unit_id, status")
    .eq("cpf", data.cpf)
    .maybeSingle();

  if (existente) {
    const unidadeExistente = getUnit(existente.unit_id);
    return NextResponse.json(
      {
        error: `Este CPF já tem inscrição confirmada${
          unidadeExistente ? ` na ${unidadeExistente.nome}` : ""
        }.`,
        ja_inscrito: true,
        ticket_token: existente.ticket_token,
      },
      { status: 409 }
    );
  }

  // 6. Grava.
  //    `evento_id` amarra a inscrição ao evento no painel da gestão; um trigger
  //    no banco espelha a linha em `checkins`. A chave só entra no INSERT
  //    quando existe de fato — sem a integração aplicada, nem a coluna existe,
  //    e mandá-la derrubaria a inscrição.
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
    ticket_token,
    status: "confirmed" as const,
    origem: "lp-desafio-esteiras",
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
    utm_content: data.utm_content ?? null,
    utm_term: data.utm_term ?? null,
    referral: data.referral ?? null,
    metadata: {
      evento: EVENT.nome,
      evento_data: EVENT.inicioISO,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  };

  for (let tentativa = 0; tentativa < MAX_CODE_TRIES; tentativa++) {
    const ticket_code = generateTicketCode(unit);
    const { data: inserido, error } = await supabase
      .from(TABLE)
      .insert({ ...registro, ticket_code })
      .select("ticket_token, ticket_code")
      .single();

    if (!error && inserido) {
      return NextResponse.json({
        ok: true,
        ticket_token: inserido.ticket_token,
        ticket_code: inserido.ticket_code,
        unit_id: unit.id,
      });
    }

    if (error?.code === "23505") {
      // 23505 = unique_violation. Descobrir qual índice estourou.
      const detalhe = `${error.message} ${error.details ?? ""}`;
      if (detalhe.includes("cpf")) {
        return NextResponse.json(
          { error: "Este CPF já tem inscrição confirmada.", ja_inscrito: true },
          { status: 409 }
        );
      }
      if (detalhe.includes("ticket_code")) continue; // colisão de código: sorteia outro
      return NextResponse.json({ error: "Não foi possível concluir a inscrição." }, { status: 409 });
    }

    console.error("[desafio-esteiras] insert falhou:", error?.message, error?.code);
    return NextResponse.json(
      { error: "Não foi possível concluir a inscrição. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Não foi possível gerar seu ticket. Tente novamente." },
    { status: 500 }
  );
}
