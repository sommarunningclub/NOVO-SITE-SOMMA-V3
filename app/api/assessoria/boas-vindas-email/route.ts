import { NextRequest, NextResponse } from "next/server";
import { sendAssessoriaBoasVindasEmail } from "@/lib/emails/assessoria-boas-vindas";
import { getServiceSupabase } from "@/lib/supabase";
import { RECEBIDAS } from "@/lib/asaas/status";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const ASAAS_API_URL = "https://api.asaas.com/v3";

/** Planos que o checkout vende — barra texto arbitrário no corpo do e-mail. */
const PLANOS_VALIDOS = new Set(["Mensal", "Semestral", "Anual"]);

type AsaasCustomer = { id?: string; name?: string; email?: string };

async function asaasGet<T>(path: string, apiKey: string): Promise<T | null> {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    headers: { "Content-Type": "application/json", access_token: apiKey },
  });
  if (!res.ok) {
    console.warn(`[assessoria/boas-vindas-email] Asaas ${path} → ${res.status}`);
    return null;
  }
  return (await res.json()) as T;
}

/**
 * Confirma a compra no Asaas e devolve o id do cliente dono dela.
 * Cobrança avulsa/parcelada precisa estar recebida; assinatura, ativa — o Asaas
 * só ativa depois de autorizar o cartão, e exigir a 1ª parcela confirmada
 * atrasaria o e-mail do cliente legítimo.
 */
async function resolveCustomerId(
  apiKey: string,
  paymentId?: string,
  subscriptionId?: string
): Promise<string | null> {
  if (paymentId) {
    const payment = await asaasGet<{ status?: string; customer?: string }>(
      `/payments/${encodeURIComponent(paymentId)}`,
      apiKey
    );
    if (!payment?.customer || !RECEBIDAS.has(payment.status ?? "")) return null;
    return payment.customer;
  }

  const subscription = await asaasGet<{ status?: string; customer?: string }>(
    `/subscriptions/${encodeURIComponent(subscriptionId!)}`,
    apiKey
  );
  if (!subscription?.customer || subscription.status !== "ACTIVE") return null;
  return subscription.customer;
}

export async function POST(request: NextRequest) {
  try {
    // A prova de compra já barra e-mail para estranho; a cota impede que alguém
    // use a rota para bombardear um cliente legítimo repetindo o mesmo paymentId.
    const ip = clientIp(request);
    const limite = await rateLimit(`assessoria:boas-vindas:${ip}`, 10, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { paymentId, subscriptionId, plano, professor } = body;

    if (!!paymentId === !!subscriptionId) {
      return NextResponse.json(
        { error: "Informe paymentId ou subscriptionId." },
        { status: 400 }
      );
    }

    if (!PLANOS_VALIDOS.has(String(plano))) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      console.error("[assessoria/boas-vindas-email] ASAAS_API_KEY ausente — envio recusado.");
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }

    // 1. Prova de compra: sem pagamento confirmado no Asaas, não há e-mail.
    const customerId = await resolveCustomerId(
      apiKey,
      paymentId ? String(paymentId) : undefined,
      subscriptionId ? String(subscriptionId) : undefined
    );
    if (!customerId) {
      return NextResponse.json({ error: "Pagamento não confirmado." }, { status: 403 });
    }

    // 2. Destinatário vem do cadastro no Asaas, nunca do corpo da requisição.
    const customer = await asaasGet<AsaasCustomer>(
      `/customers/${encodeURIComponent(customerId)}`,
      apiKey
    );
    if (!customer?.email) {
      console.error("[assessoria/boas-vindas-email] Cliente sem e-mail no Asaas:", customerId);
      return NextResponse.json({ error: "Falha ao localizar o cliente." }, { status: 502 });
    }

    // 3. Professor (e o WhatsApp dele) resolvidos na base, não no cliente.
    const supabase = getServiceSupabase();
    if (!supabase) {
      console.error("[assessoria/boas-vindas-email] Supabase indisponível.");
      return NextResponse.json({ error: "Falha ao validar o professor." }, { status: 502 });
    }

    const { data: professores, error: professorError } = await supabase
      .from("professores_curriculo_assessoria")
      .select("nome, telefone");

    if (professorError) {
      console.error("[assessoria/boas-vindas-email] Erro ao buscar professores:", professorError);
      return NextResponse.json({ error: "Falha ao validar o professor." }, { status: 502 });
    }

    const professorRow = (professores ?? []).find(
      (p) => (p.nome ?? "").trim().toLowerCase() === String(professor ?? "").trim().toLowerCase()
    );
    if (!professorRow) {
      return NextResponse.json({ error: "Professor inválido." }, { status: 400 });
    }

    const result = await sendAssessoriaBoasVindasEmail({
      nome: customer.name ?? "",
      email: customer.email,
      plano: String(plano),
      professor: professorRow.nome,
      professorWhatsapp: professorRow.telefone ?? null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Falha ao enviar e-mail." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    console.error("[assessoria/boas-vindas-email] Erro:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
