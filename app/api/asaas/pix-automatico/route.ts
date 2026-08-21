import { type NextRequest, NextResponse } from "next/server"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

// Pix Automático (Jornada 3): um único QR Code junta o 1º pagamento com o
// consentimento da recorrência. Depois que o pagador autoriza no app do banco
// e a 1ª cobrança liquida, a autorização vira ACTIVE e o débito das próximas
// mensalidades acontece sozinho na conta dele.
//
// Página de TESTE (/checkout/teste-pix-recorrente): valor travado no servidor,
// já que a rota é pública e cria recorrência sem cartão.
const VALOR_TESTE = 10

// Ao contrário do resto da API do Asaas, aqui o campo é "customerId" (e não
// "customer") e o QR imediato é obrigatório.
type AutorizacaoResponse = {
  id?: string
  status?: string
  payload?: string
  encodedImage?: string
  subscriptionId?: string | null
  immediateQrCode?: { conciliationIdentifier?: string; expirationDate?: string }
  errors?: { description?: string }[]
}

function friendlyError(data: any): string {
  return data?.errors?.[0]?.description || "Erro ao criar autorização de Pix Automático"
}

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "customerId é obrigatório" }, { status: 400 })
    }

    const headers = {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY || "",
    }

    // O QR imediato cobre a 1ª mensalidade (hoje). A recorrência automática
    // começa no ciclo seguinte: startDate no mês que vem, para o débito
    // automático não duplicar a cobrança que o cliente acabou de pagar.
    // Data calculada no fuso de Brasília (o servidor roda em UTC) e com o dia
    // limitado ao último do mês de destino, senão 31/08 viraria 01/10.
    const hojeBR = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
    )
    const ano = hojeBR.getMonth() === 11 ? hojeBR.getFullYear() + 1 : hojeBR.getFullYear()
    const mes = (hojeBR.getMonth() + 1) % 12
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate()
    const dia = Math.min(hojeBR.getDate(), ultimoDiaDoMes)
    const startDate = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`

    const payload = {
      customerId,
      frequency: "MONTHLY",
      value: VALOR_TESTE,
      startDate,
      // contractId é o identificador do contrato do nosso lado (máx. 35 chars).
      contractId: `TESTE-PIXAUTO-${Date.now()}`.slice(0, 35),
      // description também é limitada a 35 caracteres pelo Asaas.
      description: "Somma Assessoria Mensal".slice(0, 35),
      // O Asaas gera as cobranças de cada ciclo sozinho depois da ativação.
      paymentCreationMode: "SUBSCRIPTION",
      // Retentativas só podem ser habilitadas na criação, nunca depois.
      retryPolicy: "ALLOW_THREE_IN_SEVEN_DAYS",
      immediateQrCode: {
        // 24h de validade: se o QR expirar sem pagamento a autorização vai
        // para REFUSED e todo o fluxo precisa ser refeito.
        expirationSeconds: 86400,
        originalValue: VALOR_TESTE,
      },
    }

    console.log("[Asaas] Criando autorização de Pix Automático:", { customerId, startDate })

    const res = await fetch(`${ASAAS_API_URL}/pix/automatic/authorizations`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const data: AutorizacaoResponse = await res.json()

    if (!res.ok) {
      console.error("[Asaas] Erro na autorização de Pix Automático:", data)
      return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
    }

    // Sem o QR não há como o cliente pagar/autorizar: desfaz a autorização
    // para o retry não deixar autorizações órfãs na conta.
    if (!data.payload || !data.id) {
      console.error("[Asaas] Autorização criada sem QR Code:", data.id)
      if (data.id) {
        await fetch(`${ASAAS_API_URL}/pix/automatic/authorizations/${data.id}`, {
          method: "DELETE",
          headers,
        }).catch((e) => console.error("[Asaas] Falha ao cancelar autorização órfã:", data.id, e))
      }
      return NextResponse.json(
        { error: "A autorização foi criada, mas o QR Code não veio. Tente novamente." },
        { status: 502 },
      )
    }

    console.log("[Asaas] Autorização criada:", data.id, "status:", data.status)

    return NextResponse.json({
      authorizationId: data.id,
      status: data.status,
      // payload e encodedImage vêm na raiz da resposta; conciliationIdentifier
      // e expirationDate vêm dentro de immediateQrCode.
      payload: data.payload,
      encodedImage: data.encodedImage,
      expirationDate: data.immediateQrCode?.expirationDate,
      subscriptionId: data.subscriptionId ?? null,
      startDate,
      value: VALOR_TESTE,
    })
  } catch (error) {
    console.error("[Asaas] Erro no Pix Automático:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Polling da tela de pagamento: CREATED = aguardando o pagamento/autorização,
// ACTIVE = recorrência ativa (o que o teste quer provar), REFUSED/CANCELLED/
// EXPIRED = não vai ativar.
export async function GET(request: NextRequest) {
  try {
    const authorizationId = new URL(request.url).searchParams.get("authorizationId")

    if (!authorizationId) {
      return NextResponse.json({ error: "authorizationId é obrigatório" }, { status: 400 })
    }

    const res = await fetch(`${ASAAS_API_URL}/pix/automatic/authorizations/${authorizationId}`, {
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY || "",
      },
    })

    const data: AutorizacaoResponse = await res.json()

    if (!res.ok) {
      console.error("[Asaas] Erro ao consultar autorização:", data)
      return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      subscriptionId: data.subscriptionId ?? null,
      active: data.status === "ACTIVE",
      failed: data.status === "REFUSED" || data.status === "CANCELLED" || data.status === "EXPIRED",
    })
  } catch (error) {
    console.error("[Asaas] Erro ao consultar autorização:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
