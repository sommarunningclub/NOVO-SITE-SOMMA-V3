import { type NextRequest, NextResponse } from "next/server"
import { calcularDesconto, resolveCoupon } from "@/lib/checkout/cupons"
import { getPlan } from "@/lib/checkout/planos"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/**
 * Confere um cupom para a TELA mostrar o desconto.
 *
 * Nada do que sai daqui é usado para cobrar: quem cria a cobrança recalcula o
 * mesmo desconto a partir do código do cupom (`lib/asaas/checkout-pricing.ts`).
 * O valor base também não vem mais na query — é o preço do plano no catálogo do
 * servidor, então não dá para forjar um desconto inflando o valor de origem.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`checkout:cupom:${ip}`, 30, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { valid: false, error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")?.toUpperCase().trim()
    const professor = searchParams.get("professor")?.trim() || ""

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Código do cupom não informado" },
        { status: 400 }
      )
    }

    const plan = getPlan(searchParams.get("planId"))
    if (!plan) {
      return NextResponse.json({ valid: false, error: "Plano inválido" }, { status: 400 })
    }

    const lookup = await resolveCoupon(code, {
      professor: plan.professorFixo ?? professor,
      planType: plan.type,
    })
    if (!lookup.ok) {
      return NextResponse.json({ valid: false, error: lookup.error }, { status: lookup.status })
    }

    const calculo = calcularDesconto(plan.price, lookup.coupon)
    if ("error" in calculo) {
      return NextResponse.json({ valid: false, error: calculo.error }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code,
        type: lookup.coupon.type,
        value: lookup.coupon.value,
        description: lookup.coupon.description,
        firstMonthOnly: lookup.coupon.firstMonthOnly === true,
      },
      calculation: calculo,
    })
  } catch (error) {
    console.error("[validate-coupon] Error:", error)
    return NextResponse.json(
      { valid: false, error: "Erro ao validar cupom" },
      { status: 500 }
    )
  }
}
