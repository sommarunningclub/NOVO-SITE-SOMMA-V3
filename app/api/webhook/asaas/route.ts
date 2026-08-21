import { type NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { translateStatus, PAYMENT_EVENTS, RECEBIDAS } from "@/lib/asaas/status";
import type { SupabaseClient } from "@supabase/supabase-js";

// Espelho FIEL de somma-site-assessoria-esportiva/app/api/webhook/asaas/route.ts.
// CRÍTICO: o Asaas pausa a fila se receber 4xx/5xx — sempre retornar 200 (exceto 401),
// logando erros em webhook_events.status / processed_at.
//
// ATENÇÃO (segurança): a origem é fail-open — se ASAAS_WEBHOOK_TOKEN não estiver
// setado, a validação é pulada. Mantido igual à origem; em produção DEFINA o token.
type AsaasPayment = {
  id: string;
  customer?: string;
  value?: number;
  netValue?: number;
  dueDate?: string;
  paymentDate?: string;
  status?: string;
  billingType?: string;
  description?: string;
  deleted?: boolean;
};

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase off" }, { status: 200 });
  }

  type AsaasAuthorization = { id?: string; status?: string; customerId?: string };
  let body: {
    id?: string;
    event?: string;
    payment?: AsaasPayment | string;
    authorization?: AsaasAuthorization;
    pixAutomaticAuthorization?: string;
    paymentInstruction?: { id?: string; payment?: string; authorization?: AsaasAuthorization };
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 200 });
  }

  // 1. Validar token (header asaas-access-token)
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (expectedToken) {
    const token = request.headers.get("asaas-access-token");
    if (token !== expectedToken) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("[webhook/asaas] ASAAS_WEBHOOK_TOKEN não setado — webhook aberto (fail-open).");
  }

  const { id: rawEventId, event: eventType } = body;
  if (!eventType) {
    return NextResponse.json({ ok: false, error: "Missing event type" }, { status: 200 });
  }

  // Nos eventos de cobrança o Asaas manda o objeto completo; em alguns fluxos
  // de Pix Automático manda só o id da cobrança como string.
  const payment = typeof body.payment === "object" ? body.payment : undefined;

  // Pix Automático: a documentação publica DOIS formatos para os eventos de
  // autorização (objeto aninhado `authorization` ou campo plano
  // `pixAutomaticAuthorization`), e o exemplo aninhado nem traz `id` na raiz.
  // Aceitar os dois evita descartar evento sem registro.
  const authorization = body.authorization ?? body.paymentInstruction?.authorization;
  const authorizationId =
    authorization?.id ??
    (typeof body.pixAutomaticAuthorization === "string" ? body.pixAutomaticAuthorization : null);

  // Sem id de evento não dá para deduplicar pelo id: deriva uma chave estável
  // do que o payload traz, para o log continuar idempotente. A cobrança/
  // instrução entra na chave porque o MESMO tipo de evento se repete na mesma
  // autorização a cada ciclo (e a cada retentativa) — só a autorização não
  // distingue um mês do outro.
  const instructionId = body.paymentInstruction?.id ?? null;
  const relatedPaymentId =
    (typeof body.paymentInstruction?.payment === "string" ? body.paymentInstruction.payment : null) ??
    (typeof body.payment === "string" ? body.payment : null) ??
    (typeof body.payment === "object" ? body.payment?.id ?? null : null);

  const derivedKey = [authorizationId, instructionId, relatedPaymentId].filter(Boolean).join(":");
  const eventId = rawEventId ?? (derivedKey ? `${eventType}:${derivedKey}` : null);

  if (!eventId) {
    console.warn("[webhook/asaas] Evento sem id identificável:", eventType);
    return NextResponse.json({ ok: false, error: "Missing event id" }, { status: 200 });
  }

  // 2. Log idempotente (event_id é UNIQUE)
  await supabase.from("webhook_events").upsert(
    {
      event_id: eventId,
      event_type: eventType,
      payment_id: payment?.id ?? relatedPaymentId,
      customer_id: payment?.customer ?? authorization?.customerId ?? null,
      status: "received",
      payload: body,
    },
    { onConflict: "event_id", ignoreDuplicates: true }
  );

  if (eventType.startsWith("PIX_AUTOMATIC_RECURRING")) {
    // Ainda não há processamento próprio: o registro acima já permite auditar
    // ativação, recusa e cancelamento das autorizações no Supabase.
    console.log("[webhook/asaas] Pix Automático:", eventType, authorizationId ?? "(sem id)");
  }

  // 3. Ignorar eventos não-payment ou sem payload
  if (!PAYMENT_EVENTS.has(eventType) || !payment) {
    await markProcessed(supabase, eventId, "skipped");
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    if (eventType === "PAYMENT_DELETED") {
      await supabase
        .from("payments")
        .update({
          status: "DELETED",
          situacao_display: "Excluída",
          deleted: true,
          ultimo_evento: eventType,
          updated_at: new Date().toISOString(),
        })
        .eq("asaas_id", payment.id);
    } else {
      await supabase.from("payments").upsert(
        {
          asaas_id: payment.id,
          customer_asaas_id: payment.customer,
          value: payment.value,
          net_value: payment.netValue ?? null,
          due_date: payment.dueDate,
          payment_date: payment.paymentDate ?? null,
          status: payment.status,
          billing_type: payment.billingType,
          description: payment.description ?? null,
          situacao_display: translateStatus(payment.status as string),
          ultimo_evento: eventType,
          deleted: payment.deleted ?? false,
          raw_data: payment as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "asaas_id" }
      );
    }

    // 4. Recalcular totais do aluno
    if (payment.customer) {
      await recalcAlunoTotais(supabase, payment.customer);
    }

    await markProcessed(supabase, eventId, "processed");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook/asaas] erro:", msg);
    await markProcessed(supabase, eventId, "error", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

async function markProcessed(
  supabase: SupabaseClient,
  eventId: string,
  status: "processed" | "skipped" | "error",
  errorMsg?: string
) {
  const update: Record<string, unknown> = {
    status,
    processed_at: new Date().toISOString(),
  };
  if (errorMsg) {
    const { data } = await supabase
      .from("webhook_events")
      .select("payload")
      .eq("event_id", eventId)
      .single();
    const payload = (data?.payload ?? {}) as Record<string, unknown>;
    update.payload = { ...payload, _error: errorMsg };
  }
  await supabase.from("webhook_events").update(update).eq("event_id", eventId);
}

async function recalcAlunoTotais(supabase: SupabaseClient, asaasCustomerId: string) {
  const { data: cobrancas } = await supabase
    .from("payments")
    .select("status, value")
    .eq("customer_asaas_id", asaasCustomerId)
    .eq("deleted", false)
    .neq("status", "REFUNDED");

  if (!cobrancas) return;

  const totalRecebido = cobrancas
    .filter((c) => RECEBIDAS.has(c.status))
    .reduce((s, c) => s + Number(c.value ?? 0), 0);
  const totalPendente = cobrancas
    .filter((c) => c.status === "PENDING")
    .reduce((s, c) => s + Number(c.value ?? 0), 0);
  const totalVencido = cobrancas
    .filter((c) => c.status === "OVERDUE")
    .reduce((s, c) => s + Number(c.value ?? 0), 0);
  const statusPagamento =
    totalVencido > 0 ? "Vencido" : totalPendente > 0 ? "Pendente" : "Em dia";

  await supabase
    .from("asaas_customers_sync")
    .update({
      total_recebido: totalRecebido,
      total_pendente: totalPendente,
      total_vencido: totalVencido,
      status_pagamento: statusPagamento,
      updated_at: new Date().toISOString(),
    })
    .eq("asaas_id", asaasCustomerId);
}
