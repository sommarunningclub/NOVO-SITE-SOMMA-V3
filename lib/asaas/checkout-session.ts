import "server-only"
import { NextResponse } from "next/server"
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token"
import type { PlanId } from "@/lib/checkout/planos"

/**
 * Sessão de checkout — o crachá que amarra as quatro rotas do Asaas.
 *
 * Nasce em `POST /api/asaas/customer`, junto com o cliente no Asaas, e viaja
 * com o navegador até o fim da compra. É um HMAC do servidor: o cliente
 * consegue ler, não consegue alterar.
 *
 * O que ele guarda é a ESCOLHA (plano, parcelas, cupom, professor), nunca o
 * preço. Quem cobra recalcula o valor a partir dessa escolha, então adulterar
 * o corpo da requisição não muda um centavo.
 *
 * Também é o que amarra `paymentId` a quem comprou: sem isso, `/api/asaas/pix`
 * e `/api/asaas/payment-status` eram um oráculo aberto sobre qualquer cobrança
 * da conta Asaas.
 */

const PURPOSE = "checkout"
/** 2h: tempo de sobra para preencher o formulário e pagar um PIX, e nada além. */
const MAX_AGE = 60 * 60 * 2
export const CHECKOUT_TOKEN_HEADER = "x-checkout-session"

export interface CheckoutSession {
  planId: PlanId
  method: "card" | "pix"
  installments: number
  professor: string
  couponCode: string | null
  shirtSize: string | null
  customerId: string
  /** Cobranças criadas nesta sessão — só elas podem ser consultadas. */
  paymentIds?: string[]
  subscriptionId?: string
}

export function issueCheckoutToken(session: CheckoutSession): string {
  return createSignedToken(PURPOSE, session as unknown as Record<string, unknown>, MAX_AGE)
}

export function readCheckoutToken(token: string | null | undefined): CheckoutSession | null {
  const payload = verifySignedToken<Record<string, unknown>>(PURPOSE, token)
  if (!payload) return null
  if (typeof payload.planId !== "string" || typeof payload.customerId !== "string") return null
  if (payload.method !== "card" && payload.method !== "pix") return null
  return {
    planId: payload.planId as PlanId,
    method: payload.method,
    installments: Number(payload.installments) || 1,
    professor: typeof payload.professor === "string" ? payload.professor : "",
    couponCode: typeof payload.couponCode === "string" ? payload.couponCode : null,
    shirtSize: typeof payload.shirtSize === "string" ? payload.shirtSize : null,
    customerId: payload.customerId,
    paymentIds: Array.isArray(payload.paymentIds)
      ? payload.paymentIds.filter((id): id is string => typeof id === "string")
      : [],
    subscriptionId: typeof payload.subscriptionId === "string" ? payload.subscriptionId : undefined,
  }
}

/** Header primeiro; o corpo serve para POST, onde header extra é ruído a mais. */
export function tokenFromRequest(request: Request, body?: Record<string, unknown>): string | null {
  const header = request.headers.get(CHECKOUT_TOKEN_HEADER)
  if (header) return header
  const noCorpo = body?.checkoutToken
  return typeof noCorpo === "string" ? noCorpo : null
}

type Guard =
  | { ok: true; session: CheckoutSession }
  | { ok: false; response: NextResponse }

export function requireCheckoutSession(
  request: Request,
  body?: Record<string, unknown>
): Guard {
  const session = readCheckoutToken(tokenFromRequest(request, body))
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sessão de checkout inválida ou expirada. Recarregue a página." },
        { status: 401 }
      ),
    }
  }
  return { ok: true, session }
}

/** A cobrança pertence a esta compra? */
export function sessaoCobreCobranca(session: CheckoutSession, paymentId: string): boolean {
  return (session.paymentIds ?? []).includes(paymentId)
}
