import type { Metadata } from "next"
import { PixAutomaticoTokensPainel } from "./_components/Painel"

export const metadata: Metadata = {
  title: "Liberação do Pix Automático | Somma",
  robots: { index: false, follow: false },
}

// Geração dos códigos que liberam o Pix Automático no checkout. A mesma API
// fica disponível para o sistema de gestão (v0-sistema-somma-de-gestao-l7)
// chamar com o header x-admin-secret.
export default function PixAutomaticoAdminPage() {
  return <PixAutomaticoTokensPainel />
}
