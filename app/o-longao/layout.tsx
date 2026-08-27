import type { Metadata, Viewport } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import { EVENTO, EVENT_PATH, EVENT_URL, SITE_URL, PREMIACAO_TOTAL } from "@/lib/o-longao/config";
import "./evento.css";

/**
 * Mesmo DNA tipográfico da franquia das esteiras: Archivo no eixo `wdth` para
 * a headline expandida, Azeret Mono como voz do relógio e dos dados. Duas
 * famílias — o resto é hierarquia, não fonte nova.
 */
const sans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-lgo-sans",
  display: "swap",
});

const mono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-lgo-mono",
  display: "swap",
});

const TITLE = "O Longão | O único que dura 24 horas";
const DESCRIPTION =
  "Competição de revezamento em esteira com 24 horas de duração. Crews, assessorias e clubes de corrida do DF disputam a seletiva por uma das 8 vagas na final. Evolve + Somma Club, powered by Star Trac. Inscreva sua crew.";
/** Gerada em código por `opengraph-image.tsx` — o Next injeta a tag sozinho. */
const OG_IMAGE = `${EVENT_URL}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "O Longão",
    "corrida 24 horas",
    "revezamento em esteira",
    "SOMMA Club",
    "Evolve",
    "Star Trac",
    "crew de corrida Brasília",
    "assessoria de corrida DF",
    "competição de corrida Brasília",
    "endurance",
  ],
  alternates: { canonical: EVENT_URL },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: EVENT_URL,
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
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
};

/**
 * Dados estruturados: o evento-mãe com as duas fases como subeventos.
 * Datas exatas ainda não anunciadas — usamos a janela prevista e
 * eventStatus Scheduled; quando fecharem, `config.ts` alimenta tudo.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: EVENTO.nome,
  alternateName: "O Longão, revezamento de 24 horas em esteira",
  description: DESCRIPTION,
  url: EVENT_URL,
  image: [OG_IMAGE],
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  startDate: EVENTO.final.data ?? "2026-11",
  location: {
    "@type": "Place",
    name: EVENTO.final.local,
    address: {
      "@type": "PostalAddress",
      addressLocality: EVENTO.cidade,
      addressRegion: EVENTO.uf,
      addressCountry: "BR",
    },
  },
  organizer: [
    { "@type": "Organization", name: "Evolve", url: "https://www.academiaevolve.com.br" },
    { "@type": "Organization", name: "SOMMA Club", url: SITE_URL },
  ],
  sponsor: { "@type": "Organization", name: "Star Trac" },
  offers: {
    "@type": "Offer",
    url: `${SITE_URL}${EVENT_PATH}/inscricao`,
    availability: "https://schema.org/InStock",
    price: "0",
    priceCurrency: "BRL",
  },
  subEvent: [
    {
      "@type": "SportsEvent",
      name: `${EVENTO.nome} · Seletiva`,
      description:
        "Classificatória: 8 atletas, 1 esteira Star Trac, 2 horas, trocas livres. As 4 melhores equipes de cada categoria avançam.",
      startDate: EVENTO.seletiva.data ?? "2026-10",
      location: { "@type": "Place", name: EVENTO.seletiva.local },
    },
    {
      "@type": "SportsEvent",
      name: `${EVENTO.nome} · Final 24 horas`,
      description: `Final ininterrupta de 24 horas entre 8 crews. R$ ${PREMIACAO_TOTAL.toLocaleString("pt-BR")} em premiação.`,
      startDate: EVENTO.final.data ?? "2026-11",
      location: { "@type": "Place", name: EVENTO.final.local },
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`lgo ${sans.variable} ${mono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
