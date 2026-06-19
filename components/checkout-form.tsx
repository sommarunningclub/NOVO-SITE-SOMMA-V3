"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  CreditCard,
  Loader2,
  Check,
  AlertCircle,
  Lock,
  ShieldCheck,
  Tag,
  QrCode,
  Copy,
} from "lucide-react"
import Image from "next/image"
import { ParqForm } from "./parq-form"
import { ContratoCheckbox } from "./contrato-checkbox"

interface Plan {
  name: string
  period: string
  price: number
  total: number
  installments: number
  type: "recurring" | "installment"
}

interface CheckoutFormProps {
  plan: Plan
  initialProfessors: Professor[]
}

interface CustomerData {
  name: string
  email: string
  cpfCnpj: string
  phone: string
  postalCode: string
  addressNumber: string
  street: string
  neighborhood: string
  city: string
  state: string
}

interface CreditCardData {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

interface CepResponse {
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
}

interface CouponData {
  valid: boolean
  coupon: {
    code: string
    type: "PERCENTAGE" | "FIXED"
    value: number
    description: string
  }
  calculation: {
    originalValue: number
    discount: number
    finalValue: number
  }
  asaasDiscount: {
    value: number
    dueDateLimitDays: number
    type: string
  }
}

interface Professor {
  id: string
  nome: string
  instagram: string
  link_foto: string
  telefone: string
}

const SHIRT_SIZES = ["P", "M", "G", "GG", "XG"]

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

function formatCEP(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 8)
  return n.replace(/(\d{5})(\d)/, "$1-$2")
}

function formatCardNumber(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 16)
  return n.replace(/(\d{4})(?=\d)/g, "$1 ")
}

function fmtBRL(value: number) {
  return value.toFixed(2).replace(".", ",")
}

