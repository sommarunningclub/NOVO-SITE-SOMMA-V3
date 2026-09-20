import type { Metadata } from "next"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { CheckoutProfessor } from "./CheckoutProfessor"
import { bioDoProfessor } from "../_lib/bios"

/**
 * Página de um link dedicado de professor.
 *
 * Os quatro links (sommaclub.com.br/<professor>) são a mesma tela com o nome
 * trocado, então ela mora aqui e cada rota só diz de quem é. O caminho não tem
 * /checkout no meio de propósito: é link de venda direta, falado e mandado no
 * WhatsApp, e quanto mais curto melhor.
 */

/** Título e descrição de um link dedicado; noindex porque o cliente chega pelo link, não pela busca. */
export function metadataDoProfessor(nome: string): Metadata {
  return {
    title: `Checkout | Assessoria Somma com ${nome}`,
    description: `Finalize seu pedido da Assessoria Somma com o professor ${nome}`,
    robots: { index: false, follow: false },
  }
}

export async function PaginaDoProfessor({ nome }: { nome: string }) {
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
    .eq("nome", nome)

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

  // Ajuste de Instagram do professor Mateus Fonseca (@ e link), igual ao da tela pública.
  const professores = (professors || []).map((p) =>
    (p.nome || "").toLowerCase().includes("mateus fonseca")
      ? { ...p, instagram: "https://www.instagram.com/matfonsecaa/" }
      : p
  )

  return (
    <main className="bg-black">
      <CheckoutProfessor
        professorFixo={nome}
        professores={professores}
        bio={bioDoProfessor(nome)}
      />
    </main>
  )
}
