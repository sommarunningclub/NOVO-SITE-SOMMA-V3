import type { Metadata } from "next";

const TITLE = "Somma Club · Apresentação Comercial 2026";
const DESCRIPTION =
  "Comunidade, experiência e conexão com o universo wellness. Oportunidades de parceria, ativações, mídia e patrocínios do Somma Club.";
const PAGE_URL = "https://sommaclub.com.br/proposta-comercial-somma-club-2026";
const OG_IMAGE = "/midiakit/capa.jpg"; // configurável: troque pela arte de compartilhamento definitiva

export const metadata: Metadata = {
  metadataBase: new URL("https://sommaclub.com.br"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/proposta-comercial-somma-club-2026" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Somma Club",
    locale: "pt_BR",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Somma Club" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function PropostaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
