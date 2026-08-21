// Catálogo dos planos que aceitam Pix Automático, com o preço definido AQUI,
// no servidor. A rota /api/asaas/pix-automatico é pública e cria recorrência
// sem cartão: se aceitasse o valor vindo do navegador, qualquer um poderia
// abrir uma assinatura de qualquer preço na conta da Somma.
//
// Só planos mensais entram: Pix Automático é débito recorrente, não parcelamento.
export type PlanoPixAutomaticoKey = "mensal" | "mensal-alexandre" | "teste"

export const PLANOS_PIX_AUTOMATICO: Record<
  PlanoPixAutomaticoKey,
  { nome: string; valor: number; descricao: string }
> = {
  mensal: { nome: "Mensal", valor: 220, descricao: "Somma Assessoria Mensal" },
  "mensal-alexandre": { nome: "Mensal", valor: 330, descricao: "Somma Assessoria Mensal" },
  // Página de teste (/checkout/teste-pix-recorrente). Remover junto com a página.
  teste: { nome: "Mensal", valor: 10, descricao: "Somma Assessoria Mensal" },
}

export function resolvePlanoPixAutomatico(key: unknown) {
  if (typeof key !== "string") return null
  return PLANOS_PIX_AUTOMATICO[key as PlanoPixAutomaticoKey] ?? null
}
