import { getServiceSupabase } from "@/lib/supabase"

// Tokens que liberam o Pix Automático no checkout. O Pix Automático fica
// visível porém bloqueado: a estratégia é levar o máximo de clientes para o
// cartão e só liberar o débito automático para quem procura o atendimento.

export const TABELA_TOKENS = "pix_automatico_tokens"
export const VALIDADE_HORAS = 24

// Sem I, O, 0 e 1: o código é ditado por telefone/WhatsApp e esses caracteres
// se confundem entre si.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function gerarCodigo(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const s = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("")
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`
}

export function normalizarCodigo(valor: unknown): string {
  if (typeof valor !== "string") return ""
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "")
  return limpo.length === 8 ? `${limpo.slice(0, 4)}-${limpo.slice(4, 8)}` : ""
}

// Confere se o token existe, está no prazo e não foi usado. NÃO consome: serve
// para o checkout dar retorno na hora em que o cliente digita o código.
export async function conferirToken(codigo: string) {
  const supabase = getServiceSupabase()
  if (!supabase) return { ok: false as const, motivo: "indisponivel" }

  const normalizado = normalizarCodigo(codigo)
  if (!normalizado) return { ok: false as const, motivo: "formato" }

  const { data, error } = await supabase
    .from(TABELA_TOKENS)
    .select("codigo, expira_em, usado_em")
    .eq("codigo", normalizado)
    .maybeSingle()

  if (error) {
    console.error("[pix-automatico] Erro ao conferir token:", error)
    return { ok: false as const, motivo: "indisponivel" }
  }
  if (!data) return { ok: false as const, motivo: "inexistente" }
  if (data.usado_em) return { ok: false as const, motivo: "usado" }
  if (new Date(data.expira_em) <= new Date()) return { ok: false as const, motivo: "expirado" }

  return { ok: true as const, expiraEm: data.expira_em }
}

// Consome o token de forma ATÔMICA: os filtros entram no próprio UPDATE, então
// dois checkouts simultâneos com o mesmo código não passam os dois. Só a
// requisição que receber a linha de volta pode criar a autorização.
export async function consumirToken(
  codigo: string,
  quem: { customerId?: string; nome?: string },
) {
  const supabase = getServiceSupabase()
  if (!supabase) return { ok: false as const, motivo: "indisponivel" }

  const normalizado = normalizarCodigo(codigo)
  if (!normalizado) return { ok: false as const, motivo: "formato" }

  const agora = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABELA_TOKENS)
    .update({
      usado_em: agora,
      usado_por_customer: quem.customerId ?? null,
      usado_por_nome: quem.nome ?? null,
    })
    .eq("codigo", normalizado)
    .is("usado_em", null)
    .gt("expira_em", agora)
    .select("codigo")

  if (error) {
    console.error("[pix-automatico] Erro ao consumir token:", error)
    return { ok: false as const, motivo: "indisponivel" }
  }
  if (!data || data.length === 0) {
    // Não dá para distinguir aqui entre inexistente, usado e expirado sem uma
    // segunda consulta; o checkout já conferiu antes e dá a mensagem exata.
    return { ok: false as const, motivo: "invalido" }
  }
  return { ok: true as const }
}

// Desfaz o consumo quando a criação da autorização falha depois: o cliente
// não pode perder a liberação por um erro do nosso lado ou do Asaas.
export async function devolverToken(codigo: string) {
  const supabase = getServiceSupabase()
  if (!supabase) return

  const normalizado = normalizarCodigo(codigo)
  if (!normalizado) return

  const { error } = await supabase
    .from(TABELA_TOKENS)
    .update({ usado_em: null, usado_por_customer: null, usado_por_nome: null })
    .eq("codigo", normalizado)

  if (error) {
    console.error("[pix-automatico] Falha ao devolver token", normalizado, error)
  }
}

export function mensagemDoMotivo(motivo: string): string {
  switch (motivo) {
    case "formato":
      return "Código inválido. Confira os 8 caracteres que o atendimento enviou."
    case "inexistente":
      return "Código não encontrado. Confira com o atendimento."
    case "usado":
      return "Este código já foi utilizado. Peça um novo ao atendimento."
    case "expirado":
      return "Este código expirou. Peça um novo ao atendimento."
    case "indisponivel":
      return "Não foi possível validar o código agora. Tente de novo em instantes."
    default:
      return "Código inválido ou expirado. Peça um novo ao atendimento."
  }
}
