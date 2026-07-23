import type { Metadata, Viewport } from "next";
import { Oswald, Inter } from "next/font/google";

const title = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ubc-title",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-ubc-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ultra Balance Challenge · Somma Club x Michelob Ultra",
  description:
    "Plataforma digital de 21 dias que conecta movimento, conexão e diversão antes do Michelob Ultra Social Run. Missões, pontuação, rankings, recompensas e dados mensuráveis.",
  // Material comercial: só por link, fora do Google.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ultra-balance-challenge" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111C4E",
};

export default function UltraBalanceChallengeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${title.variable} ${body.variable} font-copy`}>{children}</div>;
}
