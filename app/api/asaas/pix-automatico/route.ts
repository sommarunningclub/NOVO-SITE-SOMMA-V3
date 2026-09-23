import { type NextRequest, NextResponse } from "next/server"
import { resolvePlanoPixAutomatico } from "@/lib/checkout/planos-pix-automatico"
import { consumirToken, conferirToken, devolverToken, mensagemDoMotivo } from "@/lib/pix-automatico/tokens"
import { calcularDesconto, resolverCupom } from "@/lib/checkout/cupons-servidor"
import { getServiceSupabase } from "@/lib/supabase"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

// Pix Automático (Jornada 3): um único QR Code junta o 1º pagamento com o
// consentimento da recorrência. Depois que o pagador autoriza no app do banco
// e a 1ª cobrança liquida, a autorização vira ACTIVE e o débito das próximas
// mensalidades acontece sozinho na conta dele.
//
// O valor NUNCA vem do cliente: chega só a chave do plano e o preço sai do
// catálogo do servidor (lib/checkout/planos-pix-automatico.ts). Com cupom vale
// o mesmo: chega o CÓDIGO, e o desconto é recalculado aqui a partir dele.

// Ao contrário do resto da API do Asaas, aqui o campo é "customerId" (e não
// "customer") e o QR imediato é obrigatório.
type AutorizacaoResponse = {
  id?: string
  status?: string
  payload?: string
  encodedImage?: string
  subscriptionId?: string | null
  // ATENÇÃO: NÃO é sinal de pagamento. O Asaas devolve este identificador já
  // na criação da autorização (confirmado em produção: autorizações CREATED
  // nunca pagas e até REFUSED vêm com ele preenchido). Tratá-lo como "pago"
  // escondia o QR Code do cliente antes de ele pagar. Mantido no tipo só para
  // documentar o que o campo é — não use para detectar liquidação.
  endToEndIdentifier?: string | null
  immediateQrCode?: { conciliationIdentifier?: string; expirationDate?: string }
  errors?: { description?: string }[]
}

function friendlyError(data: any): string {
  return data?.errors?.[0]?.description || "Erro ao criar autorização de Pix Automático"
}

function asaasHeaders() {
  return {
    "Content-Type": "application/json",
    access_token: ASAAS_API_KEY || "",
  }
}

// Status de cobrança que significam dinheiro liquidado no Asaas.
const PIX_LIQUIDADO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"])

/**
 * O QR imediato desta autorização já foi pago?
 *
 * Quando o pagador liquida o QR, o Asaas cria uma cobrança avulsa na conta com
 * `pixQrCodeId` igual ao `conciliationIdentifier` da autorização. Essa cobrança
 * é a ÚNICA prova de pagamento disponível enquanto a autorização ainda está em
 * CREATED — o status da autorização só muda quando o banco do pagador conclui
 * a ativação, o que leva minutos.
 *
 * Falha fechada: qualquer erro devolve `false`. Um falso positivo aqui esconde
 * o meio de pagamento de quem ainda não pagou, que foi exatamente o defeito
 * que esta função substitui.
 */
