import type { Metadata, Viewport } from "next";
import { AssessoriaForaDoAr } from "@/components/assessoria-fora-do-ar";
import { ASSESSORIA_VENDAS_ABERTAS } from "@/lib/assessoria-status";

// Checkout com comportamento "padrão app": sem zoom no pinch e, principalmente,
// sem o auto-zoom do iOS ao focar um campo. Escopado só ao /checkout para não
// tirar o zoom de acessibilidade das páginas de conteúdo.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Vendas fechadas: o cadeado no lugar de qualquer página de venda abaixo daqui.
export const metadata: Metadata = ASSESSORIA_VENDAS_ABERTAS
  ? {}
  : { robots: { index: false, follow: false } };

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!ASSESSORIA_VENDAS_ABERTAS) return <AssessoriaForaDoAr />;
  return children;
}
