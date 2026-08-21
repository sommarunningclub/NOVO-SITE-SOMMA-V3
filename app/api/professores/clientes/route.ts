import { type NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireCheckoutSession } from "@/lib/asaas/checkout-session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Espelha v0-sistema-somma-de-gestao-l7/app/api/professores/clientes/route.ts:
// vincula o aluno pagante ao professor em `professor_clients` (base do repasse R$50/aluno).
//
// SEGURANÇA: a rota era anônima e aceitava `professor_id` e `asaas_customer_id`
// arbitrários — dava para pendurar alunos inventados em qualquer professor e
// inflar o repasse. Agora exige a sessão de checkout: o professor e o cliente
// vêm do token assinado, não do corpo.
//
// PENDÊNCIA DE VALIDAÇÃO: o checkout do NOVO seleciona o professor por NOME
// (tabela professores_curriculo_assessoria), enquanto professor_clients.professor_id
// referencia a tabela `professors`. Aqui resolvemos professor_id por nome (ilike).
// Se os nomes não baterem entre as tabelas, o vínculo é ignorado (não bloqueia o checkout).
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`professores:clientes:${ip}`, 10, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const body = await request.json();

    const auth = requireCheckoutSession(request, body);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const { customer_name, customer_email, customer_cpf_cnpj } = body as Record<
      string,
      string | undefined
    >;

    if (!customer_name) {
      return NextResponse.json({ error: "customer_name é obrigatório" }, { status: 400 });
    }
    // Vínculo é base de repasse: só existe se existir cobrança por trás dele.
    if (!session.subscriptionId && (session.paymentIds ?? []).length === 0) {
      return NextResponse.json({ error: "Compra não iniciada." }, { status: 403 });
    }
    if (!session.professor) {
      return NextResponse.json({ success: true, linked: false, reason: "sem-professor" });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, linked: false, reason: "supabase-off" });
    }

    // Professor e cliente saem do token, nunca do corpo.
    const { data: prof } = await supabase
      .from("professors")
      .select("id")
      .ilike("name", session.professor)
      .limit(1)
      .maybeSingle();
    const profId = prof?.id ?? null;

    if (!profId) {
      // Sem professor mapeável: não cria vínculo, mas não falha o checkout.
      return NextResponse.json({ success: true, linked: false, reason: "professor-not-found" });
    }

    const asaasCustomerId = session.customerId;

    // Reativação se já existir vínculo (professor_id, asaas_customer_id)
    const { data: existing } = await supabase
      .from("professor_clients")
      .select("id, status")
      .eq("professor_id", profId)
      .eq("asaas_customer_id", asaasCustomerId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json({ success: true, linked: true, reactivated: false });
      }
      await supabase
        .from("professor_clients")
        .update({
          status: "active",
          customer_name,
          customer_email: customer_email ?? "",
          customer_cpf_cnpj: customer_cpf_cnpj?.replace(/\D/g, "") ?? null,
          tag: "alunoprofessor",
          linked_at: new Date().toISOString(),
          unlinked_at: null,
        })
        .eq("id", existing.id);
      return NextResponse.json({ success: true, linked: true, reactivated: true });
    }

    const { error } = await supabase.from("professor_clients").insert({
      professor_id: profId,
      asaas_customer_id: asaasCustomerId,
      customer_name,
      customer_email: customer_email ?? "",
      customer_cpf_cnpj: customer_cpf_cnpj?.replace(/\D/g, "") ?? null,
      status: "active",
      tag: "alunoprofessor",
      linked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[professores/clientes] Erro ao vincular:", error);
      return NextResponse.json({ success: false, error: "Erro ao vincular" }, { status: 400 });
    }
    return NextResponse.json({ success: true, linked: true });
  } catch (err) {
    console.error("[professores/clientes] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
