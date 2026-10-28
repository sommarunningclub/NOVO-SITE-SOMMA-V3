import type { Metadata } from "next"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { RegistrarVisita } from "@/components/bora/registrar-visita"
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores"
import { CheckoutProfessor } from "./CheckoutProfessor"

/**
 * Link de um professor (sommaclub.com.br/<professor>), o que vai na bio do
 * Instagram dele.
 *
 * Os quatro links são a mesma tela com o nome trocado, então ela mora aqui e
 * cada rota só diz de quem é. É checkout direto dos três planos com o
 * professor travado; as rotas de cobrança aceitam a venda porque ele está em
 * PROFESSORES_COM_VENDA_ABERTA (lib/assessoria-status). Quem tem bio em
 * lib/nova-assessoria/bios.ts ganha a apresentação no topo.
 */

function professorPeloNome(nome: string) {
  return PROFESSORES_BORA.find((p) => p.nome === nome) ?? null
}

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

  const professor = professorPeloNome(nome)

  return (
    <main className="bg-black">
      {/* A visita segue contando no módulo Nova Assessoria, como na página da BORA. */}
      {professor && <RegistrarVisita pagina={`bio-${professor.slug}`} />}
      <CheckoutProfessor
        professorFixo={nome}
        professores={professores}
        bio={professor?.bio ?? null}
      />
    </main>
  )
}
