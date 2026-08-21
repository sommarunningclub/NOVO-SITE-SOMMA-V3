"use client"

import { Smartphone, QrCode, CheckSquare, Zap, AlertCircle, Ban, Lock } from "lucide-react"

// Onboarding do Pix Automático. A fricção dessa forma de pagamento não é o
// pagamento em si: é o consentimento. O cliente precisa pagar PELO APP DO BANCO
// e marcar a autorização dos débitos futuros, senão a recorrência não ativa.
// Explicar isso antes evita abandono e pagamento feito por carteira digital.

const PASSOS = [
  {
    icone: QrCode,
    titulo: "Você recebe um QR Code",
    texto:
      "Ele cobra a primeira mensalidade e leva junto o pedido de autorização. O código vale por 24 horas.",
  },
  {
    icone: Smartphone,
    titulo: "Pague pelo app do seu banco",
    texto: "Use a área de Pix do banco. Carteiras digitais não fazem Pix Automático.",
  },
  {
    icone: CheckSquare,
    titulo: "Marque a autorização",
    texto:
      'Antes de confirmar, o banco mostra o plano e uma caixa do tipo "autorizo os próximos pagamentos com Pix automático". É ela que liga a recorrência: sem marcar, você paga só o primeiro mês.',
  },
  {
    icone: Zap,
    titulo: "Pronto, as próximas acontecem sozinhas",
    texto:
      "A ativação leva alguns minutos e aparece na tela. Depois disso o valor sai da sua conta todo mês, no mesmo dia de hoje, sem QR Code novo.",
  },
]

export function PixAutomaticoOnboarding({ valorMensal }: { valorMensal?: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {PASSOS.map((passo, i) => {
          const Icone = passo.icone
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#32bcad]/10 border border-[#32bcad]/30 flex items-center justify-center">
                  <Icone className="w-4 h-4 text-[#32bcad]" />
                </div>
                {i < PASSOS.length - 1 && <div className="w-px flex-grow bg-white/10 my-1" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-white">
                  {i + 1}. {passo.titulo}
                </p>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">{passo.texto}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          Seu banco precisa oferecer Pix Automático. Se ele não oferecer, ou se o código expirar sem
          pagamento, a autorização não ativa e você consegue voltar e finalizar no cartão.
        </p>
      </div>

      <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg flex items-start gap-2.5">
        <Ban className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          Sem fidelidade: você revoga a autorização quando quiser, no app do seu banco. Para encerrar
          a assessoria, avise também o seu professor ou o concierge.
        </p>
      </div>

      {valorMensal && (
        <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            A autorização fica travada em R$ {valorMensal} por mês. Nenhum valor diferente pode ser
            debitado sem uma nova autorização sua.
          </p>
        </div>
      )}
    </div>
  )
}