async function qrImediatoPago(conciliationIdentifier: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${ASAAS_API_URL}/payments?pixQrCodeId=${encodeURIComponent(conciliationIdentifier)}&limit=20`,
      // Sinal cosmético: não pode segurar o polling se o Asaas ficar lento.
      // O catch converte o abort em `false`, que é o fallback desejado.
      { headers: asaasHeaders(), signal: AbortSignal.timeout(3000) },
    )
    if (!res.ok) {
      console.error(
        "[Asaas] Consulta do pagamento do QR imediato recusada:",
        res.status,
        conciliationIdentifier,
      )
      return false
    }
    const lista = await res.json()
    const cobrancas: { status?: string; pixQrCodeId?: string | null }[] = Array.isArray(lista?.data)
      ? lista.data
      : []
    // Confere o identificador na própria cobrança em vez de confiar que o
    // filtro da query foi aplicado. O Asaas IGNORA silenciosamente parâmetros
    // que não reconhece (medido: `?xxNaoExiste=abc` devolve a conta inteira, e
    // `?customer=` é ignorado no endpoint de autorizações). Se `pixQrCodeId`
    // for renomeado ou depreciado, sem esta conferência a lista inteira da
    // conta viraria "pago" e o QR sumiria de novo para todo mundo.
    return cobrancas.some(
      (c) => c?.pixQrCodeId === conciliationIdentifier && PIX_LIQUIDADO.has(String(c?.status)),
    )
  } catch (error) {
    console.error("[Asaas] Falha ao conferir pagamento do QR imediato:", error)
    return false
  }
}

/**
 * Registra o uso do cupom na GESTÃO, como o cartão já faz. Chamada só depois
 * de a autorização nascer no Asaas, e nunca derruba o checkout: o cliente está
 * com o QR na mão, e falha de registro é problema de relatório.
 */
async function registrarUsoDoCupom(
  code: string,
  dados: { desconto: number; professor?: string; customerId: string; authorizationId?: string },
): Promise<void> {
  const supabase = getServiceSupabase()
  if (!supabase) return
  try {
    const { error } = await supabase.rpc("register_coupon_redemption", {
      p_code: code,
      p_asaas_customer_id: dados.customerId,
      p_asaas_subscription_id: dados.authorizationId ?? null,
      p_plano: "mensal",
      p_professor: dados.professor ?? null,
      p_billing: "pix-automatico",
      p_discount: dados.desconto,
    })
    if (error) console.error("[cupons] Falha ao registrar uso de", code, error)
  } catch (err) {
    console.error("[cupons] Falha ao registrar uso de", code, err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, planKey, professor, token, couponCode } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "customerId é obrigatório" }, { status: 400 })
    }

    const plano = resolvePlanoPixAutomatico(planKey)
    if (!plano) {
      return NextResponse.json({ error: "Plano inválido para Pix Automático" }, { status: 400 })
    }

    // Código de liberação obrigatório, SEM exceção por plano: a rota é pública,
    // então uma chave livre viraria porta dos fundos para autorizar recorrência
    // barata e registrar a venda cheia na gestão.
    const conferencia = await conferirToken(token)
    if (!conferencia.ok) {
      return NextResponse.json({ error: mensagemDoMotivo(conferencia.motivo) }, { status: 403 })
    }

    // ─── Cupom ────────────────────────────────────────────────────────────
    // Só passa o cupom marcado no painel como válido para Pix Automático. Os
    // demais seguem recusados: o desconto do cartão nasce numa assinatura que
    // o site corrige no ciclo seguinte, e aqui o valor é o que o cliente
    // autoriza no app do banco — não há como voltar atrás depois.
    let cupomCodigo: string | null = null
    let valorMensal = plano.valor
    let valorPrimeiraCobranca = plano.valor
    let descontoAplicado = 0

    if (typeof couponCode === "string" && couponCode.trim()) {
      // Pix Automático é sempre o plano mensal: `recurring` no vocabulário das
      // regras do cupom.
      const lookup = await resolverCupom(couponCode, {
        professor: typeof professor === "string" ? professor : "",
        planType: "recurring",
      })
      if (!lookup.ok) {
        return NextResponse.json({ error: lookup.error }, { status: lookup.status })
      }
      if (!lookup.coupon.pixAutomatico) {
        return NextResponse.json(
          {
            error:
              "Este cupom não vale no Pix Automático. Remova o cupom ou finalize com cartão de crédito.",
          },
          { status: 400 },
        )
      }

      const conta = calcularDesconto(plano.valor, lookup.coupon)
      if ("error" in conta) {
        return NextResponse.json({ error: conta.error }, { status: 400 })
      }

      cupomCodigo = String(couponCode).toUpperCase().trim()
      descontoAplicado = conta.discount
      // `firstMonthOnly` desconta só o QR de hoje; o débito autorizado segue
      // cheio. Sem a marca, o desconto entra no valor recorrente — e vale para
      // sempre, porque a autorizacao do banco nao muda depois.
      valorPrimeiraCobranca = conta.finalValue
      valorMensal = lookup.coupon.firstMonthOnly ? plano.valor : conta.finalValue
    }

    const headers = asaasHeaders()

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
      value: valorMensal,
      startDate,
      // contractId é o identificador do contrato do nosso lado (máx. 35 chars).
      // O Asaas corta em 35 chars e esse texto aparece para o cliente no app
      // do banco, então o prefixo é curto para o timestamp nao ser truncado.
      contractId: `SOMMA-${Date.now()}`,
      // description também é limitada a 35 caracteres pelo Asaas.
      description: plano.descricao.slice(0, 35),
      // O Asaas gera as cobranças de cada ciclo sozinho depois da ativação.
      paymentCreationMode: "SUBSCRIPTION",
      // Retentativas só podem ser habilitadas na criação, nunca depois.
      retryPolicy: "ALLOW_THREE_IN_SEVEN_DAYS",
      immediateQrCode: {
        // 24h de validade: se o QR expirar sem pagamento a autorização vai
        // para REFUSED e todo o fluxo precisa ser refeito.
        expirationSeconds: 86400,
        originalValue: valorPrimeiraCobranca,
      },
    }

    // Consome o código ANTES de falar com o Asaas: é o consumo atômico que
    // impede dois checkouts simultâneos de usarem o mesmo código. Se a criação
    // falhar depois, devolvemos o código (o cliente não perde a liberação por
    // um erro que não foi dele).
    const consumo = await consumirToken(token, { customerId, nome: professor })
    if (!consumo.ok) {
      return NextResponse.json({ error: mensagemDoMotivo(consumo.motivo) }, { status: 403 })
    }

    console.log("[Asaas] Criando autorização de Pix Automático:", {
      customerId,
      planKey: planKey ?? "teste",
      valor: valorMensal,
      primeiraCobranca: valorPrimeiraCobranca,
      cupom: cupomCodigo ?? "-",
      professor: professor ?? "-",
      startDate,
    })

    const res = await fetch(`${ASAAS_API_URL}/pix/automatic/authorizations`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const data: AutorizacaoResponse = await res.json()

    if (!res.ok) {
      console.error("[Asaas] Erro na autorização de Pix Automático:", data)
      await devolverToken(token)
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
      await devolverToken(token)
      return NextResponse.json(
        { error: "A autorização foi criada, mas o QR Code não veio. Tente novamente." },
        { status: 502 },
      )
    }

    console.log("[Asaas] Autorização criada:", data.id, "status:", data.status)

    // Depois do QR na mão do cliente, como no cartão: tentativa que morreu
    // antes daqui não gasta o cupom de ninguém.
    if (cupomCodigo) {
      await registrarUsoDoCupom(cupomCodigo, {
        desconto: descontoAplicado,
        professor: typeof professor === "string" ? professor : undefined,
        customerId,
        authorizationId: data.id,
      })
    }

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
      // O que a tela mostra: o débito mensal e, quando diferem, o valor do QR
      // de hoje. Devolver só `plano.valor` faria a tela anunciar o preço cheio
      // logo depois de aplicar um desconto.
      value: valorMensal,
      primeiraCobranca: valorPrimeiraCobranca,
      cupom: cupomCodigo,
      desconto: descontoAplicado,
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
    const url = new URL(request.url)
    const authorizationId = url.searchParams.get("authorizationId")

    if (!authorizationId) {
      return NextResponse.json({ error: "authorizationId é obrigatório" }, { status: 400 })
    }
    // O id vai direto no path da API do Asaas: sem validar, uma barra no valor
    // sai do recurso e alcança qualquer GET da conta com a nossa chave.
    if (!/^[A-Za-z0-9-]{1,60}$/.test(authorizationId)) {
      return NextResponse.json({ error: "authorizationId inválido" }, { status: 400 })
    }

    const res = await fetch(`${ASAAS_API_URL}/pix/automatic/authorizations/${encodeURIComponent(authorizationId)}`, {
      headers: asaasHeaders(),
    })

    const data: AutorizacaoResponse = await res.json()

    if (!res.ok) {
      console.error("[Asaas] Erro ao consultar autorização:", data)
      return NextResponse.json({ error: friendlyError(data) }, { status: res.status })
    }

    const active = data.status === "ACTIVE"

    // Entre pagar o QR e a autorização ficar ativa existe uma janela de alguns
    // minutos. Sinalizar essa fase evita que a tela pareça travada — mas só
    // com prova de liquidação, nunca por palpite: a tela usa este campo para
    // esconder o QR Code, então um falso positivo deixa o cliente sem como
    // pagar. A consulta extra é opcional (`verificarPagamento`) para o polling
    // de 3s não dobrar o número de chamadas à API do Asaas.
    const conciliationIdentifier = data.immediateQrCode?.conciliationIdentifier
    const querVerificar = url.searchParams.get("verificarPagamento") === "true"
    const paymentDetected =
      active ||
      (querVerificar && !!conciliationIdentifier && (await qrImediatoPago(conciliationIdentifier)))

    return NextResponse.json({
      id: data.id,
      status: data.status,
      subscriptionId: data.subscriptionId ?? null,
      active,
      paymentDetected,
      failed: data.status === "REFUSED" || data.status === "CANCELLED" || data.status === "EXPIRED",
    })
  } catch (error) {
    console.error("[Asaas] Erro ao consultar autorização:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
