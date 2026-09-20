"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { CheckoutForm, type Professor } from "@/components/checkout-form"
import { Apresentacao } from "./Apresentacao"
import type { Bio } from "../_lib/bios"

/**
 * Checkout de um link dedicado de professor.
 *
 * O cliente escolhe Mensal, Semestral ou Anual no seletor de cima; o professor
 * não é escolha dele, vem travado no plano. Os preços são os mesmos da página
 * pública — o que estes links mudam é só o caminho da venda, que fica isolado
 * por professor: sommaclub.com.br/<professor>.
 */
const PLANOS = [
  {
    id: "mensal",
    name: "Mensal",
    period: "mensal",
    price: 220,
    total: 220,
    installments: 1,
    type: "recurring" as const,
    pixAutomaticoKey: "mensal" as const,
  },
  {
    id: "semestral",
    name: "Semestral",
    period: "semestral",
    price: 200,
    total: 1200,
    installments: 6,
    type: "installment" as const,
  },
  {
    id: "anual",
    name: "Anual",
    period: "anual",
    price: 180,
    total: 2160,
    installments: 12,
    type: "installment" as const,
  },
]

/** "R$ 220/mês" na recorrência, "6x R$ 200" no parcelado. */
function resumoDoPlano(plan: (typeof PLANOS)[number]): string {
  return plan.type === "recurring"
    ? `R$ ${plan.price}/mês`
    : `${plan.installments}x R$ ${plan.price}`
}

export function CheckoutProfessor({
  professorFixo,
  professores,
  bio,
}: {
  /** Nome exato do professor, como está em `professores_curriculo_assessoria`. */
  professorFixo: string
  professores: Professor[]
  /** Apresentação no topo. Sem ela o link é só o checkout, como nasceu. */
  bio?: Bio | null
}) {
  const [planoId, setPlanoId] = useState("mensal")
  const plano = PLANOS.find((p) => p.id === planoId) ?? PLANOS[0]
  const plan = { ...plano, professorFixo }

  // A apresentação entra no slot do seletor porque é lá que dá para ocupar a
  // largura toda da página, acima do formulário e abaixo da barra do Somma.
  const topo = (
    <>
      {bio && <Apresentacao bio={bio} professor={professores[0]} />}
      <div id="planos" className="scroll-mt-6 mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider mb-3 sm:mb-4">
          Escolha seu plano
        </h2>
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.02]">
          {PLANOS.map((opcao) => {
            const ativo = opcao.id === plan.id
            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => setPlanoId(opcao.id)}
                aria-pressed={ativo}
                className={`relative rounded-xl px-2 py-3 sm:px-4 sm:py-4 text-center transition-all ${
                  ativo
                    ? "bg-[#ff4f2d] text-black"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {ativo && (
                  <span className="hidden sm:flex absolute top-2 right-2 w-5 h-5 rounded-full bg-black/20 items-center justify-center">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
                <span className="block text-sm sm:text-base font-medium">{opcao.name}</span>
                <span className={`block text-xs mt-1 ${ativo ? "text-black/70" : "text-white/40"}`}>
                  {resumoDoPlano(opcao)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  // `key` remonta o formulário a cada troca de plano: parcelas, forma de
  // pagamento e cupom são calculados a partir do plano e não podem sobreviver à
  // troca (um cupom só de recorrência valendo num parcelado, por exemplo).
  return (
    <CheckoutForm
      key={plan.id}
      plan={plan}
      initialProfessors={professores}
      planSwitcher={topo}
    />
  )
}
