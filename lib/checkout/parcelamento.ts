/**
 * Parcelamento do checkout da Assessoria — quanto custa cada parcela.
 *
 * Fonte única da conta, importada tanto pela tela (`components/checkout-form`)
 * quanto por quem cobra (`app/api/asaas/subscription`). Sem `server-only` de
 * propósito: o resumo da compra precisa dos mesmos números, e não há segredo
 * nenhum aqui.
 *
 * O bug que deu origem a este arquivo, em 22/09/2026: o valor da parcela era
 * `plan.price` — a mensalidade do plano — multiplicado pelo número de parcelas
 * escolhido. Quem escolhia "1x" no Semestral pagava R$ 200 pelo semestre
 * inteiro em vez de R$ 1.200. O seletor ainda exibia "1x de R$ 1.200,00"
 * enquanto o botão dizia "Pagar 1x de R$ 200,00".
 */

/** Valor mínimo que o Asaas aceita numa cobrança. */
export const VALOR_MINIMO_ASAAS = 5.0

/** O que a conta precisa saber de um plano. */
export interface PlanoParcelavel {
  /** Mensalidade do plano. */
  price: number
  /** Total do ciclo contratado. */
  total: number
  /** Parcelas do ciclo cheio: 6 no Semestral, 12 no Anual. */
  installments: number
}

export function arredondar(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Total do ciclo contratado, já com o cupom.
 *
 * NÃO depende do número de parcelas escolhido, e é esse o ponto: o cupom
 * desconta por mensalidade, então o Semestral custa o mesmo em 1x ou em 6x.
 * Escolher menos parcelas antecipa o pagamento, não barateia o plano.
 */
export function totalDoCiclo(plan: PlanoParcelavel, descontoPorMensalidade = 0): number {
  const total = plan.total - descontoPorMensalidade * plan.installments
  return Math.max(arredondar(total), VALOR_MINIMO_ASAAS)
}

/** Valor de cada parcela, dado o total do ciclo e o nº de parcelas. */
export function valorDaParcela(total: number, parcelas: number): number {
  const n = Math.max(1, Math.trunc(parcelas) || 1)
  return Math.max(arredondar(total / n), VALOR_MINIMO_ASAAS)
}

/**
 * O que o cartão será efetivamente cobrado: parcela × parcelas, que é como o
 * Asaas fecha a conta. É este número que a tela mostra — nada de um total na
 * tela e outro na fatura.
 */
export function totalParcelado(total: number, parcelas: number): number {
  const n = Math.max(1, Math.trunc(parcelas) || 1)
  return arredondar(valorDaParcela(total, n) * n)
}

/**
 * Parcelamentos que dividem o total em centavos exatos.
 *
 * Como o Asaas multiplica a parcela pelo nº de parcelas, uma divisão inexata
 * (o Anual em 7x daria R$ 308,571…) fecharia o total alguns centavos longe do
 * preço anunciado. Em vez de cobrar um valor que não é o da vitrine, a opção
 * não é oferecida.
 */
export function parcelasDisponiveis(plan: PlanoParcelavel, total: number): number[] {
  const alvo = arredondar(total)
  const opcoes: number[] = []
  for (let n = 1; n <= plan.installments; n++) {
    if (totalParcelado(alvo, n) === alvo) opcoes.push(n)
  }
  return opcoes.length ? opcoes : [plan.installments]
}

/**
 * Prende o nº de parcelas pedido às opções que fecham o total exato. Pedido
 * fora da lista cai no parcelamento cheio do plano, nunca num total diferente
 * do anunciado.
 */
export function ajustarParcelas(plan: PlanoParcelavel, total: number, pedido: unknown): number {
  const n = Math.trunc(Number(pedido))
  const opcoes = parcelasDisponiveis(plan, total)
  return Number.isFinite(n) && opcoes.includes(n) ? n : opcoes[opcoes.length - 1]
}

/**
 * Catálogo dos planos parcelados, para o servidor conferir o que o navegador
 * pediu. A tela tem a própria cópia (em `app/checkout/[plano]/page.tsx` e em
 * `CheckoutProfessor.tsx`); aqui está a que vale na hora de cobrar.
 */
export const PLANOS_PARCELADOS: Record<string, PlanoParcelavel> = {
  Semestral: { price: 200, total: 1200, installments: 6 },
  Anual: { price: 180, total: 2160, installments: 12 },
}

export function planoParcelado(nome: unknown): PlanoParcelavel | null {
  return PLANOS_PARCELADOS[String(nome ?? "").trim()] ?? null
}
