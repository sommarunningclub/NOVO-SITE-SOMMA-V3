import type { Metadata } from "next"
import { CheckoutForm } from "@/components/checkout-form"
import { createClient as createAnonClient } from "@supabase/supabase-js"

export const metadata: Metadata = {
  title: "Checkout - Plano Mensal Alexandre | Assessoria Somma",
  description: "Finalize seu pedido para o plano mensal com o professor Alexandre Alves",
}

// Checkout dedicado do professor Alexandre Alves — plano Mensal fixo em R$ 300 (à vista).
// Espelha o link da assessoria (assessoria.sommaclub.com.br/checkout/mensal/alexandre).
export default async function CheckoutAlexandrePage() {
  const plan = {
    name: "Mensal",
    period: "mensal",
    price: 300,
    total: 300,
    installments: 1,
    type: "recurring" as const,
  }

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
      <CheckoutForm plan={plan} initialProfessors={professors || []} />
    </main>
  )
}
