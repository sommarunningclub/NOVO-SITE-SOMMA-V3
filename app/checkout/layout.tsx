import type { Viewport } from "next";

// Checkout com comportamento "padrão app": sem zoom no pinch e, principalmente,
// sem o auto-zoom do iOS ao focar um campo. Escopado só ao /checkout para não
// tirar o zoom de acessibilidade das páginas de conteúdo.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
