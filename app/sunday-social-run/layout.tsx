import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Figtree, Space_Mono } from "next/font/google";
import {
  EVENT,
  EVENT_CAPACITY,
  EVENT_DATE,
  EVENT_PATH,
  EVENT_TIME,
  SITE_URL,
  TICKET_PRICE,
  HYPE_TICKET_URL,
} from "@/lib/sunday-social-run/event.config";
import "./evento.css";

/**
 * Três vozes, e só três — escolhidas para soar direto e bem-humorado, sem
 * cerimônia:
 * — Space Grotesk faz os títulos. É geométrica e limpa, mas tem tiques de
 *   desenho (o "a", o "g", o "R") que dão graça ao que é grande.
 * — Figtree é o texto. Redonda, altíssima legibilidade em tela pequena — a
 *   fonte de quem explica sem enrolar.
 * — Space Mono, irmã da display, é a voz dos dados: horário, pace, vagas,
 *   preço. Dá o toque técnico e divertido dos números.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ris-display",
  display: "swap",
});

const texto = Figtree({
  subsets: ["latin"],
  variable: "--font-ris-body",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ris-mono",
  display: "swap",
});

const TITLE = "SUNDAY SOCIAL RUN | SOMMA × Santa Monica";
const DESCRIPTION =
  "Evento exclusivo de corrida, música, gastronomia e conexões em Brasília. 100 vagas. SOMMA Club × Santa Monica Gastrobar powered by Hype On Club.";
const PAGE_URL = `${SITE_URL}${EVENT_PATH}`;
/** Gerada em código por `opengraph-image.tsx` — o Next injeta a tag sozinho. */
const OG_IMAGE = `${PAGE_URL}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Sunday Social Run",
    "SOMMA Club",
    "Santa Monica Gastrobar",
    "Hype On Club",
    "corrida Brasília",
    "evento Brasília",
    "domingo Brasília",
    "Eixão",
    "after party corrida",
    "social run",
    "brunch Brasília",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: PAGE_URL,
    siteName: "SOMMA Club",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "SUNDAY SOCIAL RUN · Run. Connect. Stay." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fdfaf4",
  width: "device-width",
  initialScale: 1,
  /** A experiência encosta nas bordas do iPhone; o conteúdo respeita a safe area. */
  viewportFit: "cover",
};

/**
 * Dados estruturados.
 *
 * `SportsEvent` exige `startDate`. Enquanto o domingo oficial não estiver
 * definido no config, publicamos apenas a `WebPage` — nada de data inventada
 * para agradar validador.
 */
function structuredData() {
  const organizadores = [
    { "@type": "Organization", name: "SOMMA Club", url: SITE_URL },
    { "@type": "Organization", name: "Santa Monica Gastrobar" },
    { "@type": "Organization", name: "Hype On Club" },
  ];

  const pagina = {
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: "SOMMA Club", url: SITE_URL },
  };

  if (!EVENT_DATE) return { "@context": "https://schema.org", "@graph": [pagina] };

  return {
    "@context": "https://schema.org",
    "@graph": [
      pagina,
      {
        "@type": "SportsEvent",
        name: EVENT.nome,
        description: DESCRIPTION,
        startDate: EVENT_DATE,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        url: PAGE_URL,
        image: [OG_IMAGE],
        maximumAttendeeCapacity: EVENT_CAPACITY,
        location: {
          "@type": "Place",
          name: EVENT.local.nome,
          address: {
            "@type": "PostalAddress",
            ...(EVENT.local.endereco ? { streetAddress: EVENT.local.endereco } : {}),
            addressLocality: EVENT.local.cidade,
            addressRegion: EVENT.local.uf,
            addressCountry: "BR",
          },
        },
        organizer: organizadores,
        doorTime: EVENT_TIME,
        ...(HYPE_TICKET_URL
          ? {
              offers: {
                "@type": "Offer",
                price: TICKET_PRICE,
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
                url: HYPE_TICKET_URL,
              },
            }
          : {}),
      },
    ],
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ris ris-grain ${display.variable} ${texto.variable} ${mono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
      {children}
    </div>
  );
}
