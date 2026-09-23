import { NextResponse } from "next/server"
import { calcularDesconto, resolverCupom } from "@/lib/checkout/cupons-servidor"

/**
 * Valida um cupom para a tela do checkout.
 *
 * A tabela de cupons e a consulta ao DB moraram aqui até 22/09/2026; agora
 * vivem em `lib/checkout/cupons-servidor.ts`, porque a rota que cobra precisa
 * das mesmas regras para refazer a conta do desconto no servidor.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")?.toUpperCase().trim()
    const valueParam = searchParams.get("value")
    const value = valueParam ? parseFloat(valueParam) : 0
    const professor = searchParams.get("professor")?.trim() || ""
    const planType = searchParams.get("planType")?.trim() || ""

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Código do cupom não informado" },
        { status: 400 }
      )
    }

    if (!value || value <= 0) {
      return NextResponse.json(
        { valid: false, error: "Valor inválido" },
        { status: 400 }
      )
    }

    // Mesma resolução que a rota de cobrança usa — tabela `coupons` da GESTÃO
    // primeiro, hardcoded como fallback.
    const lookup = await resolverCupom(code, { professor, planType })
    if (!lookup.ok) {
      return NextResponse.json({ valid: false, error: lookup.error }, { status: lookup.status })
    }
    const { coupon } = lookup

    const conta = calcularDesconto(value, coupon)
    if ("error" in conta) {
      return NextResponse.json({ valid: false, error: conta.error }, { status: 400 })
    }
    const { discount: discountAmount, finalValue } = conta

    return NextResponse.json({
      valid: true,
      coupon: {
        code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        firstMonthOnly: coupon.firstMonthOnly === true,
        // A tela decide com isto se o Pix Automático continua disponível com
        // o cupom aplicado. Quem confere de verdade é a rota da autorização.
        pixAutomatico: coupon.pixAutomatico === true,
      },
      calculation: {
        originalValue: value,
        discount: discountAmount,
        finalValue,
      },
      asaasDiscount: {
        value: discountAmount,
        dueDateLimitDays: 0,
        type: "FIXED",
      },
    })
  } catch (error) {
    console.error("[validate-coupon] Error:", error)
    return NextResponse.json(
      { valid: false, error: "Erro ao validar cupom" },
      { status: 500 }
    )
  }
}
