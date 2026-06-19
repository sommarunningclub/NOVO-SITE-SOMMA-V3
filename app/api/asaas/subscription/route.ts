import { type NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      creditCard,
      creditCardHolderInfo,
      remoteIp,
      description,
      // Plano mensal: recorrência
      type, // "recurring" | "installment" | "pix"
      value,
      // Plano parcelado
      installmentCount,
      installmentValue,
      // PIX à vista
      pixValue,
    } = body

    const today = new Date().toISOString().split("T")[0]
    const headers = {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY || "",
    }

    // ─── MENSAL: Assinatura recorrente via /subscriptions ────────────────
    if (type === "recurring") {
      const payload = {
        customer: customerId,
        billingType: "CREDIT_CARD",
        value,
        cycle: "MONTHLY",
        description,
        creditCard,
        creditCardHolderInfo,
        remoteIp,
      }

      console.log("[Asaas] Criando assinatura recorrente:", { customerId, value })

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
      return NextResponse.json({ subscription: data, message: "Assinatura ativada com sucesso" })
    }

    // ─── SEMESTRAL / ANUAL: Cobrança parcelada via /payments ────────────
    if (type === "installment") {
      const payload = {
        customer: customerId,
        billingType: "CREDIT_CARD",
        installmentCount,
        installmentValue,
        dueDate: today,
        description,
        creditCard,
        creditCardHolderInfo,
        remoteIp,
      }

      console.log("[Asaas] Criando cobrança parcelada:", {
        customerId,
        installmentCount,
        installmentValue,
        total: installmentCount * installmentValue,
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
      return NextResponse.json({ payment: data, message: "Pagamento processado com sucesso" })
    }

    // ─── PIX À VISTA: Cobrança única via /payments ─────────────────────────
    if (type === "pix") {
      const payload = {
        customer: customerId,
        billingType: "PIX",
        value: pixValue,
        dueDate: today,
        description,
      }

      console.log("[Asaas] Criando cobrança PIX:", { customerId, pixValue })

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
      return NextResponse.json({ payment: data, message: "Cobrança PIX gerada com sucesso" })
    }

    return NextResponse.json({ error: "Tipo de pagamento inválido" }, { status: 400 })
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
