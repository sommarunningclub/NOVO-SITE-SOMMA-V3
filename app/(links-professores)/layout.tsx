import type { Viewport } from "next";

// Comportamento "padrão app": sem zoom no pinch e, principalmente, sem o
// auto-zoom do iOS ao focar um campo do contato. Escopado só aos links de
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
