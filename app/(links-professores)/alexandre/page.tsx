import type { Metadata } from "next"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { RegistrarVisita } from "@/components/bora/registrar-visita"
import { CheckoutProfessor } from "./CheckoutProfessor"

const NOME = "Alexandre Alves"

export const metadata: Metadata = {
  title: `Checkout | Assessoria Somma com ${NOME}`,
  description: `Finalize seu pedido da Assessoria Somma com o professor ${NOME}`,
  robots: { index: false, follow: false },
}

/**
 * Link oficial do professor Alexandre Alves: sommaclub.com.br/alexandre.
 *
 * Os outros links de professor apresentam a BORA (../_components). Este segue
 * vendendo os três planos, liberado nas rotas de cobrança por
 * PROFESSORES_COM_VENDA_ABERTA (lib/assessoria-status).
 */
export default async function Page() {
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
  const { data: professores, error } = await supabase
    .from("professores_curriculo_assessoria")
    .select("id, nome, instagram, link_foto, telefone")
    .eq("nome", NOME)

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
      {/* A visita segue contando no módulo Nova Assessoria, como na página da BORA. */}
      <RegistrarVisita pagina="bio-alexandre" />
      <CheckoutProfessor professorFixo={NOME} professores={professores ?? []} />
    </main>
  )
}
