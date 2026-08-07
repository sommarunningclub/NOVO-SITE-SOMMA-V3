import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOMMA ENERGY RUN · powered by Choco Energy — Somma Club × 100% Você",
  description:
    "Energia antes. Performance durante. Comunidade depois. Proposta de parceria Somma Club × 100% Você.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/proposta-100voce" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default function Proposta100VoceLayout({ children }: { children: React.ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
