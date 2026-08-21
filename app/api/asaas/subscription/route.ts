import { type NextRequest, NextResponse } from "next/server"
import {
  issueCheckoutToken,
  requireCheckoutSession,
  type CheckoutSession,
} from "@/lib/asaas/checkout-session"
import { precificar } from "@/lib/asaas/checkout-pricing"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

function friendlyError(data: any): string {
  const code = data.errors?.[0]?.code
  if (code === "invalid_creditCard" || code === "invalid_creditCardNumber")
    return "Pagamento não autorizado, verifique seu cartão."
  if (code === "invalid_creditCardHolderInfo")
    return "Dados do titular do cartão inválidos."
  if (code === "invalid_value")
    return "Valor inválido para o pagamento."
  return data.errors?.[0]?.description || "Erro ao processar pagamento"
}

/** Renova o crachá guardando a cobrança criada, para o PIX poder ser consultado. */
function tokenComCobranca(
  session: CheckoutSession,
  extra: { paymentId?: string; subscriptionId?: string }
): string {
  return issueCheckoutToken({
    ...session,
    paymentIds: [...(session.paymentIds ?? []), ...(extra.paymentId ? [extra.paymentId] : [])],
    subscriptionId: extra.subscriptionId ?? session.subscriptionId,
  })
}

/**
 * Cria a cobrança no Asaas.
 *
 * O corpo traz cartão e sessão — nada mais. Valor, tipo de cobrança, nº de
 * parcelas, descrição e IP saem do servidor: do token de checkout, do catálogo
 * de planos e dos headers da requisição, nessa ordem. `value`, `pixValue`,
 * `installmentValue`, `valueAfterFirstCycle` e `remoteIp` deixaram de ser
 * aceitos no corpo justamente porque eram o caminho para cobrar o que quisesse.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`asaas:cobranca:${ip}`, 10, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas de pagamento. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      )
    }

    if (!ASAAS_API_KEY) {
      console.error("[asaas/subscription] ASAAS_API_KEY ausente.")
      return NextResponse.json({ error: "Checkout indisponível." }, { status: 503 })
    }

    const body = await request.json()

    const auth = requireCheckoutSession(request, body)
    if (!auth.ok) return auth.response
    const { session } = auth

    const precificacao = await precificar(session)
    if (!precificacao.ok) {
      return NextResponse.json({ error: precificacao.error }, { status: precificacao.status })
    }
    const { charge } = precificacao

    const { creditCard, creditCardHolderInfo } = body
    const today = new Date().toISOString().split("T")[0]
    const headers = {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
    }

    // ─── MENSAL: Assinatura recorrente via /subscriptions ────────────────
    if (charge.method === "card" && charge.plan.type === "recurring") {
      const payload = {
        customer: session.customerId,
        billingType: "CREDIT_CARD",
        value: charge.value,
        cycle: "MONTHLY",
        description: charge.description,
        creditCard,
        creditCardHolderInfo,
        remoteIp: ip,
      }

      console.log("[Asaas] Criando assinatura recorrente:", {
        customerId: session.customerId,
        value: charge.value,
      })

      const res = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[Asaas] Erro na assinatura:", data)
        return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
      }

      console.log("[Asaas] Assinatura criada:", data.id)

      // Cupom de primeira mensalidade (ex.: ANALU): a assinatura nasce com o valor
      // com desconto — a 1ª cobrança já foi gerada e capturada no cartão acima — e
      // logo em seguida volta ao valor cheio, valendo do 2º ciclo em diante.
      // updatePendingPayments=false para não reprecificar cobrança já emitida.
      let fullValueRestored = true
      const valorCheio = charge.valueAfterFirstCycle
      if (typeof valorCheio === "number" && typeof charge.value === "number" && valorCheio > charge.value) {
        const restoreRes = await fetch(`${ASAAS_API_URL}/subscriptions/${data.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ value: valorCheio, updatePendingPayments: false }),
        })

        if (!restoreRes.ok) {
          fullValueRestored = false
          // Não derruba o checkout: o cliente já pagou. Mas a assinatura ficou com o
          // valor promocional travado e precisa ser corrigida no painel do Asaas.
          console.error(
            "[Asaas] ATENÇÃO: assinatura",
            data.id,
            `ficou em R$ ${charge.value} — corrigir para R$ ${valorCheio} no painel.`,
            await restoreRes.text()
          )
        } else {
          console.log("[Asaas] Valor cheio restaurado na assinatura:", data.id, valorCheio)
        }
      }

      return NextResponse.json({
        subscription: { id: data.id, status: data.status, value: data.value },
        fullValueRestored,
        checkoutToken: tokenComCobranca(session, { subscriptionId: data.id }),
        message: "Assinatura ativada com sucesso",
      })
    }

    // ─── SEMESTRAL / ANUAL no cartão: cobrança parcelada via /payments ───
    if (charge.method === "card") {
      const payload = {
        customer: session.customerId,
        billingType: "CREDIT_CARD",
        installmentCount: charge.installmentCount,
        installmentValue: charge.installmentValue,
        dueDate: today,
        description: charge.description,
        creditCard,
        creditCardHolderInfo,
        remoteIp: ip,
      }

      console.log("[Asaas] Criando cobrança parcelada:", {
        customerId: session.customerId,
        installmentCount: charge.installmentCount,
        installmentValue: charge.installmentValue,
        total: charge.totalCobrado,
      })

      const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[Asaas] Erro na cobrança parcelada:", data)
        return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
      }

      console.log("[Asaas] Cobrança parcelada criada:", data.id)
      return NextResponse.json({
        payment: { id: data.id, status: data.status, value: data.value },
        checkoutToken: tokenComCobranca(session, { paymentId: data.id }),
        message: "Pagamento processado com sucesso",
      })
    }

    // ─── PIX À VISTA: Cobrança única via /payments ─────────────────────────
    const payload = {
      customer: session.customerId,
      billingType: "PIX",
      value: charge.pixValue,
      dueDate: today,
      description: charge.description,
    }

    console.log("[Asaas] Criando cobrança PIX:", {
      customerId: session.customerId,
      pixValue: charge.pixValue,
    })

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("[Asaas] Erro na cobrança PIX:", data)
      return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
    }

    console.log("[Asaas] Cobrança PIX criada:", data.id)
    return NextResponse.json({
      payment: { id: data.id, status: data.status, value: data.value },
      checkoutToken: tokenComCobranca(session, { paymentId: data.id }),
      message: "Cobrança PIX gerada com sucesso",
    })
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
