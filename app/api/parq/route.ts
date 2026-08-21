import { type NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { PARQ_IDS, computeApto } from "@/lib/parq";
import { requireCheckoutSession } from "@/lib/asaas/checkout-session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const ASAAS_API_URL = "https://api.asaas.com/v3";

/**
 * Respostas do Par-Q, gravadas no cadastro do aluno em
 * "gestao-clientes-assessoria".
 *
 * O formulário só existe na tela de sucesso do checkout, então a rota exige a
 * mesma sessão assinada do resto da compra. E o CPF do cadastro a atualizar vem
 * do cliente no Asaas, não do corpo: antes bastava saber o CPF de alguém para
 * sobrescrever a anamnese daquela pessoa — inclusive marcando "apto" quem não é.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`parq:${ip}`, 10, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { answers, observacoes } = body as {
      answers?: Record<string, unknown>;
      observacoes?: string;
    };

    const auth = requireCheckoutSession(request, body);
    if (!auth.ok) return auth.response;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Respostas inválidas." }, { status: 400 });
    }

    // Normaliza para boolean e garante que todas as perguntas foram respondidas.
    const normalized: Record<string, boolean> = {};
    for (const id of PARQ_IDS) {
      const v = answers[id];
      if (v !== true && v !== false) {
        return NextResponse.json(
          { error: "Responda todas as perguntas do Par-Q." },
          { status: 400 }
        );
      }
      normalized[id] = v;
    }

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      console.error("[parq] ASAAS_API_KEY ausente — sem como identificar o aluno.");
      return NextResponse.json({ error: "Configuração ausente." }, { status: 503 });
    }

    const customerRes = await fetch(
      `${ASAAS_API_URL}/customers/${encodeURIComponent(auth.session.customerId)}`,
      { headers: { "Content-Type": "application/json", access_token: apiKey } }
    );
    if (!customerRes.ok) {
      console.error("[parq] Cliente do Asaas não encontrado:", auth.session.customerId);
      return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
    }
    const customer = (await customerRes.json()) as { cpfCnpj?: string };
    const cpfDigits = String(customer.cpfCnpj ?? "").replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.warn("[parq] Supabase não configurado. Respostas não persistidas.");
      return NextResponse.json({ success: true, persisted: false });
    }

    const cpfFormatted = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const payload = {
      ...normalized,
      parq_observacoes: observacoes?.trim() || null,
      parq_apto: computeApto(normalized),
      parq_respondido_em:
        new Date()
          .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
          .replace(" ", "T") + "-03:00",
    };

    // Atualiza pelo CPF (compara contra dígitos e formatado).
    const { data, error } = await supabase
      .from("gestao-clientes-assessoria")
      .update(payload)
      .in("cpf", [cpfDigits, cpfFormatted])
      .select("id");

    if (error) {
      console.error("[parq] Erro ao atualizar cadastro:", error);
      return NextResponse.json(
        { error: "Não foi possível salvar suas respostas agora." },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Cadastro não encontrado para este CPF." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, persisted: true, apto: payload.parq_apto });
  } catch (err) {
    console.error("[parq] Erro interno:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
