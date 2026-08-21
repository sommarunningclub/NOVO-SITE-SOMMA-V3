import { type NextRequest, NextResponse } from "next/server"
import { requireCheckoutSession, sessaoCobreCobranca } from "@/lib/asaas/checkout-session"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

/**
 * Status de uma cobrança desta compra — o que a tela de PIX consulta enquanto
 * espera a confirmação.
 *
 * A cota é generosa de propósito: a tela pergunta a cada 3s por até 20 minutos.
 * O teto corta abuso sem atrapalhar quem está pagando.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`asaas:status:${ip}`, 120, 60)
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde alguns instantes." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      )
    }

    if (!ASAAS_API_KEY) {
      return NextResponse.json({ error: "Checkout indisponível." }, { status: 503 })
    }

    const auth = requireCheckoutSession(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID é obrigatório" }, { status: 400 })
    }
    if (!sessaoCobreCobranca(auth.session, paymentId)) {
      return NextResponse.json({ error: "Cobrança não pertence a esta compra." }, { status: 403 })
    }

    const response = await fetch(
      `${ASAAS_API_URL}/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("[Asaas] Error getting payment status:", data)
      return NextResponse.json(
        { error: data.errors?.[0]?.description || "Erro ao buscar status" },
        { status: response.status },
      )
    }

    return NextResponse.json({
      id: data.id,
      status: data.status, // PENDING, RECEIVED, CONFIRMED, OVERDUE, EXPIRED, REFUNDED, etc.
      value: data.value,
      billingType: data.billingType,
      paid: data.status === "RECEIVED" || data.status === "CONFIRMED",
    })
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
