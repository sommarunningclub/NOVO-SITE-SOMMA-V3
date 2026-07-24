import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Somma Club x Michelob Ultra · Proposta financeira",
  description:
    "Proposta comercial: campanha de 21 dias e grande evento de encerramento, com investimento, escopo do Somma e responsabilidades da Michelob Ultra.",
  // Material comercial: só por link, fora do Google.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ppt-michelob-proposta" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060B1C",
};

export default function MichelobPropostaLayout({ children }: { children: React.ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
