import { getServiceSupabase } from "@/lib/supabase"

/**
 * Cupons do checkout — consulta e cálculo do desconto.
 *
 * Saiu de dentro de `app/api/checkout/validate-coupon/route.ts` para poder ser
 * usado também por quem cobra (`app/api/asaas/subscription`). Antes, só a tela
 * sabia quanto o cupom abatia, e a rota de cobrança aceitava o número que o
 * navegador mandasse.
 */

// Fonte de verdade = tabela `coupons` da GESTÃO (v0-sistema-somma-de-gestao-l7,
// scripts/create-coupons-table.sql). Espelha a validação do
// app/api/checkout/validate-coupon/route.ts da GESTÃO (status ACTIVE,
// expiration_date, usage_limit/usage_count). Mantemos os cupons hardcoded
// abaixo APENAS como fallback para os códigos ativos ainda não migrados ao DB.
// Desde a migration 20260920223743_coupon_rules.sql da GESTÃO, a tabela também
// guarda `professor`, `plan_type` e `first_month_only`: o cupom do painel vale
// exatamente as mesmas regras do hardcoded. Como o cupom do DB tem precedência,
// ler essas colunas é o que impede um JO150 migrado de valer com qualquer
// professor.
type NormalizedCoupon = {
  type: "PERCENTAGE" | "FIXED"
  value: number
  description: string
  firstMonthOnly?: boolean
  /**
   * Liberado para o Pix Automático. Só existe nos cupons do painel e o padrão
   * é `false`: o débito recorrente é autorizado uma vez no app do banco, e um
   * cupom antigo não pode começar a mexer nesse valor por conta própria.
   */
  pixAutomatico?: boolean
}

async function lookupCouponDB(
  code: string,
  contexto: { professor: string; planType: string }
): Promise<NormalizedCoupon | { error: string } | null> {
  const supabase = getServiceSupabase()
  if (!supabase) return null // sem DB → cai no fallback
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "code, type, value, description, status, expiration_date, usage_limit, usage_count, professor, plan_type, first_month_only, pix_automatico"
    )
    .eq("code", code)
    .single()
  if (error || !data) return null // não está no DB → fallback
  if (data.status !== "ACTIVE") return { error: "Cupom expirado ou inativo" }
  if (data.expiration_date && new Date(data.expiration_date) < new Date())
    return { error: "Cupom expirado ou inativo" }
  if (data.usage_limit != null && (data.usage_count ?? 0) >= data.usage_limit)
    return { error: "Cupom esgotado" }
  // Restrições de professor e de plano: as mesmas do fallback hardcoded abaixo.
  if (data.professor && data.professor !== contexto.professor) return { error: "Cupom inválido" }
  if (data.plan_type && data.plan_type !== contexto.planType) return { error: "Cupom inválido" }
  return {
    type: data.type,
    value: Number(data.value),
    description: data.description ?? "Desconto",
    firstMonthOnly: data.first_month_only === true,
    pixAutomatico: data.pix_automatico === true,
  }
}

// Cupons cadastrados - edite aqui para adicionar/remover cupons
const COUPONS: Record<string, { type: "PERCENTAGE" | "FIXED"; value: number; description: string; active: boolean; professor?: string; planType?: string; firstMonthOnly?: boolean }> = {
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

  // TESTE do link dedicado do Gabriel (sommaclub.com.br/gabriel-brito): derruba a
  // primeira mensalidade para R$ 5,00, o mínimo que o Asaas aceita no cartão.
  // Preso ao professor Gabriel Brito e ao plano Mensal, e `firstMonthOnly`
  // devolve o valor cheio no 2º ciclo — se esquecerem de cancelar o teste, não
  // fica uma assinatura de R$ 5 aberta. REMOVER depois de validar a compra.
  "GB100": { type: "FIXED", value: 215, description: "Teste - 1ª mensalidade por R$ 5,00", active: true, professor: "Gabriel Brito", planType: "recurring", firstMonthOnly: true },

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

/** Valor mínimo exigido pelo Asaas para cartão de crédito. */
export const VALOR_MINIMO_ASAAS = 5.0

export type CupomResolvido =
  | { ok: true; coupon: NormalizedCoupon }
  | { ok: false; error: string; status: number }

/**
 * Resolve um código de cupom: tabela `coupons` da GESTÃO primeiro, cupons
 * hardcoded como fallback. Mesmas regras de professor e tipo de plano nos dois.
 */
export async function resolverCupom(
  codigo: string,
  contexto: { professor: string; planType: string }
): Promise<CupomResolvido> {
  const code = String(codigo ?? "").toUpperCase().trim()
  if (!code) return { ok: false, error: "Código do cupom não informado", status: 400 }

  const dbResult = await lookupCouponDB(code, contexto)
  if (dbResult && "error" in dbResult) return { ok: false, error: dbResult.error, status: 400 }
  if (dbResult) return { ok: true, coupon: dbResult }

  const hc = COUPONS[code]
  if (!hc) return { ok: false, error: "Cupom não encontrado", status: 404 }
  if (!hc.active) return { ok: false, error: "Cupom expirado ou inativo", status: 400 }
  if (hc.professor && hc.professor !== contexto.professor)
    return { ok: false, error: "Cupom inválido", status: 400 }
  if (hc.planType && hc.planType !== contexto.planType)
    return { ok: false, error: "Cupom inválido", status: 400 }

  return {
    ok: true,
    coupon: {
      type: hc.type,
      value: hc.value,
      description: hc.description,
      firstMonthOnly: hc.firstMonthOnly,
    },
  }
}

/**
 * Desconto do cupom sobre um valor — a mensalidade do plano, sempre, não o
 * total do ciclo nem a parcela escolhida.
 */
export function calcularDesconto(
  valor: number,
  coupon: NormalizedCoupon
): { discount: number; finalValue: number } | { error: string } {
  let discount =
    coupon.type === "PERCENTAGE" ? valor * (coupon.value / 100) : Math.min(coupon.value, valor)

  let finalValue = valor - discount
  if (finalValue < VALOR_MINIMO_ASAAS) {
    discount = valor - VALOR_MINIMO_ASAAS
    finalValue = VALOR_MINIMO_ASAAS
  }
  if (discount <= 0) return { error: "Cupom não aplicável para este valor" }

  return { discount, finalValue }
}

export type { NormalizedCoupon }
