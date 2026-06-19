import { NextResponse } from "next/server"

// Cupons cadastrados - edite aqui para adicionar/remover cupons
const COUPONS: Record<string, { type: "PERCENTAGE" | "FIXED"; value: number; description: string; active: boolean; professor?: string; planType?: string }> = {
  // Cupons Originais
  "SOMMA5": { type: "PERCENTAGE", value: 5, description: "5% de desconto", active: false },
  "SOMMA10": { type: "PERCENTAGE", value: 10, description: "10% de desconto", active: false },
  "SOMMA20": { type: "PERCENTAGE", value: 20, description: "20% de desconto", active: false },
  "SOMMA50": { type: "FIXED", value: 50, description: "R$ 50,00 de desconto", active: false },
  "PRIMEIRACOMPRA": { type: "PERCENTAGE", value: 15, description: "15% na primeira compra", active: false },
  "SOMMA99": { type: "PERCENTAGE", value: 99, description: "99% de desconto", active: false },
  "JO130": { type: "FIXED", value: 90, description: "Desconto de R$ 90,00 - Assinatura por R$ 130", active: true },
  "JO150": { type: "FIXED", value: 70, description: "Desconto de R$ 70,00 - Assinatura por R$ 150", active: true, professor: "Joseph Pereira", planType: "recurring" },
  "ALE200": { type: "FIXED", value: 20, description: "Desconto de R$ 20,00 - Assinatura por R$ 200", active: true, professor: "Alexandre Alves", planType: "recurring" },
  "ALE180": { type: "FIXED", value: 40, description: "Desconto de R$ 40,00 - Assinatura por R$ 180", active: true, professor: "Alexandre Alves", planType: "recurring" },

  // Cupons Familiares - 10%
  "ALEX10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "ANDERSON10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "ARTHUR10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "BRUNA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "CAROLINA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "CRIS10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "CAMILLA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "DIOGO10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "PRISCYLA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "PRISCILA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "GUSTAVO10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "JOAO10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "JOSEPH10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "KAMILA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "LETICIA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "LUANA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "LUISA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "MATEUS10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "MATHEUS10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "RAYSSA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "RUAN10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "YASMIM10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "YASMIN10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "ANA10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },
  "DAYANE10": { type: "PERCENTAGE", value: 10, description: "10% desconto - Familiares", active: true },

  // Cupons Público Geral - 5%
  "ALEX5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "ANDERSON5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "ARTHUR5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "BRUNA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "CAROLINA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "CRIS5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "CAMILLA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "DIOGO5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "PRISCYLA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "PRISCILA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "GUSTAVO5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "JOAO5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "JOSEPH5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "KAMILA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "LETICIA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "LUANA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "LUISA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "MATEUS5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "MATHEUS5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "RAYSSA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "RUAN5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "YASMIM5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "YASMIN5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "ANA5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
  "DAYANE5": { type: "PERCENTAGE", value: 5, description: "5% desconto - Público Geral", active: true },
}

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

    const coupon = COUPONS[code]

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: "Cupom não encontrado" },
        { status: 404 }
      )
    }

    if (!coupon.active) {
      return NextResponse.json(
        { valid: false, error: "Cupom expirado ou inativo" },
        { status: 400 }
      )
    }

    if (coupon.professor && coupon.professor !== professor) {
      return NextResponse.json(
        { valid: false, error: "Cupom inválido" },
        { status: 400 }
      )
    }

    if (coupon.planType && coupon.planType !== planType) {
      return NextResponse.json(
        { valid: false, error: "Cupom inválido" },
        { status: 400 }
      )
    }

    // Valor mínimo exigido pelo Asaas para cartão de crédito
    const MINIMUM_VALUE = 5.00

    // Calcular desconto
    let discountAmount: number
    if (coupon.type === "PERCENTAGE") {
      discountAmount = value * (coupon.value / 100)
    } else {
      discountAmount = Math.min(coupon.value, value) // Não pode ser maior que o valor total
    }

    // Garantir que o valor final não seja menor que o mínimo do Asaas
    let finalValue = value - discountAmount
    if (finalValue < MINIMUM_VALUE) {
      // Ajustar o desconto para garantir o valor mínimo
      discountAmount = value - MINIMUM_VALUE
      finalValue = MINIMUM_VALUE
    }
    
    // Se o desconto ficou zerado ou negativo, o cupom não se aplica
    if (discountAmount <= 0) {
      return NextResponse.json(
        { valid: false, error: "Cupom não aplicável para este valor" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
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
