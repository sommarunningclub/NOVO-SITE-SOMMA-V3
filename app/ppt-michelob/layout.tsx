import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Somma Club x Michelob Ultra · Michelob Ultra Social Run",
  description:
    "Proposta de campanha: uma experiência proprietária que começa na corrida e termina como encontro social. Corra pelo momento. Fique pela experiência.",
  // Material comercial: só por link, fora do Google.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ppt-michelob" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060B1C",
};

export default function MichelobLayout({ children }: { children: React.ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
