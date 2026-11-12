import type { Metadata, Viewport } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import "./evento.css";

/**
 * Duas famílias, as mesmas já usadas em outras páginas de evento do site (o
 * build guarda as fontes do Google no repositório; família nova exigiria
 * regenerar o pacote): Archivo no eixo de largura, condensada e pesada nos
 * títulos, e Azeret Mono como voz dos dados técnicos.
 */
const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-mt-sans", display: "swap" });
const mono = Azeret_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mt-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sommaclub.com.br"),
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`mt-raiz ${sans.variable} ${mono.variable}`}>{children}</div>;
}
