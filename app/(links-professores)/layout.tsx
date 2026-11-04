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

// A promo do mês tem data para acabar (lib/nova-assessoria/promo): a página
// estática se refaz de hora em hora para o cupom sair do ar sozinho.
export const revalidate = 3600;

export default function LinksProfessoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
