import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SOMMA Club · Mídia Kit 2026",
  description:
    "O maior running club do DF. +6.000 membros, 300 pessoas todo sábado, Somma Special Day e uma audiência premium pronta para a sua marca.",
  // Material comercial: só por link, fora do Google.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ppt-midiakit-somma-club-2026" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function MidiaKitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
