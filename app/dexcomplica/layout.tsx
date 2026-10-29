import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Bagel_Fat_One } from "next/font/google";
import {
  APOIO,
  DATA_ISO,
  EVENTO_NOME,
  EVENTO_PATH,
  EVENTO_URL,
  INSTAGRAM_SOMMA,
  LOCAL_CORRE,
  SITE_URL,
} from "@/lib/dexcomplica-love-run/event.config";
import "./love-run.css";

/**
 * Anton nas chamadas (cartaz esportivo, aguenta caixa alta gigante), Archivo
 * no texto e Bagel Fat One nos acentos: é a mesma massa arredondada do logo
 * da Dexcomplica, usada só em números e selos.
 */
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--lr-display", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--lr-copy", display: "swap" });
const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--lr-fun", display: "swap" });

const titulo = `${EVENTO_NOME} · Somma Club × Dexcomplica`;
const descricao = `Desapega, desilude e vem correr. Sábado, 7 de novembro, no Estacionamento 1 do Parque da Cidade: ${APOIO.charAt(0).toLowerCase()}${APOIO.slice(1)} Gratuito, vagas limitadas.`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: EVENTO_NOME,
  description: descricao,
  // Sem horário confirmado: só a data.
  startDate: DATA_ISO,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  isAccessibleForFree: true,
  url: EVENTO_URL,
  image: [`${SITE_URL}/dexcomplica-love-run/og.jpg`],
  location: {
    "@type": "Place",
    name: LOCAL_CORRE.nome,
    address: {
      "@type": "PostalAddress",
      streetAddress: LOCAL_CORRE.endereco,
      addressLocality: "Brasília",
      addressRegion: "DF",
      addressCountry: "BR",
    },
    geo: { "@type": "GeoCoordinates", latitude: LOCAL_CORRE.geo.lat, longitude: LOCAL_CORRE.geo.lng },
  },
  organizer: [
    { "@type": "SportsOrganization", name: "SOMMA Club", url: SITE_URL, sameAs: [INSTAGRAM_SOMMA] },
    { "@type": "Organization", name: "Dexcomplica" },
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/LimitedAvailability",
    url: `${EVENTO_URL}#inscricao`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E0E0E",
};

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: EVENTO_PATH },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: EVENTO_URL,
    siteName: "SOMMA Club",
    title: titulo,
    description: descricao,
    images: [{ url: "/dexcomplica-love-run/og.jpg", width: 1200, height: 630, alt: `${EVENTO_NOME}, 7 de novembro` }],
  },
  twitter: { card: "summary_large_image", title: titulo, description: descricao, images: ["/dexcomplica-love-run/og.jpg"] },
  other: { "format-detection": "telephone=no" },
};

export default function LoveRunLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${anton.variable} ${archivo.variable} ${bagel.variable} lr-root`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </div>
  );
}
