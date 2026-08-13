import type { Metadata, Viewport } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import { EVENT, EVENT_PATH, SITE_URL, UNITS } from "@/lib/desafio-esteiras/event.config";
import "./evento.css";

/**
 * Archivo no eixo `wdth` dá a headline editorial expandida da campanha;
 * Azeret Mono é a voz dos dados (cronômetro, contadores, código do ticket).
 * Duas famílias apenas — o resto é hierarquia, não fonte nova.
 */
const sans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-dst-sans",
  display: "swap",
});

const mono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dst-mono",
  display: "swap",
});

const TITLE = "Desafio das Esteiras | Evolve + SOMMA Club";
const DESCRIPTION =
  "Quatro unidades. Um desafio. Dia 19 de agosto, às 19h, participe do Desafio das Esteiras Evolve + SOMMA Club. Escolha sua unidade e garanta seu ticket.";
const PAGE_URL = `${SITE_URL}${EVENT_PATH}`;
/** Gerada em código por `opengraph-image.tsx` — o Next injeta a tag sozinho. */
const OG_IMAGE = `${PAGE_URL}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Desafio das Esteiras",
    "Evolve",
    "SOMMA Club",
    "corrida Brasília",
    "evento academia Brasília",
    "esteira",
    "Vicente Pires",
    "Luziânia",
    "Samambaia",
    "Alameda Shopping",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: PAGE_URL,
    siteName: "SOMMA Club",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

/** Dados estruturados de Event — um por unidade, já que o evento é simultâneo. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": UNITS.map((unit) => ({
    "@type": "SportsEvent",
    name: `${EVENT.nome} na ${unit.nome}`,
    description: DESCRIPTION,
    startDate: EVENT.inicioISO,
    endDate: EVENT.fimISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${PAGE_URL}?unidade=${unit.slug}`,
    image: [OG_IMAGE],
    location: {
      "@type": "Place",
      name: unit.nome,
      address: {
        "@type": "PostalAddress",
        streetAddress: unit.endereco,
        addressLocality: unit.cidade,
        addressRegion: unit.uf,
        addressCountry: "BR",
      },
      geo: { "@type": "GeoCoordinates", latitude: unit.latitude, longitude: unit.longitude },
    },
    organizer: [
      { "@type": "Organization", name: "Evolve", url: "https://www.academiaevolve.com.br" },
      { "@type": "Organization", name: "SOMMA Club", url: SITE_URL },
    ],
  })),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`dst ${sans.variable} ${mono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
