import type { Metadata } from "next"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { CheckoutGabrielBrito } from "./_components/CheckoutGabrielBrito"

export const metadata: Metadata = {
  title: "Checkout | Assessoria Somma com Gabriel Brito",
  description: "Finalize seu pedido da Assessoria Somma com o professor Gabriel Brito",
  // Link de venda direta: o cliente chega por ele, não pela busca.
  robots: { index: false, follow: false },
}

// Checkout dedicado do professor Gabriel Brito — Mensal, Semestral e Anual nos
// mesmos preços da página pública, escolhidos no seletor do topo. Ele sai da
// lista de /checkout/[plano] para a venda dele entrar só por aqui.
// Link oficial: sommaclub.com.br/checkout/gabriel-brito
export default async function CheckoutGabrielBritoPage() {
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
    .eq("nome", "Gabriel Brito")

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
      <CheckoutGabrielBrito professores={professors || []} />
    </main>
  )
}
