import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { requireCheckoutSession, type CheckoutSession } from "@/lib/asaas/checkout-session"
import { precificar } from "@/lib/asaas/checkout-pricing"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { RECEBIDAS } from "@/lib/asaas/status"

const ASAAS_API_URL = "https://api.asaas.com/v3"

/**
 * Registra o aluno na gestão da assessoria.
 *
 * A rota era anônima e aceitava `status_pagamento` do corpo, com `"Pago"` como
 * padrão: qualquer um inseria um aluno pago na base da gestão. Agora exige a
 * sessão de checkout e confirma no Asaas que existe cobrança de verdade por
 * trás dela. Plano, valor, professor, forma de pagamento e status são
 * derivados no servidor; do corpo vêm apenas os dados pessoais e o endereço,
 * que são do próprio cliente.
 */

type StatusPagamento = "Pago" | "Aguardando PIX"

/**
 * Prova de compra. Cobrança recebida (ou assinatura ativa) vira "Pago";
 * PIX emitido e ainda não pago vira "Aguardando PIX"; qualquer outra
 * combinação não entra na base.
 */
async function confirmarCobranca(
  session: CheckoutSession,
  apiKey: string
): Promise<StatusPagamento | null> {
  const headers = { "Content-Type": "application/json", access_token: apiKey }

  if (session.subscriptionId) {
    const res = await fetch(
      `${ASAAS_API_URL}/subscriptions/${encodeURIComponent(session.subscriptionId)}`,
      { headers }
    )
    if (!res.ok) return null
    const sub = (await res.json()) as { status?: string; customer?: string }
    if (sub.customer !== session.customerId) return null
    return sub.status === "ACTIVE" ? "Pago" : null
  }

  const paymentId = (session.paymentIds ?? [])[0]
  if (!paymentId) return null

  const res = await fetch(`${ASAAS_API_URL}/payments/${encodeURIComponent(paymentId)}`, { headers })
  if (!res.ok) return null
  const payment = (await res.json()) as { status?: string; customer?: string; billingType?: string }
  if (payment.customer !== session.customerId) return null

  if (RECEBIDAS.has(payment.status ?? "")) return "Pago"
  if (payment.billingType === "PIX" && payment.status === "PENDING") return "Aguardando PIX"
  return null
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`gestao:cliente:${ip}`, 10, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      )
    }

    const body = await request.json()

    const auth = requireCheckoutSession(request, body)
    if (!auth.ok) return auth.response
    const { session } = auth

    const apiKey = process.env.ASAAS_API_KEY
    if (!apiKey) {
      console.error("[supabase/cliente] ASAAS_API_KEY ausente — sem como confirmar a compra.")
      return NextResponse.json({ error: "Configuração ausente" }, { status: 503 })
    }

    const status = await confirmarCobranca(session, apiKey)
    if (!status) {
      return NextResponse.json({ error: "Pagamento não confirmado." }, { status: 403 })
    }

    const precificacao = await precificar(session)
    if (!precificacao.ok) {
      return NextResponse.json({ error: precificacao.error }, { status: precificacao.status })
    }
    const { charge } = precificacao

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json({ error: "Configuração ausente" }, { status: 500 })
    }

    const { nome, email, telefone, cpf, rua, numero, bairro, cidade, cep, estado } = body
    const cpfLimpo = String(cpf ?? "").replace(/\D/g, "") || null

    const today = new Date().toISOString().split("T")[0]
    const diaVencimento = new Date().getDate()

    // Idempotência simples: a mesma pessoa não entra duas vezes no mesmo dia se
    // o navegador reenviar (retry de rede, duplo clique, aba reaberta).
    if (cpfLimpo) {
      const { data: jaExiste } = await supabase
        .from("gestao-clientes-assessoria")
        .select("id")
        .eq("cpf", cpfLimpo)
        .eq("data_entrada", today)
        .maybeSingle()
      if (jaExiste) {
        return NextResponse.json({ success: true })
      }
    }

    const { error } = await supabase
      .from("gestao-clientes-assessoria")
      .insert({
        nome,
        email,
        telefone: String(telefone ?? "").replace(/\D/g, "") || null,
        cpf: cpfLimpo,
        rua: rua || null,
        numero: numero || null,
        bairro: bairro || null,
        cidade: cidade || null,
        cep: String(cep ?? "").replace(/\D/g, "") || null,
        estado: estado || null,
        veste: charge.shirtSize,
        professor: charge.professor || null,
        tipo_plano: charge.plan.name,
        // Na gestão `valor` é a mensalidade do plano. Com cupom de primeiro mês
        // a mensalidade continua sendo a cheia — o desconto foi só na 1ª cobrança.
        valor: charge.method === "pix" ? charge.totalCobrado : charge.mensalidade,
        forma_pagamento: charge.method === "pix" ? "PIX" : "Cartão de Crédito",
        status,
        data_entrada: today,
        dia_vencimento: diaVencimento,
        contrato_assinado: false,
      })

    if (error) {
      console.error("[Supabase] Erro ao inserir cliente:", error)
      return NextResponse.json({ error: "Erro ao registrar cliente" }, { status: 500 })
    }

    // Resposta mínima de propósito: id e dados pessoais não precisam voltar.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Supabase] Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