export function CheckoutForm({ plan, initialProfessors }: CheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageState, setPageState] = useState<"form" | "processing" | "success" | "error" | "pix">("form")
  const [contratoAceito, setContratoAceito] = useState(false)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  const [professors, setProfessors] = useState<Professor[]>(initialProfessors)
  const [professor, setProfessor] = useState("")
  const [shirtSize, setShirtSize] = useState("")
  const [installments, setInstallments] = useState(plan.installments)

  const [couponCode, setCouponCode] = useState("")
  const [couponData, setCouponData] = useState<CouponData | null>(null)
  const [isCouponLoading, setIsCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "", email: "", cpfCnpj: "", phone: "",
    postalCode: "", addressNumber: "", street: "", neighborhood: "", city: "", state: "",
  })

  const [cardData, setCardData] = useState<CreditCardData>({
    holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "",
  })

  // ─── PIX ──────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card")
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [pixExpiration, setPixExpiration] = useState<string | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null)

  const baseTotalForInstallments = plan.type === "installment" ? (plan.total / plan.installments) * installments : plan.total
  const discountedPrice = couponData ? couponData.calculation.finalValue : plan.price
  const discountAmount = couponData ? couponData.calculation.discount : 0
  const discountedTotal = couponData ? baseTotalForInstallments - discountAmount * installments : baseTotalForInstallments
  const pixTotalValue = couponData ? plan.total - couponData.calculation.discount * plan.installments : plan.total

  // ─── CEP ─────────────────────────────────────────────────────────────────
  const fetchAddressByCep = async (cep: string) => {
    setIsCepLoading(true)
    setCepError(null)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`)
      if (!res.ok) throw new Error()
      const data: CepResponse = await res.json()
      setCustomerData((prev) => ({
        ...prev,
        street: data.street || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
      }))
    } catch {
      setCepError("CEP nao encontrado.")
    } finally {
      setIsCepLoading(false)
    }
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value)
    setCustomerData((prev) => ({ ...prev, postalCode: formatted }))
    const clean = value.replace(/\D/g, "")
    if (clean.length === 8) fetchAddressByCep(clean)
    else setCepError(null)
  }

  // ─── Coupon ───────────────────────────────────────────────────────────────
  const validateCoupon = async () => {
    if (!couponCode.trim()) { setCouponError("Digite um cupom"); return }
    setIsCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch(`/api/checkout/validate-coupon?code=${encodeURIComponent(couponCode)}&value=${plan.price}&professor=${encodeURIComponent(professor)}&planType=${encodeURIComponent(plan.type)}`)
      const data = await res.json()
      if (!data.valid) { setCouponError(data.error || "Cupom invalido"); setCouponData(null); return }
      setCouponData(data)
    } catch {
      setCouponError("Erro ao validar cupom")
    } finally {
      setIsCouponLoading(false)
    }
  }

  // ─── PIX Payment Polling ──────────────────────────────────────────────────
  useEffect(() => {
    if (pageState !== "pix" || !pixPaymentId) return

    let pollInterval: NodeJS.Timeout | null = null

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/asaas/payment-status?paymentId=${pixPaymentId}`)
        const data = await res.json()

        if (!res.ok) {
          console.error("Erro ao verificar status:", data.error)
          return
        }

        // Se pagamento foi confirmado, ir para tela de sucesso
        if (data.paid) {
          if (pollInterval) clearInterval(pollInterval)
          setPageState("success")
        }
      } catch (err) {
        console.error("Erro no polling:", err)
      }
    }

    // Verificar imediatamente
    checkPaymentStatus()

    // Depois verificar a cada 3 segundos
    pollInterval = setInterval(checkPaymentStatus, 3000)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pageState, pixPaymentId])

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!contratoAceito) {
      setError("É preciso ler e aceitar o Contrato de Prestação de Serviços.")
      return
    }
    setIsLoading(true)
    setError(null)
    setPageState("processing")

    try {
      // 1. Create customer
      const customerRes = await fetch("/api/asaas/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customerData, professor }),
      })
      const customerResult = await customerRes.json()
      if (!customerRes.ok) throw new Error(customerResult.error || "Erro ao salvar dados")

      // Vínculo aluno↔professor (base do repasse, espelha GESTÃO). Best-effort: não bloqueia o checkout.
      fetch("/api/professores/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor_nome: professor,
          asaas_customer_id: customerResult.id,
          customer_name: customerData.name,
          customer_email: customerData.email,
          customer_cpf_cnpj: customerData.cpfCnpj?.replace(/\D/g, ""),
          tag: "alunoprofessor",
        }),
      }).catch(() => {})

      // 2a. PIX à vista — novo fluxo
      if (paymentMethod === "pix" && plan.type === "installment") {
        const pixPaymentRes = await fetch("/api/asaas/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: customerResult.id,
            type: "pix",
            pixValue: pixTotalValue,
            description: `Somma Assessoria - Plano ${plan.name} PIX | Prof: ${professor} | Camiseta: ${shirtSize}${couponData ? ` | Cupom: ${couponData.coupon.code}` : ""}`,
          }),
        })
        const pixPaymentResult = await pixPaymentRes.json()
        if (!pixPaymentRes.ok) throw new Error(pixPaymentResult.error || "Erro ao gerar PIX")

        const paymentId = pixPaymentResult.payment.id

        // Buscar QR Code PIX
        const pixQrRes = await fetch(`/api/asaas/pix?paymentId=${paymentId}`)
        const pixQrData = await pixQrRes.json()
        if (!pixQrRes.ok) throw new Error(pixQrData.error || "Erro ao gerar QR Code PIX")

        setPixPaymentId(paymentId)
        setPixQrCode(pixQrData.encodedImage)
        setPixPayload(pixQrData.payload)
        setPixExpiration(pixQrData.expirationDate)

        // Salvar no Supabase com status "Aguardando PIX"
        await fetch("/api/supabase/cliente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: customerData.name,
            email: customerData.email,
            telefone: customerData.phone,
            cpf: customerData.cpfCnpj,
            rua: customerData.street,
            numero: customerData.addressNumber,
            bairro: customerData.neighborhood,
            cidade: customerData.city,
            cep: customerData.postalCode,
            estado: customerData.state,
            veste: shirtSize || null,
            professor: professor || null,
            tipo_plano: plan.name,
            valor: pixTotalValue,
            forma_pagamento: "PIX",
            status_pagamento: "Aguardando PIX",
          }),
        })

        setPageState("pix")
        setIsLoading(false)
        return
      }

      // 2b. Cartão — fluxo existente
      const ipRes = await fetch("/api/client-ip")
      const ipData = await ipRes.json()
      const clientIp = ipData.ip || "0.0.0.0"

      const paymentPayload: Record<string, unknown> = {
        customerId: customerResult.id,
        type: plan.type,
        description: `Somma Assessoria - Plano ${plan.name} | Prof: ${professor} | Camiseta: ${shirtSize}${couponData ? ` | Cupom: ${couponData.coupon.code}` : ""}`,
        creditCard: {
          holderName: cardData.holderName,
          number: cardData.number.replace(/\s/g, ""),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv,
        },
        creditCardHolderInfo: {
          name: customerData.name,
          email: customerData.email,
          cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ""),
          postalCode: customerData.postalCode.replace(/\D/g, ""),
          addressNumber: customerData.addressNumber,
          phone: customerData.phone.replace(/\D/g, ""),
        },
        remoteIp: clientIp,
      }

      if (plan.type === "recurring") {
        paymentPayload.value = discountedPrice
      } else {
        paymentPayload.installmentCount = installments
        paymentPayload.installmentValue = discountedPrice
      }

      const paymentRes = await fetch("/api/asaas/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      })
      const paymentResult = await paymentRes.json()
      if (!paymentRes.ok) throw new Error(paymentResult.error || "Erro ao processar pagamento")

      // Salvar cliente na tabela de gestão
      await fetch("/api/supabase/cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: customerData.name,
          email: customerData.email,
          telefone: customerData.phone,
          cpf: customerData.cpfCnpj,
          rua: customerData.street,
          numero: customerData.addressNumber,
          bairro: customerData.neighborhood,
          cidade: customerData.city,
          cep: customerData.postalCode,
          estado: customerData.state,
          veste: shirtSize || null,
          professor: professor || null,
          tipo_plano: plan.name,
          valor: discountedPrice,
          forma_pagamento: "Cartão de Crédito",
          status_pagamento: "Pago",
        }),
      })

      setPageState("success")
    } catch (err: any) {
      setError(err.message)
      setPageState("error")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Input styles ────────────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/[0.03] border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff4f2d] focus:bg-white/[0.05] transition-all"

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
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#32bcad]/10 border border-[#32bcad]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-[#32bcad]" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-light text-white mb-2">Pagamento via PIX</h1>
            <p className="text-sm text-white/50">
              Escaneie o QR Code ou copie o código abaixo
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">
            {/* QR Code */}
            {pixQrCode && (
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

            {/* Valor e vencimento */}
            <div className="space-y-2 text-center">
              <p className="text-3xl font-light text-white">
                R$ {fmtBRL(pixTotalValue)}
              </p>
              <p className="text-xs text-white/40">
                Plano {plan.name} · pagamento à vista
              </p>
              {formattedExpiration && (
                <p className="text-xs text-white/30">
                  Válido até {formattedExpiration}
                </p>
              )}
            </div>

            {/* Código copia e cola */}
            {pixPayload && (
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

            {/* Aviso de confirmação */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-start gap-3 text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-white/50">
                  O acesso será liberado automaticamente após a confirmação do pagamento pelo banco.
                </p>
              </div>
            </div>
          </div>

          {/* Voltar */}
          <a
            href="/"
            className="block w-full py-3 text-center bg-white/10 hover:bg-white/15 text-white font-light rounded-xl transition-colors mt-4"
          >
            Voltar ao site
          </a>
        </div>
      </div>
    )
  }

  // ─── PROCESSING ──────────────────────────────────────────────────────────
  if (pageState === "processing") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          {/* Animated gradient circle */}
          <div className="relative w-24 h-24 mx-auto mb-12">
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: "radial-gradient(circle, #ff2c03 0%, transparent 70%)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute inset-2 rounded-full border border-[#ff2c03]/30"
              style={{
                animation: "spin 3s linear infinite",
              }}
            />
            <div
              className="absolute inset-4 rounded-full border-t border-[#ff2c03]"
              style={{
                animation: "spin 1.5s linear infinite reverse",
              }}
            />
          </div>

          {/* Header */}
          <h2 className="text-2xl font-light text-white mb-3">Processando pagamento</h2>
          <p className="text-sm text-white/60 mb-10">Seu pagamento está sendo validado com segurança</p>

          {/* Progress steps */}
          <div className="space-y-4">
            {(paymentMethod === "pix"
              ? [
                  { label: "Validando dados", delay: "0s" },
                  { label: "Gerando cobrança PIX", delay: "0.8s" },
                  { label: "Criando QR Code", delay: "1.6s" },
                ]
              : [
                  { label: "Validando dados", delay: "0s" },
                  { label: "Processando cartão", delay: "0.8s" },
                  { label: "Confirmando assinatura", delay: "1.6s" },
                ]
            ).map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ff2c03]"
                  style={{
                    animation: `pulse 1.4s ease-in-out infinite`,
                    animationDelay: step.delay,
                  }}
                />
                <span className="text-xs text-white/50 flex-grow text-left">{step.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/30 mt-10">
            <Lock className="w-3 h-3 inline mr-1" />
            Todas as transações são criptografadas
          </p>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ─── SUCCESS ─────────────────────────────────────────────────────────────
  if (pageState === "success") {
    const professorData = professors.find(p => p.nome === professor)
    const professorPhone = professorData?.telefone || ""
    const whatsappProfessor = professorPhone ? `https://wa.me/${professorPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, acabei de adiquirir a Assessoria Somma ${plan.name}.`)}` : ""
    const whatsappConcierge = "https://wa.me/61995372477?text=" + encodeURIComponent("Olá, acabei de adiquirir a assessoria somma e tenho algumas dúvidas, pode me ajudar?")

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Success banner */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-light text-white mb-2">Bem-vindo a Somma!</h1>
            <p className="text-white/50">Sua assinatura do Plano {plan.name} foi ativada com sucesso.</p>
          </div>

          {/* Par-Q — anamnese pós-compra, salva no cadastro do aluno pelo CPF */}
          <ParqForm cpf={customerData.cpfCnpj} />

          {/* Kit Assessoria */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
            <h2 className="text-sm font-medium text-white mb-6 uppercase tracking-wider">Kit Assessoria Somma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://loja.sommaclub.com.br/products/kit-assessoria-somma-club"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-white/10 rounded-xl hover:border-[#ff4f2d]/50 hover:bg-white/[0.02] transition-all group"
              >
                <p className="text-xs text-white/50 mb-2 group-hover:text-white/70">KIT COMPLETO</p>
                <p className="text-sm font-medium text-white mb-2">Ecobag + Camisa</p>
                <p className="text-xs text-white/40 line-through mb-1">De R$ 125,00</p>
                <p className="text-lg font-semibold text-[#ff4f2d]">por R$ 80,00</p>
                <p className="text-xs text-white/50 mt-3">Cupom: ALUNOASSESSORIA</p>
              </a>
              <a
                href="https://loja.sommaclub.com.br/products/camisa-assessoria-somma-club"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-white/10 rounded-xl hover:border-[#ff4f2d]/50 hover:bg-white/[0.02] transition-all group"
              >
                <p className="text-xs text-white/50 mb-2 group-hover:text-white/70">APENAS CAMISA</p>
                <p className="text-sm font-medium text-white mb-3">Camisa Assessoria</p>
                <p className="text-xs text-white/50">Clique para comprar</p>
              </a>
            </div>
          </div>

          {/* Contato - Professor e Concierge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Professor */}
            {professorData && (
              <a
                href={whatsappProfessor}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-[#ff4f2d]/50 hover:bg-white/[0.05] transition-all text-center"
              >
                <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Conecte com seu professor</p>
                <p className="text-sm font-medium text-white mb-4">{professorData.nome}</p>
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BA58] rounded-lg transition-colors w-full">
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.687.733 5.308 2.122 7.618L2.06 23.766l8.25-2.166c2.213 1.201 4.708 1.86 7.332 1.86 5.736 0 10.562-4.652 10.562-10.38 0-2.777-1.132-5.388-3.188-7.36A10.56 10.56 0 0012.051 6.979z" />
                  </svg>
                  <span className="text-sm font-semibold">Enviar mensagem</span>
                </div>
              </a>
            )}

            {/* Concierge */}
            <a
              href={whatsappConcierge}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-[#ff4f2d]/50 hover:bg-white/[0.05] transition-all text-center"
            >
              <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Dúvidas?</p>
              <p className="text-sm font-medium text-white mb-4">Concierge Somma</p>
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BA58] rounded-lg transition-colors w-full">
                <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.687.733 5.308 2.122 7.618L2.06 23.766l8.25-2.166c2.213 1.201 4.708 1.86 7.332 1.86 5.736 0 10.562-4.652 10.562-10.38 0-2.777-1.132-5.388-3.188-7.36A10.56 10.56 0 0012.051 6.979z" />
                </svg>
                <span className="text-sm font-semibold">Fale conosco</span>
              </div>
            </a>
          </div>

          {/* Voltar ao site */}
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
          <h2 className="text-2xl font-light text-white mb-2">Erro no pagamento</h2>
          <p className="text-sm text-white/50 mb-2">{error || "Ocorreu um erro ao processar seu pagamento."}</p>
          <p className="text-xs text-white/30 mb-8">Verifique os dados do cartao e tente novamente.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setPageState("form"); setError(null) }}
              className="w-full py-3 bg-[#ff4f2d] hover:bg-[#e6452a] text-black font-medium rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-light rounded-xl transition-colors text-center"
            >
              Voltar ao site
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ─── MAIN: Stripe-like single page ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 sm:gap-8 lg:gap-16">

          {/* ── LEFT: Form ──────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-10">

            {/* Professor */}
            <section>
              <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                1. Selecione seu professor
              </h2>
              {professors.length === 0 ? (
                <div className="flex items-center gap-2 text-white/30 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando professores...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {professors.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfessor(p.nome)}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        professor === p.nome
                          ? "border-[#ff4f2d] ring-1 ring-[#ff4f2d]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={p.link_foto}
                          alt={p.nome}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                        {professor === p.nome && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[#ff4f2d] rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-white/[0.02]">
                        <p className="text-sm font-medium text-white">{p.nome}</p>
                        <a
                          href={p.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-[#ff4f2d] hover:underline mt-0.5 inline-block"
                        >
                          @{p.instagram.split("/").filter(Boolean).pop()}
                        </a>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Shirt size — only for semestral/anual */}
            {plan.type === "installment" && (
              <section>
                <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                  2. Tamanho da camiseta
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {SHIRT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setShirtSize(size)}
                      className={`w-14 h-14 rounded-lg border text-sm font-medium transition-all ${
                        shirtSize === size
                          ? "border-[#ff4f2d] bg-[#ff4f2d]/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Installments — only for cartão parcelado (moved inline with payment method toggle) */}

            {/* Contact info */}
            <section>
              <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                {plan.type === "installment" ? "4" : "2"}. Seus dados
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

            {/* Address */}
            <section>
              <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                {plan.type === "installment" ? "5" : "3"}. Endereco
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="relative">
                    <input
                      type="text" required
                      value={customerData.postalCode}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="CEP"
                      className={`${inputClass} ${cepError ? "!border-red-500/50" : ""}`}
                      inputMode="numeric"
                    />
                    {isCepLoading && (
                      <Loader2 className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
                    )}
                  </div>
                  <input
                    type="text" required
                    value={customerData.addressNumber}
                    onChange={(e) => setCustomerData((p) => ({ ...p, addressNumber: e.target.value }))}
                    placeholder="Numero"
                    className={inputClass}
                  />
                </div>
                {cepError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{cepError}
                  </p>
                )}
                {customerData.street && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs text-primary flex items-center gap-1.5 mb-1">
                      <Check className="w-3 h-3" /> Endereco encontrado
                    </p>
                    <p className="text-sm text-white/70">
                      {customerData.street}, {customerData.neighborhood} · {customerData.city}/{customerData.state}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Payment Method Toggle — somente planos semestral/anual */}
            {plan.type === "installment" && (
              <section>
                <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                  6. Forma de pagamento
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${
                      paymentMethod === "card"
                        ? "border-[#ff4f2d] bg-[#ff4f2d]/10 text-white"
                        : "border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Cartão de Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${
                      paymentMethod === "pix"
                        ? "border-[#32bcad] bg-[#32bcad]/10 text-[#32bcad]"
                        : "border-white/10 text-white/50 hover:border-white/20"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    PIX à Vista
                  </button>
                </div>
                {paymentMethod === "pix" && (
                  <div className="mt-3 p-3 bg-[#32bcad]/5 border border-[#32bcad]/20 rounded-lg">
                    <p className="text-xs text-[#32bcad]">
                      Pagamento único de R$ {fmtBRL(pixTotalValue)} · sem parcelamento
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Card — hidden quando PIX selecionado */}
            {(plan.type !== "installment" || paymentMethod === "card") && (
              <section>
                <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                  {plan.type === "installment" ? "7" : "4"}. Cartao de credito
                </h2>
              <div className="space-y-2 sm:space-y-3">
                <input
                  type="text" required
                  value={cardData.number}
                  onChange={(e) => setCardData((p) => ({ ...p, number: formatCardNumber(e.target.value) }))}
                  placeholder="Numero do cartao"
                  maxLength={19}
                  className={inputClass}
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
                <input
                  type="text" required
                  value={cardData.holderName}
                  onChange={(e) => setCardData((p) => ({ ...p, holderName: e.target.value.toUpperCase() }))}
                  placeholder="Nome impresso no cartao"
                  className={`${inputClass} uppercase text-sm`}
                  autoComplete="cc-name"
                />
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <input
                    type="text" required maxLength={2}
                    value={cardData.expiryMonth}
                    onChange={(e) => setCardData((p) => ({ ...p, expiryMonth: e.target.value.replace(/\D/g, "") }))}
                    placeholder="MM"
                    className={inputClass}
                    autoComplete="cc-exp-month"
                    inputMode="numeric"
                  />
                  <input
                    type="text" required maxLength={4}
                    value={cardData.expiryYear}
                    onChange={(e) => setCardData((p) => ({ ...p, expiryYear: e.target.value.replace(/\D/g, "") }))}
                    placeholder="AAAA"
                    className={inputClass}
                    autoComplete="cc-exp-year"
                    inputMode="numeric"
                  />
                  <div className="relative">
                    <input
                      type="text" required maxLength={4}
                      value={cardData.ccv}
                      onChange={(e) => setCardData((p) => ({ ...p, ccv: e.target.value.replace(/\D/g, "") }))}
                      placeholder="CVV"
                      className={inputClass}
                      autoComplete="cc-csc"
                      inputMode="numeric"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* Installment selection — somente para cartão parcelado */}
            {plan.type === "installment" && paymentMethod === "card" && (
              <section>
                <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                  Quantidade de parcelas
                </h2>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className={inputClass}
                >
                  {Array.from({ length: plan.installments }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} className="bg-black text-white">
                      {n}x de R$ {fmtBRL(plan.total / n)}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {/* Coupon */}
            <section>
              <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
                Cupom de desconto
              </h2>
              {couponData ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">{couponData.coupon.code}</span>
                    <span className="text-xs text-white/40">· {couponData.coupon.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCouponData(null); setCouponCode("") }}
                    className="text-xs text-white/30 hover:text-red-400 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), validateCoupon())}
                      placeholder="CODIGO DO CUPOM"
                      className={`flex-1 px-4 py-3 bg-white/[0.03] border rounded-lg text-sm text-white placeholder-white/25 focus:outline-none transition-all uppercase ${
                        couponError ? "border-red-500/50" : "border-white/10 focus:border-[#ff4f2d]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={validateCoupon}
                      disabled={isCouponLoading || !couponCode.trim()}
                      className="px-5 py-3 bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
                    >
                      {isCouponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{couponError}
                    </p>
                  )}
                </div>
              )}
            </section>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Mobile summary */}
            <div className="lg:hidden">
              <OrderSummary
                plan={plan}
                professor={professor}
                shirtSize={shirtSize}
                couponData={couponData}
                discountedPrice={discountedPrice}
                discountAmount={discountAmount}
                discountedTotal={discountedTotal}
                paymentMethod={paymentMethod}
                pixTotalValue={pixTotalValue}
              />
            </div>

            {/* Aceite do Contrato de Prestação de Serviços */}
            <ContratoCheckbox checked={contratoAceito} onChange={setContratoAceito} />

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !contratoAceito || !professor || (plan.type === "installment" && !shirtSize) || !customerData.street || !customerData.addressNumber}
              className="w-full py-3 sm:py-4 bg-[#ff4f2d] hover:bg-[#e6452a] disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : paymentMethod === "pix" && plan.type === "installment" ? (
                <>
                  <QrCode className="w-4 h-4" />
                  Pagar via PIX · R$ {fmtBRL(pixTotalValue)}
                </>
              ) : plan.type === "recurring" ? (
                <>
                  <Lock className="w-4 h-4" />
                  Assinar por R$ {fmtBRL(discountedPrice)}/mes
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pagar {installments}x de R$ {fmtBRL(discountedPrice)}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pb-4">
              <ShieldCheck className="w-4 h-4 text-primary/60" />
              <p className="text-xs text-white/30">Pagamento 100% seguro com criptografia SSL</p>
            </div>
          </form>

          {/* ── RIGHT: Sticky summary (desktop) ─────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <OrderSummary
                plan={plan}
                professor={professor}
                shirtSize={shirtSize}
                couponData={couponData}
                discountedPrice={discountedPrice}
                discountAmount={discountAmount}
                discountedTotal={discountedTotal}
                paymentMethod={paymentMethod}
                pixTotalValue={pixTotalValue}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Order Summary Component ───────────────────────────────────────────────
function OrderSummary({
  plan,
  professor,
  shirtSize,
  couponData,
  discountedPrice,
  discountAmount,
  discountedTotal,
  paymentMethod,
  pixTotalValue,
}: {
  plan: Plan
  professor: string
  shirtSize: string
  couponData: CouponData | null
  discountedPrice: number
  discountAmount: number
  discountedTotal: number
  paymentMethod: "card" | "pix"
  pixTotalValue: number
}) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Resumo</p>
        <h3 className="text-white font-medium text-base">Somma Assessoria · Plano {plan.name}</h3>
        <p className="text-white/50 text-sm mt-0.5">
          {plan.type === "recurring"
            ? "Cobranca mensal recorrente"
            : paymentMethod === "pix"
            ? "PIX à vista · pagamento único"
            : `${plan.installments}x de R$ ${fmtBRL(plan.price)} sem juros`
          }
        </p>
      </div>

      {(professor || shirtSize) && (
        <div className="border-t border-white/10 pt-4 space-y-2">
          {professor && (
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Professor</span>
              <span className="text-white">{professor}</span>
            </div>
          )}
          {shirtSize && (
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Camiseta</span>
              <span className="text-white">{shirtSize}</span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-white/10 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">
            {plan.type === "recurring" ? "Valor mensal" : "Valor por parcela"}
          </span>
          <span className="text-white">R$ {fmtBRL(plan.price)}</span>
        </div>
        {plan.type === "installment" && (
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total ({plan.installments}x)</span>
            <span className="text-white">R$ {fmtBRL(plan.total)}</span>
          </div>
        )}
        {couponData && (
          <div className="flex justify-between text-sm">
            <span className="text-primary flex items-center gap-1">
              <Tag className="w-3 h-3" /> {couponData.coupon.code}
            </span>
            <span className="text-primary">-R$ {fmtBRL(discountAmount)}/parcela</span>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-white/60 text-sm">
            {plan.type === "recurring"
              ? "Cobrado agora"
              : paymentMethod === "pix"
              ? "Total à vista"
              : "Total"
            }
          </span>
          <div className="text-right">
            {couponData && plan.type === "installment" && (
              <span className="text-white/30 line-through text-sm mr-2">R$ {fmtBRL(plan.total)}</span>
            )}
            <span className="text-2xl font-light text-white">
              R$ {fmtBRL(
                plan.type === "recurring"
                  ? discountedPrice
                  : paymentMethod === "pix"
                  ? pixTotalValue
                  : discountedTotal
              )}
            </span>
          </div>
        </div>
        {plan.type === "installment" && paymentMethod === "card" && (
          <p className="text-xs text-white/40 mt-1 text-right">
            em {plan.installments}x de R$ {fmtBRL(discountedPrice)}
          </p>
        )}
        {plan.type === "installment" && paymentMethod === "pix" && (
          <p className="text-xs text-[#32bcad]/60 mt-1 text-right">
            pagamento único via PIX
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-white/40">Pagamento 100% seguro via Asaas</p>
      </div>

      {/* Payment Methods */}
      <div className="flex gap-2 pt-3 justify-center flex-wrap">
        {/* Visa */}
        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" className="w-7 h-5">
          <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000"></path>
          <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path>
          <path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"></path>
        </svg>

        {/* Mastercard */}
        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" className="w-7 h-5">
          <path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000"></path>
          <path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path>
          <circle fill="#EB001B" cx="15" cy="12" r="7"></circle>
          <circle fill="#F79E1B" cx="23" cy="12" r="7"></circle>
          <path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"></path>
        </svg>

        {/* Elo */}
        <svg role="img" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" className="w-7 h-5">
          <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000" opacity=".07"></path>
          <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#FFF"></path>
          <g fill="#000">
            <path d="M13.3 15.5c-.6.6-1.4.9-2.3.9-.6 0-1.2-.2-1.6-.5l-1.2 1.9c.8.6 1.8.9 2.8.9 1.5 0 2.9-.6 3.9-1.6l-1.6-1.6zm-2.1-7.7c-3 0-5.5 2.4-5.5 5.4 0 1.1.3 2.2.9 3.1l9.8-4.2c-.6-2.5-2.7-4.3-5.2-4.3zm-3.3 5.8v-.4c0-1.8 1.5-3.2 3.2-3.2 1 0 1.8.5 2.4 1.1l-5.6 2.5zm11.6-8.3v10.5l1.8.8-.9 2.1-1.8-.8c-.4-.2-.7-.4-.9-.7-.2-.3-.3-.7-.3-1.3V5.3h2.1zM26 10.2c.3-.1.7-.2 1-.2 1.5 0 2.8 1.1 3.1 2.6l2.2-.4c-.5-2.5-2.7-4.4-5.3-4.4-.6 0-1.2.1-1.7.3l.7 2.1zm-2.6 7.1l1.5-1.7c-.7-.6-1.1-1.4-1.1-2.4s.4-1.8 1.1-2.4l-1.5-1.7c-1.1 1-1.8 2.5-1.8 4.1 0 1.7.7 3.1 1.8 4.1zm6.7-3.4c-.3 1.5-1.6 2.6-3.1 2.6-.4 0-.7-.1-1-.2l-.7 2.1c.5.2 1.1.3 1.7.3 2.6 0 4.8-1.9 5.3-4.4l-2.2-.4z"></path>
          </g>
        </svg>

        {/* American Express */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" className="w-7 h-5">
          <g fill="none">
            <path fill="#000" d="M35,0 L3,0 C1.3,0 0,1.3 0,3 L0,21 C0,22.7 1.4,24 3,24 L35,24 C36.7,24 38,22.7 38,21 L38,3 C38,1.3 36.6,0 35,0 Z" opacity=".07"></path>
            <path fill="#006FCF" d="M35,1 C36.1,1 37,1.9 37,3 L37,21 C37,22.1 36.1,23 35,23 L3,23 C1.9,23 1,22.1 1,21 L1,3 C1,1.9 1.9,1 3,1 L35,1"></path>
            <path fill="#FFF" d="M8.971,10.268 L9.745,12.144 L8.203,12.144 L8.971,10.268 Z M25.046,10.346 L22.069,10.346 L22.069,11.173 L24.998,11.173 L24.998,12.412 L22.075,12.412 L22.075,13.334 L25.052,13.334 L25.052,14.073 L27.129,11.828 L25.052,9.488 L25.046,10.346 L25.046,10.346 Z M10.983,8.006 L14.978,8.006 L15.865,9.941 L16.687,8 L27.057,8 L28.135,9.19 L29.25,8 L34.013,8 L30.494,11.852 L33.977,15.68 L29.143,15.68 L28.065,14.49 L26.94,15.68 L10.03,15.68 L9.536,14.49 L8.406,14.49 L7.911,15.68 L4,15.68 L7.286,8 L10.716,8 L10.983,8.006 Z M19.646,9.084 L17.407,9.084 L15.907,12.62 L14.282,9.084 L12.06,9.084 L12.06,13.894 L10,9.084 L8.007,9.084 L5.625,14.596 L7.18,14.596 L7.674,13.406 L10.27,13.406 L10.764,14.596 L13.484,14.596 L13.484,10.661 L15.235,14.602 L16.425,14.602 L18.165,10.673 L18.165,14.603 L19.623,14.603 L19.647,9.083 L19.646,9.084 Z M28.986,11.852 L31.517,9.084 L29.695,9.084 L28.094,10.81 L26.546,9.084 L20.652,9.084 L20.652,14.602 L26.462,14.602 L28.076,12.864 L29.624,14.602 L31.499,14.602 L28.987,11.852 L28.986,11.852 Z"></path>
          </g>
        </svg>

        {/* PIX */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 952.77 338.7" className="w-11 h-4">
          <path d="M393.22,316.26V122a64.71,64.71,0,0,1,64.71-64.71l57.35.08A64.62,64.62,0,0,1,579.77,122v41.34a64.72,64.72,0,0,1-64.71,64.72H434" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.26"/>
          <path d="M595.8,57.28h24.88a26.56,26.56,0,0,1,26.56,26.56v145.1" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.26"/>
          <path d="M641.9,34.8,630.62,23.51a7.16,7.16,0,0,1,0-10.13L641.9,2.1a7.18,7.18,0,0,1,10.15,0l11.27,11.28a7.16,7.16,0,0,1,0,10.13L652,34.8a7.17,7.17,0,0,1-10.14,0" fill="#ffffff"/>
          <path d="M695,57.15h24.67a47.85,47.85,0,0,1,33.84,14l57.71,57.71a19.13,19.13,0,0,0,27.07,0l57.5-57.49a47.81,47.81,0,0,1,33.83-14h20.06" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.26"/>
          <path d="M695,227.67h24.67a47.86,47.86,0,0,0,33.84-14l57.71-57.71a19.15,19.15,0,0,1,27.07,0l57.5,57.5a47.84,47.84,0,0,0,33.83,14h20.06" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6.26"/>
          <path d="M246.13,264.53A46.07,46.07,0,0,1,213.35,251L166,203.62a9,9,0,0,0-12.44,0l-47.51,47.51A46.09,46.09,0,0,1,73.27,264.7H64l60,60a48,48,0,0,0,67.81,0l60.12-60.13Z" fill="#ffffff"/>
          <path d="M73.28,97.09a46.08,46.08,0,0,1,32.78,13.57l47.51,47.52a8.81,8.81,0,0,0,12.44,0l47.34-47.34a46,46,0,0,1,32.78-13.58h5.7L191.71,37.14a47.94,47.94,0,0,0-67.81,0L64,97.09Z" fill="#ffffff"/>
          <path d="M301.56,147l-36.33-36.33a7,7,0,0,1-2.58.52H246.13a32.62,32.62,0,0,0-22.93,9.5L175.86,168a22.74,22.74,0,0,1-32.13,0L96.21,120.51A32.62,32.62,0,0,0,73.28,111H53a7.12,7.12,0,0,1-2.44-.49L14,147a48,48,0,0,0,0,67.81l36.48,36.48a6.85,6.85,0,0,1,2.44-.49H73.28a32.63,32.63,0,0,0,22.93-9.51l47.51-47.51c8.59-8.58,23.56-8.58,32.14,0l47.34,47.33a32.62,32.62,0,0,0,22.93,9.5h16.52a6.9,6.9,0,0,1,2.58.52l36.33-36.33a47.94,47.94,0,0,0,0-67.81" fill="#ffffff"/>
        </svg>
      </div>
    </div>
  )
}
