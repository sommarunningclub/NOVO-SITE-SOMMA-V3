import "server-only"
import { getServiceSupabase } from "@/lib/supabase"
import type { PlanType } from "./planos"

/**
 * Cupons do checkout — validação e cálculo do desconto, no servidor.
 *
 * Antes isto vivia dentro da rota `/api/checkout/validate-coupon` e o resultado
 * voltava para o navegador, que então mandava o valor já descontado para o
 * Asaas. Agora a rota só serve para a tela mostrar o desconto: quem cobra
 * (`lib/asaas/checkout-pricing.ts`) chama estas mesmas funções e refaz a conta
 * a partir do código do cupom, nunca do valor recebido do cliente.
 *
 * Fonte de verdade = tabela `coupons` da GESTÃO (v0-sistema-somma-de-gestao-l7,
 * scripts/create-coupons-table.sql). Espelha a validação do
 * app/api/checkout/validate-coupon/route.ts da GESTÃO (status ACTIVE,
 * expiration_date, usage_limit/usage_count). Os cupons hardcoded abaixo são
 * APENAS fallback para os códigos ativos ainda não migrados ao DB.
 * `firstMonthOnly` só existe nos cupons hardcoded: a tabela da GESTÃO não tem a
 * coluna, então cupom vindo do DB continua valendo em todas as mensalidades.
 */

/** Valor mínimo exigido pelo Asaas para cartão de crédito. */
export const VALOR_MINIMO_ASAAS = 5.0

export interface NormalizedCoupon {
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  description: string
  firstMonthOnly?: boolean
}

export interface CouponCalculation {
  originalValue: number
  discount: number
  finalValue: number
}

export type CouponLookup =
  | { ok: true; coupon: NormalizedCoupon }
  | { ok: false; error: string; status: number }

type HardcodedCoupon = {
  type: "PERCENTAGE" | "FIXED"
  value: number
  description: string
  active: boolean
  professor?: string
  planType?: string
  firstMonthOnly?: boolean
}

// Cupons cadastrados - edite aqui para adicionar/remover cupons
const COUPONS: Record<string, HardcodedCoupon> = {
  // Campanha ANALU — 20% só na primeira mensalidade do plano Mensal, com qualquer
  // professor. Sem `professor` = liberado para todos; `planType: "recurring"` deixa
  // de fora Semestral e Anual, que são cobrança parcelada.
  "ANALU": { type: "PERCENTAGE", value: 20, description: "20% no 1º mês", active: true, planType: "recurring", firstMonthOnly: true },

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

async function lookupCouponDB(
  code: string
): Promise<NormalizedCoupon | { error: string } | null> {
  const supabase = getServiceSupabase()
  if (!supabase) return null // sem DB → cai no fallback
  const { data, error } = await supabase
    .from("coupons")
    .select("code, type, value, description, status, expiration_date, usage_limit, usage_count")
    .eq("code", code)
    .single()
  if (error || !data) return null // não está no DB → fallback
  if (data.status !== "ACTIVE") return { error: "Cupom expirado ou inativo" }
  if (data.expiration_date && new Date(data.expiration_date) < new Date())
    return { error: "Cupom expirado ou inativo" }
  if (data.usage_limit != null && (data.usage_count ?? 0) >= data.usage_limit)
    return { error: "Cupom esgotado" }
  return {
    code,
    type: data.type,
    value: Number(data.value),
    description: data.description ?? "Desconto",
  }
}

export function normalizarCodigoCupom(code: unknown): string {
  return String(code ?? "").toUpperCase().trim()
}

/**
 * Resolve o cupom contra o DB e, na ausência, contra a tabela local.
 * As restrições de professor e de tipo de plano são conferidas aqui — é o
 * mesmo caminho que a cobrança usa, então não dá para burlar pela tela.
 */
export async function resolveCoupon(
  rawCode: unknown,
  contexto: { professor: string; planType: PlanType }
): Promise<CouponLookup> {
  const code = normalizarCodigoCupom(rawCode)
  if (!code) return { ok: false, error: "Código do cupom não informado", status: 400 }

  const dbResult = await lookupCouponDB(code)
  if (dbResult && "error" in dbResult) {
    return { ok: false, error: dbResult.error, status: 400 }
  }
  if (dbResult) return { ok: true, coupon: dbResult }

  const hc = COUPONS[code]
  if (!hc) return { ok: false, error: "Cupom não encontrado", status: 404 }
  if (!hc.active) return { ok: false, error: "Cupom expirado ou inativo", status: 400 }
  if (hc.professor && hc.professor !== contexto.professor) {
    return { ok: false, error: "Cupom inválido", status: 400 }
  }
  if (hc.planType && hc.planType !== contexto.planType) {
    return { ok: false, error: "Cupom inválido", status: 400 }
  }

  return {
    ok: true,
    coupon: {
      code,
      type: hc.type,
      value: hc.value,
      description: hc.description,
      firstMonthOnly: hc.firstMonthOnly,
    },
  }
}

/**
 * Desconto sobre um valor. Nunca derruba a cobrança abaixo do mínimo do Asaas
 * e nunca vira crédito: o desconto é limitado ao próprio valor.
 */
export function calcularDesconto(
  valor: number,
  coupon: NormalizedCoupon
): CouponCalculation | { error: string } {
  let discountAmount: number
  if (coupon.type === "PERCENTAGE") {
    discountAmount = valor * (coupon.value / 100)
  } else {
    discountAmount = Math.min(coupon.value, valor)
  }

  let finalValue = valor - discountAmount
  if (finalValue < VALOR_MINIMO_ASAAS) {
    discountAmount = valor - VALOR_MINIMO_ASAAS
    finalValue = VALOR_MINIMO_ASAAS
  }

  if (discountAmount <= 0) {
    return { error: "Cupom não aplicável para este valor" }
  }

  return { originalValue: valor, discount: discountAmount, finalValue }
}
