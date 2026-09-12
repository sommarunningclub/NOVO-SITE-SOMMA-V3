import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import {
  ABERTURA,
  CIDADE,
  DATA_ISO,
  ENCERRAMENTO,
  ENDERECO_COMPLETO,
  EVENTO_PATH,
  EVENTO_TITULO,
  GEO,
  LOCAL_COMPLETO,
  SITE_URL,
} from "@/lib/somma-day/event.config";

/**
 * Tipografia da edição: Anton nas chamadas (condensada, pesada, aguenta caixa
 * alta gigante sem virar borrão) e Archivo no texto corrido — a mesma família
 * do Desafio das Esteiras, para o site não ganhar uma quinta fonte.
 */
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--sd-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--sd-copy",
  display: "swap",
});

const titulo = EVENTO_TITULO;
const descricao =
  "A corrida é só o começo. 26 de setembro, a partir das 7h, no Estacionamento 9 do Parque da Cidade: pelotões de 5, 6 e 8 km, ativações, café da manhã, Fit Dance, sorteios, DJ e pagode. Gratuito, com inscrição e vagas limitadas.";

/**
 * Schema.org do evento: é o que faz o Google mostrar data, local e preço na
 * busca, e o que alimenta os cards de "eventos perto de você".
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: EVENTO_TITULO,
  description: descricao,
  startDate: `${DATA_ISO}T07:00:00-03:00`,
  endDate: `${DATA_ISO}T13:00:00-03:00`,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  url: `${SITE_URL}${EVENTO_PATH}`,
  image: [`${SITE_URL}/somma-day/og.png`],
  location: {
    "@type": "Place",
    name: LOCAL_COMPLETO,
    address: { "@type": "PostalAddress", streetAddress: ENDERECO_COMPLETO, addressLocality: "Brasília", addressRegion: "DF", addressCountry: "BR" },
    geo: { "@type": "GeoCoordinates", latitude: GEO.lat, longitude: GEO.lng },
  },
  organizer: { "@type": "SportsOrganization", name: "SOMMA Club", url: SITE_URL },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}${EVENTO_PATH}#inscricao`,
  },
};

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: EVENTO_PATH },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${SITE_URL}${EVENTO_PATH}`,
    siteName: "SOMMA Club",
    title: titulo,
    description: descricao,
    images: [{ url: "/somma-day/og.png", width: 1200, height: 630, alt: titulo }],
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descricao,
    images: ["/somma-day/og.png"],
  },
  other: { "format-detection": "telephone=no" },
};

export default function SommaDayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${anton.variable} ${archivo.variable} somma-day-root`}
      data-cidade={CIDADE}
      data-horario={`${ABERTURA}-${ENCERRAMENTO}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
