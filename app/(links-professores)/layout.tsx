import type { Viewport } from "next";

// Mesmo comportamento "padrão app" do /checkout: sem zoom no pinch e, principalmente,
// sem o auto-zoom do iOS ao focar um campo. Escopado só aos links dedicados de
// professor para não tirar o zoom de acessibilidade das páginas de conteúdo.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function LinksProfessoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
