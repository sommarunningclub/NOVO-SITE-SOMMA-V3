import type { Metadata, Viewport } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import "../../o-longao/evento.css";

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

export const metadata: Metadata = {
  title: "Painel | O Longão",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
};

export default function LongaoAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lgo min-h-screen ${sans.variable} ${mono.variable}`}>{children}</div>;
}
