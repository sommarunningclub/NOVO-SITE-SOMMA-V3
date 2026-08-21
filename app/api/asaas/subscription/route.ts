import { type NextRequest, NextResponse } from "next/server"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

// O branch pix-recurring aguarda a 1ª cobrança assíncrona (até ~16s no pior
// caso, contando rollback); sem isso um timeout curto mataria a função antes
// do rollback e deixaria assinatura órfã viva no Asaas.
export const maxDuration = 60

function friendlyError(data: any): string {
  const code = data.errors?.[0]?.code
  if (code === "invalid_creditCard" || code === "invalid_creditCardNumber")
    return "Pagamento não autorizado, verifique seu cartão."
  if (code === "invalid_creditCardHolderInfo")
    return "Dados do titular do cartão inválidos."
  if (code === "invalid_value")
    return "Valor inválido para o pagamento."
  return data.errors?.[0]?.description || "Erro ao processar pagamento"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      creditCard,
      creditCardHolderInfo,
      remoteIp,
      description,
      // Plano mensal: recorrência
      type, // "recurring" | "installment" | "pix" | "pix-recurring"
      value,
      // Cupom de primeira mensalidade: valor cheio que volta a valer do 2º mês em diante
      valueAfterFirstCycle,
      // Plano parcelado
      installmentCount,
      installmentValue,
      // PIX à vista
      pixValue,
    } = body

    const today = new Date().toISOString().split("T")[0]
    const headers = {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY || "",
    }

    // ─── MENSAL: Assinatura recorrente via /subscriptions ────────────────
    if (type === "recurring") {
      const payload = {
        customer: customerId,
        billingType: "CREDIT_CARD",
        value,
        cycle: "MONTHLY",
        description,
        creditCard,
        creditCardHolderInfo,
        remoteIp,
      }

      console.log("[Asaas] Criando assinatura recorrente:", { customerId, value })

      const res = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[Asaas] Erro na assinatura:", data)
        return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
      }

      console.log("[Asaas] Assinatura criada:", data.id)

      // Cupom de primeira mensalidade (ex.: ANALU): a assinatura nasce com o valor
      // com desconto — a 1ª cobrança já foi gerada e capturada no cartão acima — e
      // logo em seguida volta ao valor cheio, valendo do 2º ciclo em diante.
      // updatePendingPayments=false para não reprecificar cobrança já emitida.
      let fullValueRestored = true
      if (typeof valueAfterFirstCycle === "number" && valueAfterFirstCycle > value) {
        const restoreRes = await fetch(`${ASAAS_API_URL}/subscriptions/${data.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ value: valueAfterFirstCycle, updatePendingPayments: false }),
        })

        if (!restoreRes.ok) {
          fullValueRestored = false
          // Não derruba o checkout: o cliente já pagou. Mas a assinatura ficou com o
          // valor promocional travado e precisa ser corrigida no painel do Asaas.
          console.error(
            "[Asaas] ATENÇÃO: assinatura",
            data.id,
            `ficou em R$ ${value} — corrigir para R$ ${valueAfterFirstCycle} no painel.`,
            await restoreRes.text()
          )
        } else {
          console.log("[Asaas] Valor cheio restaurado na assinatura:", data.id, valueAfterFirstCycle)
        }
      }

      return NextResponse.json({
        subscription: data,
        fullValueRestored,
        message: "Assinatura ativada com sucesso",
      })
    }

    // ─── SEMESTRAL / ANUAL: Cobrança parcelada via /payments ────────────
    if (type === "installment") {
      const payload = {
        customer: customerId,
        billingType: "CREDIT_CARD",
        installmentCount,
        installmentValue,
        dueDate: today,
        description,
        creditCard,
        creditCardHolderInfo,
        remoteIp,
      }

      console.log("[Asaas] Criando cobrança parcelada:", {
        customerId,
        installmentCount,
        installmentValue,
        total: installmentCount * installmentValue,
      })

      const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[Asaas] Erro na cobrança parcelada:", data)
        return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
      }

      console.log("[Asaas] Cobrança parcelada criada:", data.id)
      return NextResponse.json({ payment: data, message: "Pagamento processado com sucesso" })
    }

    // ─── MENSAL VIA PIX: Assinatura recorrente com billingType PIX ────────
    // A cada ciclo o Asaas gera uma nova cobrança PIX e notifica o cliente;
    // o pagamento de cada mês é manual (não é Pix Automático/débito).
    // Página de TESTE (/checkout/teste-pix-recorrente): valor travado no
    // servidor — a rota é pública e sem isso qualquer um criaria assinaturas
    // sem cartão em valor arbitrário.
    if (type === "pix-recurring") {
      const PIX_RECURRING_TEST_VALUE = 10

      const payload = {
        customer: customerId,
        billingType: "PIX",
        value: PIX_RECURRING_TEST_VALUE,
        nextDueDate: today,
        cycle: "MONTHLY",
        description,
      }

      console.log("[Asaas] Criando assinatura PIX recorrente:", { customerId })

      const res = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[Asaas] Erro na assinatura PIX:", data)
        return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
      }

      console.log("[Asaas] Assinatura PIX criada:", data.id)

      // Se qualquer passo depois do POST falhar, a assinatura não pode ficar
      // viva no Asaas: o "tentar novamente" do cliente criaria uma segunda
      // assinatura ativa e o teste viraria cobrança dupla todo mês.
      const rollback = async (reason: string) => {
        console.error(`[Asaas] Rollback da assinatura ${data.id}: ${reason}`)
        try {
          const delRes = await fetch(`${ASAAS_API_URL}/subscriptions/${data.id}`, {
            method: "DELETE",
            headers,
          })
          if (!delRes.ok) {
            console.error(
              `[Asaas] ATENÇÃO: rollback falhou — cancelar assinatura ${data.id} manualmente no painel.`,
              await delRes.text(),
            )
            return false
          }
          return true
        } catch (e) {
          console.error(`[Asaas] ATENÇÃO: rollback falhou — cancelar assinatura ${data.id} manualmente no painel.`, e)
          return false
        }
      }

      // A 1ª cobrança nasce de forma assíncrona logo após o POST — retry
      // tolerante a resposta transiente não-JSON antes de desistir.
      let firstPayment: { id: string } | null = null
      for (let attempt = 0; attempt < 6 && !firstPayment; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 2000))
        try {
          const payRes = await fetch(`${ASAAS_API_URL}/subscriptions/${data.id}/payments`, { headers })
          const payData = await payRes.json()
          if (payRes.ok && Array.isArray(payData.data) && payData.data.length > 0) {
            firstPayment = payData.data[0]
          }
        } catch (e) {
          console.warn(`[Asaas] Tentativa ${attempt + 1} de buscar a 1ª cobrança falhou:`, e)
        }
      }

      if (!firstPayment) {
        const rolledBack = await rollback("1ª cobrança não localizada dentro da janela de retry")
        return NextResponse.json(
          {
            error: rolledBack
              ? "O QR Code não ficou pronto a tempo e a assinatura foi desfeita. Tente novamente."
              : `O QR Code não ficou pronto e a assinatura ${data.id} precisa ser cancelada no painel do Asaas antes de tentar de novo.`,
          },
          { status: 502 },
        )
      }

      // QR Code já resolvido aqui: se essa busca falhasse no cliente, a
      // assinatura recém-criada ficaria órfã sem o cliente saber o id.
      let qrData: { encodedImage?: string; payload?: string; expirationDate?: string } | null = null
      try {
        const qrRes = await fetch(`${ASAAS_API_URL}/payments/${firstPayment.id}/pixQrCode`, { headers })
        const qrJson = await qrRes.json()
        if (qrRes.ok && qrJson.payload) qrData = qrJson
      } catch (e) {
        console.warn("[Asaas] Falha ao buscar QR Code da 1ª cobrança:", e)
      }

      if (!qrData) {
        const rolledBack = await rollback("QR Code da 1ª cobrança indisponível")
        return NextResponse.json(
          {
            error: rolledBack
              ? "Não foi possível gerar o QR Code e a assinatura foi desfeita. Tente novamente."
              : `Não foi possível gerar o QR Code e a assinatura ${data.id} precisa ser cancelada no painel do Asaas antes de tentar de novo.`,
          },
          { status: 502 },
        )
      }

      return NextResponse.json({
        subscription: data,
        firstPayment,
        pixQrCode: qrData,
        message: "Assinatura PIX criada com sucesso",
      })
    }

    // ─── PIX À VISTA: Cobrança única via /payments ─────────────────────────
    if (type === "pix") {
      const payload = {
        customer: customerId,
        billingType: "PIX",
        value: pixValue,
        dueDate: today,
        description,
      }

      console.log("[Asaas] Criando cobrança PIX:", { customerId, pixValue })

      const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("[Asaas] Erro na cobrança PIX:", data)
        return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
      }

      console.log("[Asaas] Cobrança PIX criada:", data.id)
      return NextResponse.json({ payment: data, message: "Cobrança PIX gerada com sucesso" })
    }

    return NextResponse.json({ error: "Tipo de pagamento inválido" }, { status: 400 })
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
