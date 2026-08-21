import { type NextRequest, NextResponse } from "next/server"
import { resolveGroupName } from "@/lib/asaas/groups"
import { issueCheckoutToken } from "@/lib/asaas/checkout-session"
import { precificar } from "@/lib/asaas/checkout-pricing"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

/**
 * Abre o checkout: cria o cliente no Asaas e devolve a sessão assinada.
 *
 * É aqui que a escolha do cliente (plano, parcelas, cupom, professor) é fixada
 * e carimbada. Da resposta em diante nenhuma rota aceita valor vindo do
 * navegador — todas recalculam a partir deste token.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`asaas:customer:${ip}`, 12, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      )
    }

    if (!ASAAS_API_KEY) {
      console.error("[asaas/customer] ASAAS_API_KEY ausente.")
      return NextResponse.json({ error: "Checkout indisponível." }, { status: 503 })
    }

    const body = await request.json()
    const { name, email, cpfCnpj, phone, postalCode, addressNumber } = body

    if (!name || !email || !cpfCnpj) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 })
    }

    // Preço e cupom conferidos antes de criar qualquer coisa: se o cupom não
    // vale, o cliente descobre agora e não depois de digitar o cartão.
    const precificacao = await precificar({
      planId: String(body.planId ?? ""),
      method: body.method,
      installments: body.installments,
      professor: body.professor,
      couponCode: body.couponCode,
      shirtSize: body.shirtSize,
    })
    if (!precificacao.ok) {
      return NextResponse.json({ error: precificacao.error }, { status: precificacao.status })
    }
    const { charge } = precificacao

    // Vincula o cliente ao grupo do professor escolhido (se reconhecido)
    const groupName = resolveGroupName(charge.professor)

    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name,
        email,
        cpfCnpj: String(cpfCnpj).replace(/\D/g, ""),
        phone: String(phone ?? "").replace(/\D/g, ""),
        postalCode: String(postalCode ?? "").replace(/\D/g, ""),
        addressNumber,
        ...(groupName && { groupName }),
        notificationDisabled: false,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Asaas] Error creating customer:", data)
      return NextResponse.json(
        { error: data.errors?.[0]?.description || "Erro ao criar cliente" },
        { status: response.status },
      )
    }

    const checkoutToken = issueCheckoutToken({
      planId: charge.plan.id,
      method: charge.method,
      installments: charge.installments,
      professor: charge.professor,
      couponCode: charge.couponCode,
      shirtSize: charge.shirtSize,
      customerId: data.id,
      paymentIds: [],
    })

    // Só o id volta: o cadastro inteiro do Asaas não tem por que atravessar a rede.
    return NextResponse.json({ id: data.id, checkoutToken })
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
