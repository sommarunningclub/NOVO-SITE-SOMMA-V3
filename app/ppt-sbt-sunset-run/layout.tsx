import type { Metadata, Viewport } from "next";
import { Archivo, Chivo, Chivo_Mono } from "next/font/google";

/** Display: grotesk com eixo de largura, para headlines expandidas de brand esportiva. */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--f-display",
  display: "swap",
});

/** Texto corrido. */
const text = Chivo({
  subsets: ["latin"],
  variable: "--f-text",
  display: "swap",
});

/** Dados, splits, números de peito. */
const mono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SBT Sunset Run × Somma Club · Road to Sunset",
  description:
    "Proposta de Community Experience Partnership: a SBT Sunset Run não começa na Esplanada. Começa semanas antes, correndo com a Somma.",
  // material comercial: circula por link, fora dos buscadores
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ppt-sbt-sunset-run" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#04081A",
  colorScheme: "dark",
};

export default function SbtSunsetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${text.variable} ${mono.variable}`}>{children}</div>
  );
}
