"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Loader2, Check, AlertCircle, Lock, QrCode, Copy, RefreshCw, Zap } from "lucide-react"
import Image from "next/image"

// Checkout de TESTE das duas modalidades de PIX recorrente do Asaas:
//
// - "automatico": Pix Automático (Jornada 3). Um QR único junta a 1ª cobrança
//   com o consentimento; depois o banco do cliente debita sozinho todo mês.
// - "manual": assinatura com billingType PIX. O Asaas gera uma cobrança nova
//   por ciclo e o cliente paga um QR novo a cada mês.
//
// Página isolada do checkout oficial: professor fixo, sem cupom, sem contrato,
// sem gravação na gestão — só o fluxo Asaas.

type Metodo = "automatico" | "manual"

interface Professor {
  id: string
  nome: string
  instagram: string
  link_foto: string
  telefone: string
}

interface CheckoutPixRecorrenteFormProps {
  professor: Professor | null
  planName: string
  planValue: number
}

interface CustomerData {
  name: string
  email: string
  cpfCnpj: string
  phone: string
}

function formatCPF(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 11)
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function formatPhone(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
}

function fmtBRL(value: number) {
  return value.toFixed(2).replace(".", ",")
}

function fmtClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function CheckoutPixRecorrenteForm({ professor, planName, planValue }: CheckoutPixRecorrenteFormProps) {
  const [pageState, setPageState] = useState<"form" | "processing" | "pix" | "success" | "error">("form")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "", email: "", cpfCnpj: "", phone: "",
  })

  const [metodo, setMetodo] = useState<Metodo>("automatico")
  const [authorizationId, setAuthorizationId] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [pixExpiration, setPixExpiration] = useState<string | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [pollExpired, setPollExpired] = useState(false)
  const [pollRestart, setPollRestart] = useState(0)
  // Espera do pagamento: o cliente precisa ver que algo está acontecendo. No
  // Pix Automático a confirmação pode levar alguns minutos (pagamento liquida,
  // depois o banco ativa a autorização), e tela parada parece erro.
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [paymentDetected, setPaymentDetected] = useState(false)
  // O Pix Automático exige código de liberação também aqui: a rota é pública e
  // uma exceção por plano viraria porta dos fundos.
  const [tokenCodigo, setTokenCodigo] = useState("")
  const [tokenErro, setTokenErro] = useState<string | null>(null)

  // Reaproveita o cliente Asaas em caso de retry com os MESMOS dados: evita
  // duplicar cadastros quando a assinatura falha e o usuário tenta de novo.
  // Qualquer campo alterado (nome, e-mail, telefone, CPF) recria o cliente.
  const customerRef = useRef<{ fingerprint: string; id: string } | null>(null)

  // ─── Cronômetro da espera ────────────────────────────────────────────────
  // Conta enquanto a tela do QR está aberta, para o cliente ver movimento
  // mesmo antes de qualquer resposta do Asaas.
  useEffect(() => {
    if (pageState !== "pix") return
    const tick = setInterval(() => setWaitSeconds((s) => s + 1), 1000)
    return () => clearInterval(tick)
  }, [pageState])

  // ─── Polling ──────────────────────────────────────────────────────────────
  // No Pix Automático o que prova o teste é a AUTORIZAÇÃO virar ACTIVE (é ela
  // que autoriza os débitos futuros); no PIX manual basta a cobrança ser paga.
  useEffect(() => {
    if (pageState !== "pix") return
    const alvo = metodo === "automatico" ? authorizationId : pixPaymentId
    if (!alvo) return

    let pollInterval: NodeJS.Timeout | null = null
    let attempts = 0
    let consecutiveFailures = 0
    // Teto de ~20 min (400 x 3s), igual ao checkout oficial.
    const MAX_ATTEMPTS = 400
    // Erro persistente na consulta (id inválido, chave da API fora do ar) não
    // pode deixar o usuário 20 min olhando um QR que nunca vai confirmar.
    const MAX_CONSECUTIVE_FAILURES = 10

    const stop = () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    const checkStatus = async () => {
      attempts++
      try {
        const url =
          metodo === "automatico"
            ? `/api/asaas/pix-automatico?authorizationId=${alvo}`
            : `/api/asaas/payment-status?paymentId=${alvo}`
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok) {
          console.error("Erro ao verificar status:", data.error)
          consecutiveFailures++
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            stop()
            setError(
              "Não foi possível confirmar o pagamento junto ao Asaas. Se o valor já saiu da sua conta, confira o painel antes de tentar de novo.",
            )
            setPageState("error")
          }
          return
        }
        consecutiveFailures = 0

        if (metodo === "automatico") {
          // Pagamento já caiu, autorização ainda sendo ativada pelo banco.
          if (data.paymentDetected) setPaymentDetected(true)

          if (data.active) {
            stop()
            setSubscriptionId(data.subscriptionId || null)
            setPageState("success")
          } else if (data.failed) {
            stop()
            setError(
              data.status === "CANCELLED"
                ? "A autorização foi cancelada, seja pelo seu banco, seja no painel do Asaas."
                : data.status === "REFUSED"
                  ? "A autorização não foi aceita. Isso costuma acontecer quando o QR Code expira sem pagamento ou quando o banco do pagador não suporta Pix Automático."
                  : `A autorização foi encerrada (status ${data.status}).`,
            )
            setPageState("error")
          }
        } else if (data.paid) {
          stop()
          setPageState("success")
        }
      } catch (err) {
        console.error("Erro no polling:", err)
        consecutiveFailures++
      } finally {
        if (attempts >= MAX_ATTEMPTS) {
          stop()
          setPollExpired(true)
          console.warn("[teste-pix] Polling encerrado após o limite de tentativas.")
        }
      }
    }

    checkStatus()
    pollInterval = setInterval(checkStatus, 3000)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pageState, metodo, authorizationId, pixPaymentId, pollRestart])

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setPageState("processing")

    try {
      // 1. Cliente no Asaas (reaproveitado só se nenhum dado mudou desde o último envio)
      const fingerprint = [
        customerData.name.trim(),
        customerData.email.trim().toLowerCase(),
        customerData.cpfCnpj.replace(/\D/g, ""),
        customerData.phone.replace(/\D/g, ""),
      ].join("|")
      let asaasCustomerId =
        customerRef.current?.fingerprint === fingerprint ? customerRef.current.id : null

      if (!asaasCustomerId) {
        const customerRes = await fetch("/api/asaas/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...customerData, professor: professor?.nome || "" }),
        })
        const customerResult = await customerRes.json()
        if (!customerRes.ok) throw new Error(customerResult.error || "Erro ao salvar dados")
        asaasCustomerId = customerResult.id as string
        customerRef.current = { fingerprint, id: asaasCustomerId }
      }

      if (metodo === "automatico") {
        // 2a. Pix Automático: a autorização já nasce com o QR imediato, que
        // cobra a 1ª mensalidade e coleta o consentimento da recorrência.
        const autoRes = await fetch("/api/asaas/pix-automatico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: asaasCustomerId,
            planKey: "teste",
            token: tokenCodigo.trim(),
          }),
        })
        const autoResult = await autoRes.json()
        if (!autoRes.ok) throw new Error(autoResult.error || "Erro ao criar o Pix Automático")

        setAuthorizationId(autoResult.authorizationId)
        setSubscriptionId(autoResult.subscriptionId || null)
        setPixPaymentId(null)
        setPixQrCode(autoResult.encodedImage || null)
        setPixPayload(autoResult.payload)
        setPixExpiration(autoResult.expirationDate || null)
      } else {
        // 2b. Assinatura mensal via PIX: a rota devolve a 1ª cobrança já com o
        // QR Code resolvido (e desfaz a assinatura no Asaas se algo falhar).
        const subRes = await fetch("/api/asaas/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: asaasCustomerId,
            type: "pix-recurring",
            description: `Somma Assessoria - Plano ${planName} PIX Recorrente (TESTE) | Prof: ${professor?.nome || "-"}`,
          }),
        })
        const subResult = await subRes.json()
        if (!subRes.ok) throw new Error(subResult.error || "Erro ao criar assinatura PIX")

        const paymentId = subResult.firstPayment?.id
        if (!paymentId || !subResult.pixQrCode?.payload) {
          throw new Error("Assinatura criada, mas a cobrança PIX não foi localizada.")
        }

        setAuthorizationId(null)
        setSubscriptionId(subResult.subscription?.id || null)
        setPixPaymentId(paymentId)
        setPixQrCode(subResult.pixQrCode.encodedImage)
        setPixPayload(subResult.pixQrCode.payload)
        setPixExpiration(subResult.pixQrCode.expirationDate)
      }

      setPollExpired(false)
      setWaitSeconds(0)
      setPaymentDetected(false)
      setPageState("pix")
    } catch (err: any) {
      setError(err.message)
      setPageState("error")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/[0.03] border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#32bcad] focus:bg-white/[0.05] transition-all"

  // ─── PIX ─────────────────────────────────────────────────────────────────
  if (pageState === "pix") {
    const formattedExpiration = pixExpiration
      ? new Date(pixExpiration).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null

    const handleCopyPix = async () => {
      if (!pixPayload) return
      await navigator.clipboard.writeText(pixPayload)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 3000)
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#32bcad]/10 border border-[#32bcad]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-[#32bcad]" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-light text-white mb-2">
              {metodo === "automatico" ? "Pix Automático" : "Assinatura via PIX"}
            </h1>
            <p className="text-sm text-white/50">
              {metodo === "automatico"
                ? "Ao pagar este QR Code você também autoriza os débitos mensais no seu banco"
                : "Pague a primeira mensalidade para ativar a assinatura"}
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">
            {/* Status da espera: enquanto não confirma, a tela precisa mostrar
                movimento — senão o cliente acha que travou e paga de novo. */}
            {!pollExpired && (
              <div
                className={`rounded-xl border p-4 ${
                  paymentDetected
                    ? "border-[#32bcad]/40 bg-[#32bcad]/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Loader2
                    className={`w-5 h-5 flex-shrink-0 animate-spin ${
                      paymentDetected ? "text-[#32bcad]" : "text-white/40"
                    }`}
                  />
                  <div className="flex-grow min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        paymentDetected ? "text-[#32bcad]" : "text-white"
                      }`}
                    >
                      {paymentDetected
                        ? metodo === "automatico"
                          ? "Pagamento recebido! Ativando o débito automático..."
                          : "Pagamento recebido! Confirmando..."
                        : "Aguardando o pagamento"}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {paymentDetected
                        ? "Não feche esta tela. A confirmação pode levar alguns minutos."
                        : "Esta tela atualiza sozinha quando o pagamento cair."}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-white/40 tabular-nums flex-shrink-0">
                    {fmtClock(waitSeconds)}
                  </span>
                </div>
              </div>
            )}

            {pixQrCode && !paymentDetected && (
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl">
                  <img
                    src={`data:image/png;base64,${pixQrCode}`}
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                    className="block"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 text-center">
              <p className="text-3xl font-light text-white">R$ {fmtBRL(planValue)}</p>
              <p className="text-xs text-white/40">
                Plano {planName} ·{" "}
                {metodo === "automatico" ? "1ª mensalidade + autorização" : "assinatura recorrente via PIX"}
              </p>
              {formattedExpiration && !paymentDetected && (
                <p className="text-xs text-white/30">Válido até {formattedExpiration}</p>
              )}
            </div>

            {pixPayload && !paymentDetected && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 text-center">Ou copie o código PIX:</p>
                <div className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-xs text-white/50 font-mono break-all leading-relaxed">
                    {pixPayload}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-[#32bcad]/10 hover:bg-[#32bcad]/20 border border-[#32bcad]/30 text-[#32bcad] font-medium rounded-lg transition-colors"
                >
                  {pixCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Código copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar código PIX
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Check className="w-4 h-4 text-[#32bcad] flex-shrink-0 mt-0.5" />
                <p className="text-white/50">
                  {metodo === "automatico"
                    ? "Esta tela confirma sozinha quando a autorização for ativada pelo seu banco."
                    : "A confirmação é automática assim que o banco processar o pagamento."}
                </p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                {metodo === "automatico" ? (
                  <Zap className="w-4 h-4 text-[#32bcad] flex-shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-[#32bcad] flex-shrink-0 mt-0.5" />
                )}
                <p className="text-white/50">
                  {metodo === "automatico"
                    ? "Depois disso o valor é debitado da sua conta todo mês, sem QR Code novo."
                    : "Todo mês uma nova cobrança PIX é gerada e enviada por e-mail."}
                </p>
              </div>
              {metodo === "automatico" && (
                <div className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5" />
                  <p className="text-white/50">
                    Pague pelo app do banco (não pela carteira digital). O banco do pagador precisa
                    suportar Pix Automático.
                  </p>
                </div>
              )}
              {pollExpired && (
                <button
                  type="button"
                  onClick={() => { setPollExpired(false); setPollRestart((n) => n + 1) }}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Já paguei, verificar novamente
                </button>
              )}
            </div>
          </div>

          {(authorizationId || subscriptionId) && (
            <p className="text-center text-[10px] text-white/20 font-mono mt-4">
              {authorizationId ? `Autorização: ${authorizationId}` : `Assinatura: ${subscriptionId}`}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── PROCESSING ──────────────────────────────────────────────────────────
  if (pageState === "processing") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-[#32bcad] animate-spin mx-auto mb-8" />
          <h2 className="text-2xl font-light text-white mb-3">
            {metodo === "automatico" ? "Criando sua autorização" : "Criando sua assinatura"}
          </h2>
          <p className="text-sm text-white/60">
            {metodo === "automatico"
              ? "Gerando o QR Code de pagamento e autorização..."
              : "Gerando a cobrança PIX da primeira mensalidade..."}
          </p>
        </div>
      </div>
    )
  }

  // ─── SUCCESS ─────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#32bcad]/10 border border-[#32bcad]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#32bcad]" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-light text-white mb-3">
            {metodo === "automatico" ? "Débito automático ativo!" : "Pagamento confirmado!"}
          </h1>
          <p className="text-white/50 mb-2">
            {metodo === "automatico"
              ? `A autorização de Pix Automático do Plano ${planName} está ativa.`
              : `A assinatura do Plano ${planName} via PIX recorrente está ativa.`}
          </p>
          <p className="text-sm text-white/40 mb-8">
            {metodo === "automatico"
              ? `A partir do mês que vem, R$ ${fmtBRL(planValue)} são debitados da sua conta automaticamente, sem QR Code novo. Você pode revogar a autorização no app do seu banco quando quiser.`
              : `A próxima mensalidade de R$ ${fmtBRL(planValue)} vence no mesmo dia do mês que vem e o link de pagamento chega por e-mail antes do vencimento.`}
          </p>
          {(authorizationId || subscriptionId) && (
            <p className="text-xs text-white/25 font-mono mb-8">
              {authorizationId ? `Autorização: ${authorizationId}` : `Assinatura: ${subscriptionId}`}
            </p>
          )}
          <a
            href="/"
            className="block w-full py-3 text-center bg-white/10 hover:bg-white/15 text-white font-light rounded-xl transition-colors"
          >
            Voltar ao site
          </a>
        </div>
      </div>
    )
  }

  // ─── ERROR ───────────────────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">
            {metodo === "automatico" ? "Não foi possível ativar" : "Erro ao criar assinatura"}
          </h2>
          <p className="text-sm text-white/50 mb-8">{error || "Ocorreu um erro ao processar."}</p>
          <button
            onClick={() => { setPageState("form"); setError(null) }}
            className="w-full py-3 bg-[#32bcad] hover:bg-[#2aa89b] text-black font-medium rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // ─── FORM ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/">
            <Image
              src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/Logo_Nova_Somma_Branca_Laranja.svg"
              alt="Somma"
              width={110}
              height={32}
              className="h-8 w-auto"
            />
          </a>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Lock className="w-3.5 h-3.5" />
            <span>Checkout seguro</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Aviso de teste */}
        <div className="mb-8 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-400 text-center uppercase tracking-wider">
            Página de teste · PIX recorrente
          </p>
        </div>

        {/* Resumo do plano */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Assessoria Somma</p>
              <p className="text-lg font-medium text-white">Plano {planName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light text-white">R$ {fmtBRL(planValue)}</p>
              <p className="text-xs text-white/40">por mês</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/10 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider">Forma de pagamento</p>

            <button
              type="button"
              onClick={() => setMetodo("automatico")}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                metodo === "automatico"
                  ? "border-[#32bcad] bg-[#32bcad]/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <Zap
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    metodo === "automatico" ? "text-[#32bcad]" : "text-white/40"
                  }`}
                />
                <div className="flex-grow">
                  <p className="text-sm font-medium text-white">Pix Automático</p>
                  <p className="text-xs text-white/50 mt-1">
                    Você autoriza uma vez e o valor é debitado da sua conta todo mês, igual a débito
                    automático.
                  </p>
                </div>
                {metodo === "automatico" && <Check className="w-4 h-4 text-[#32bcad] flex-shrink-0" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMetodo("manual")}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                metodo === "manual"
                  ? "border-[#32bcad] bg-[#32bcad]/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <RefreshCw
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    metodo === "manual" ? "text-[#32bcad]" : "text-white/40"
                  }`}
                />
                <div className="flex-grow">
                  <p className="text-sm font-medium text-white">PIX recorrente (manual)</p>
                  <p className="text-xs text-white/50 mt-1">
                    Uma cobrança nova por mês, enviada por e-mail. Você paga um QR Code a cada
                    mensalidade.
                  </p>
                </div>
                {metodo === "manual" && <Check className="w-4 h-4 text-[#32bcad] flex-shrink-0" />}
              </div>
            </button>
          </div>

          {metodo === "automatico" && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <p className="text-xs text-white/40">
                Código de liberação (gerado em /admin/pix-automatico)
              </p>
              <input
                type="text"
                value={tokenCodigo}
                onChange={(e) => { setTokenCodigo(e.target.value.toUpperCase()); setTokenErro(null) }}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className={`w-full px-4 py-3 bg-white/[0.03] border rounded-lg text-base sm:text-sm text-white placeholder-white/25 focus:outline-none transition-all uppercase font-mono tracking-wider ${
                  tokenErro ? "border-red-500/50" : "border-white/10 focus:border-[#32bcad]"
                }`}
              />
              {tokenErro && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{tokenErro}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Professor fixo */}
        {professor && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={professor.link_foto}
                alt={professor.nome}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Seu professor</p>
              <p className="text-sm font-medium text-white">{professor.nome}</p>
            </div>
            <Check className="w-5 h-5 text-[#32bcad] ml-auto" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
              Seus dados
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <input
                type="text" required
                value={customerData.name}
                onChange={(e) => setCustomerData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome completo"
                className={inputClass}
              />
              <input
                type="email" required
                value={customerData.email}
                onChange={(e) => setCustomerData((p) => ({ ...p, email: e.target.value }))}
                placeholder="E-mail"
                className={inputClass}
                autoComplete="email"
              />
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <input
                  type="text" required
                  value={customerData.cpfCnpj}
                  onChange={(e) => setCustomerData((p) => ({ ...p, cpfCnpj: formatCPF(e.target.value) }))}
                  placeholder="CPF"
                  className={inputClass}
                  inputMode="numeric"
                />
                <input
                  type="text" required
                  value={customerData.phone}
                  onChange={(e) => setCustomerData((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="WhatsApp"
                  className={inputClass}
                  inputMode="tel"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 flex items-center justify-center gap-2 bg-[#32bcad] hover:bg-[#2aa89b] disabled:opacity-50 text-black font-semibold rounded-xl transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Assinar com PIX · R$ {fmtBRL(planValue)}/mês
              </>
            )}
          </button>

          <p className="text-xs text-white/30 text-center">
            <Lock className="w-3 h-3 inline mr-1" />
            Após o pagamento da 1ª mensalidade, as próximas cobranças chegam por e-mail todo mês.
          </p>
        </form>
      </div>
    </div>
  )
}
