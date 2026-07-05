import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { SOMMA } from "@/lib/somma-data";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sommaclub.com.br"),
  title: "SOMMA Club: o maior running club do Distrito Federal",
  description:
    "Faça parte do maior running club do Distrito Federal. O Somma Club é gratuito, aberto a todos os níveis e se reúne todo sábado, às 7h, no Parque da Cidade, em Brasília.",
  keywords: [
    "running club Brasília",
    "corrida Brasília",
    "Somma Club",
    "Parque da Cidade",
    "grupo de corrida DF",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "SOMMA Club: o maior running club do Distrito Federal",
    description:
      "+5.000 membros. Gratuito. Todo sábado, às 7h, no Parque da Cidade, em Brasília.",
    siteName: "SOMMA Club",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOMMA Club: o maior running club do Distrito Federal",
    description:
      "+5.000 membros. Gratuito. Todo sábado, às 7h, no Parque da Cidade, em Brasília.",
  },
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SportsOrganization",
      name: "SOMMA Club",
      description: "O maior running club do Distrito Federal.",
      url: "https://sommaclub.com.br",
      sameAs: [SOMMA.links.instagram, SOMMA.links.tiktok, SOMMA.links.strava],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brasília",
        addressRegion: "DF",
        addressCountry: "BR",
      },
    },
    {
      "@type": "Event",
      name: "Encontro semanal do SOMMA Club",
      description:
        "Encontro gratuito de corrida do SOMMA Club, aberto a todos os níveis.",
      eventSchedule: {
        "@type": "Schedule",
        byDay: "https://schema.org/Saturday",
        startTime: "07:00",
        repeatFrequency: "P1W",
      },
      location: {
        "@type": "Place",
        name: "Parque da Cidade Sarah Kubitschek — Estacionamento 10",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Brasília",
          addressRegion: "DF",
          addressCountry: "BR",
        },
      },
      organizer: { "@type": "Organization", name: "SOMMA Club" },
      isAccessibleForFree: true,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
      <GoogleTagManager gtmId={SOMMA.analytics.gtm} />
      <GoogleAnalytics gaId={SOMMA.analytics.ga4} />
    </html>
  );
}
