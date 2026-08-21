import "server-only"
import { getServiceSupabase } from "@/lib/supabase"
import {
  calcularDesconto,
  resolveCoupon,
  VALOR_MINIMO_ASAAS,
  type CouponCalculation,
  type NormalizedCoupon,
} from "@/lib/checkout/cupons"
import {
  getPlan,
  metodoPermitido,
  normalizarParcelas,
  type Plan,
} from "@/lib/checkout/planos"

/**
 * Preço da compra, calculado no servidor a partir da escolha do cliente.
 *
 * Esta é a única função que decide quanto o Asaas vai cobrar. O navegador manda
 * `planId`, `couponCode`, `professor` e nº de parcelas; o valor sai daqui. Antes
 * o valor vinha no corpo da requisição e era repassado ao Asaas sem conferência,
 * o que permitia assinar o plano mensal por qualquer quantia.
 */

export interface CheckoutEscolha {
  planId: string
  method?: unknown
  installments?: unknown
  professor?: unknown
  couponCode?: unknown
  shirtSize?: unknown
}

export interface CheckoutEscolhaNormalizada {
  plan: Plan
  method: "card" | "pix"
  installments: number
  professor: string
  couponCode: string | null
  shirtSize: string | null
}

export interface CheckoutCharge extends CheckoutEscolhaNormalizada {
  coupon: NormalizedCoupon | null
  calculo: CouponCalculation | null
  /** Só vale na recorrência: valor da 1ª cobrança e dos ciclos seguintes. */
  value?: number
  valueAfterFirstCycle?: number
  /** Só vale no parcelado no cartão. */
  installmentCount?: number
  installmentValue?: number
  /** Só vale no PIX à vista. */
  pixValue?: number
  /** O que o cliente vê no extrato e no painel do Asaas. */
  description: string
  /** Total que a compra representa hoje — usado no registro da gestão. */
  totalCobrado: number
  /** Mensalidade contratada (a cheia, quando o cupom só vale no 1º mês). */
  mensalidade: number
}

export type PricingResult =
  | { ok: true; charge: CheckoutCharge }
  | { ok: false; error: string; status: number }

const NOMES_PROFESSOR_CACHE_MS = 60_000
let professoresCache: { nomes: string[]; em: number } | null = null

/**
 * Nomes válidos de professor. Serve para o cliente não inventar um nome só para
 * destravar cupom preso a professor (ALE180, JO150…). Se o banco não responde,
 * mantemos o nome enviado: quebrar checkout legítimo por instabilidade do
 * Supabase é pior do que a restrição de cupom se comportar como hoje.
 */
async function normalizarProfessor(bruto: unknown, plan: Plan): Promise<string> {
  if (plan.professorFixo) return plan.professorFixo

  const nome = String(bruto ?? "").trim()
  if (!nome) return ""

  const agora = Date.now()
  if (!professoresCache || agora - professoresCache.em > NOMES_PROFESSOR_CACHE_MS) {
    const supabase = getServiceSupabase()
    if (!supabase) return nome
    const { data, error } = await supabase
      .from("professores_curriculo_assessoria")
      .select("nome")
    if (error || !data) {
      console.warn("[checkout-pricing] Lista de professores indisponível:", error?.message)
      return nome
    }
    professoresCache = {
      nomes: data.map((p) => String(p.nome ?? "")).filter(Boolean),
      em: agora,
    }
  }

  const encontrado = professoresCache.nomes.find(
    (n) => n.trim().toLowerCase() === nome.toLowerCase()
  )
  return encontrado ?? ""
}

function limparTamanho(bruto: unknown): string | null {
  const t = String(bruto ?? "").trim().toUpperCase()
  return ["P", "M", "G", "GG", "XG"].includes(t) ? t : null
}

function arredondar(v: number): number {
  return Math.round(v * 100) / 100
}

/** Valida a escolha do cliente sem ainda mexer em cupom. */
export async function normalizarEscolha(
  escolha: CheckoutEscolha
): Promise<{ ok: true; escolha: CheckoutEscolhaNormalizada } | { ok: false; error: string; status: number }> {
  const plan = getPlan(escolha.planId)
  if (!plan) return { ok: false, error: "Plano inválido.", status: 400 }

  const method = metodoPermitido(plan, escolha.method)
  const installments =
    method === "pix" ? plan.installments : normalizarParcelas(plan, escolha.installments)
  const professor = await normalizarProfessor(escolha.professor, plan)
  const codigo = String(escolha.couponCode ?? "").toUpperCase().trim()

  return {
    ok: true,
    escolha: {
      plan,
      method,
      installments,
      professor,
      couponCode: codigo || null,
      shirtSize: limparTamanho(escolha.shirtSize),
    },
  }
}

/**
 * Traduz a escolha em números para o Asaas.
 *
 * A conta reproduz exatamente o que a tela mostra:
 * - recorrência: desconto na mensalidade; `firstMonthOnly` volta ao valor cheio
 *   a partir do 2º ciclo;
 * - parcelado no cartão: desconto por parcela;
 * - PIX à vista: total do plano menos o desconto multiplicado pelas parcelas.
 */
export async function precificar(escolhaBruta: CheckoutEscolha): Promise<PricingResult> {
  const normalizada = await normalizarEscolha(escolhaBruta)
  if (!normalizada.ok) return normalizada

  const { plan, method, installments, professor, couponCode, shirtSize } = normalizada.escolha

  let coupon: NormalizedCoupon | null = null
  let calculo: CouponCalculation | null = null

  if (couponCode) {
    const lookup = await resolveCoupon(couponCode, { professor, planType: plan.type })
    if (!lookup.ok) return { ok: false, error: lookup.error, status: lookup.status }

    const conta = calcularDesconto(plan.price, lookup.coupon)
    if ("error" in conta) return { ok: false, error: conta.error, status: 400 }

    coupon = lookup.coupon
    calculo = conta
  }

  const firstMonthOnly = plan.type === "recurring" && coupon?.firstMonthOnly === true
  const valorComDesconto = calculo ? calculo.finalValue : plan.price
  const desconto = calculo ? calculo.discount : 0

  const description =
    `Somma Assessoria - Plano ${plan.name}${method === "pix" ? " PIX" : ""}` +
    ` | Prof: ${professor || "não informado"}` +
    ` | Camiseta: ${shirtSize ?? "não informado"}` +
    (coupon ? ` | Cupom: ${coupon.code}` : "")

  const base: CheckoutCharge = {
    plan,
    method,
    installments,
    professor,
    couponCode: coupon?.code ?? null,
    shirtSize,
    coupon,
    calculo,
    description,
    totalCobrado: 0,
    mensalidade: firstMonthOnly ? plan.price : arredondar(valorComDesconto),
  }

  if (method === "pix") {
    const pixValue = Math.max(
      arredondar(plan.total - desconto * plan.installments),
      VALOR_MINIMO_ASAAS
    )
    return { ok: true, charge: { ...base, pixValue, totalCobrado: pixValue } }
  }

  if (plan.type === "recurring") {
    const value = arredondar(valorComDesconto)
    return {
      ok: true,
      charge: {
        ...base,
        value,
        valueAfterFirstCycle: firstMonthOnly ? plan.price : undefined,
        totalCobrado: value,
      },
    }
  }

  const installmentValue = arredondar(valorComDesconto)
  return {
    ok: true,
    charge: {
      ...base,
      installmentCount: installments,
      installmentValue,
      totalCobrado: arredondar(installmentValue * installments),
    },
  }
}
