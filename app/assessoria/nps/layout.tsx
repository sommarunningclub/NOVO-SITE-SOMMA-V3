import type { Metadata, Viewport } from "next";
import "./nps.css";

/** Vale para o link geral e para o link de cada rodada. */
export const metadata: Metadata = {
  title: "Pesquisa da Assessoria Somma | SOMMA Club",
  description: "Queremos ouvir você. Conte como está a sua experiência na Assessoria Somma. Leva poucos minutos.",
  alternates: { canonical: "/assessoria/nps" },
  // Pesquisa de aluno não é página de busca.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMMA Club",
    title: "Pesquisa da Assessoria Somma",
    description: "Queremos ouvir você. Leva poucos minutos.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AssessoriaNpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
