import type { Metadata } from "next"
import { CheckoutPixRecorrenteForm } from "@/components/checkout-pix-recorrente-form"
import { createClient as createAnonClient } from "@supabase/supabase-js"

export const metadata: Metadata = {
  title: "Teste PIX Recorrente | Assessoria Somma",
  description: "Página de teste da assinatura mensal via PIX recorrente",
  robots: { index: false, follow: false },
}

// PÁGINA DE TESTE do PIX recorrente — assinatura mensal de R$ 10 no Asaas de
// produção, professor Alexandre Alves fixo e PIX como única forma de pagamento.
// Não linkar no site; remover após validar o fluxo.
export default async function TestePixRecorrentePage() {
  const plan = { name: "Mensal", value: 10 }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return (
      <main className="bg-black">
        <div className="min-h-screen flex items-center justify-center text-red-400">
          <p>Configuracao ausente: NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
        </div>
      </main>
    )
  }

  const supabase = createAnonClient(supabaseUrl, anonKey)
  const { data: professors, error } = await supabase
    .from("professores_curriculo_assessoria")
    .select("id, nome, instagram, link_foto, telefone")
    .eq("nome", "Alexandre Alves")

  if (error) {
    return (
      <main className="bg-black">
        <div className="min-h-screen flex items-center justify-center text-red-400">
          <div className="text-center">
            <p className="mb-2">Erro ao carregar professor:</p>
            <p className="text-sm font-mono">{JSON.stringify(error)}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-black">
      <CheckoutPixRecorrenteForm
        professor={professors?.[0] || null}
        planName={plan.name}
        planValue={plan.value}
      />
    </main>
  )
}
