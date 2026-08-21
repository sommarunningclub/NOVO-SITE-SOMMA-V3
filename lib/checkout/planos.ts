/**
 * Catálogo de planos da Assessoria — FONTE DE VERDADE DO PREÇO.
 *
 * Vive aqui, e só aqui. As páginas de checkout leem daqui para montar a tela e
 * as rotas do Asaas leem daqui para cobrar. O cliente escolhe um `id` de plano;
 * nunca um valor. Qualquer `value` que chegue no corpo de uma requisição é
 * ignorado — foi exatamente esse caminho que permitia criar assinatura de R$ 1.
 *
 * Sem `server-only` de propósito: o componente de checkout é client e precisa
 * dos mesmos números para exibir o resumo. Não há segredo neste arquivo.
 */

export type PlanType = "recurring" | "installment"

export type PlanId = "mensal" | "semestral" | "anual" | "mensal-alexandre"

export interface Plan {
  id: PlanId
  name: string
  period: string
  /** Mensalidade (recurring) ou valor da parcela (installment). */
  price: number
  /** Total do ciclo contratado. */
  total: number
  installments: number
  type: PlanType
  /** Link dedicado de um professor: o vínculo não é escolhido pelo cliente. */
  professorFixo?: string
}

export const PLANOS: Record<PlanId, Plan> = {
  mensal: {
    id: "mensal",
    name: "Mensal",
    period: "mensal",
    price: 220,
    total: 220,
    installments: 1,
    type: "recurring",
  },
  semestral: {
    id: "semestral",
    name: "Semestral",
    period: "semestral",
    price: 200,
    total: 1200,
    installments: 6,
    type: "installment",
  },
  anual: {
    id: "anual",
    name: "Anual",
    period: "anual",
    price: 180,
    total: 2160,
    installments: 12,
    type: "installment",
  },
  // Checkout dedicado do professor Alexandre Alves — sommaclub.com.br/checkout/mensal/alexandre
  "mensal-alexandre": {
    id: "mensal-alexandre",
    name: "Mensal",
    period: "mensal",
    price: 330,
    total: 330,
    installments: 1,
    type: "recurring",
    professorFixo: "Alexandre Alves",
  },
}

/** Slugs públicos de /checkout/[plano] — o link dedicado tem rota própria. */
export const PLANOS_PUBLICOS: PlanId[] = ["mensal", "semestral", "anual"]

export function getPlan(id: string | null | undefined): Plan | null {
  if (!id) return null
  return PLANOS[id as PlanId] ?? null
}

/** Nº de parcelas pedido, preso ao que o plano permite. */
export function normalizarParcelas(plan: Plan, pedido: unknown): number {
  const n = Math.trunc(Number(pedido))
  if (!Number.isFinite(n) || n < 1) return plan.installments
  return Math.min(n, plan.installments)
}

/** PIX à vista só existe em plano parcelado; o mensal é recorrência no cartão. */
export function metodoPermitido(plan: Plan, metodo: unknown): "card" | "pix" {
  return metodo === "pix" && plan.type === "installment" ? "pix" : "card"
}
