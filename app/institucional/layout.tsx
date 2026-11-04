import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./institucional.css";

// Archivo variável com eixo de largura: a mesma família faz os títulos
// condensados e os números largos. A Parabolica (fonte da marca) não tem
// licença web no projeto; trocar aqui quando os woff2 chegarem.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOMMA Club · Institucional",
  description:
    "Sua marca dentro de uma comunidade em movimento. A SOMMA Club é uma plataforma de influência física, digital e cultural no universo da corrida e do wellness.",
  // Material comercial: circula por link, fora do Google.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/institucional" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMMA Club",
    title: "SOMMA Club · Sua marca dentro de uma comunidade em movimento",
    description:
      "Comunidade, experiências e inteligência para marcas que querem fazer parte da vida das pessoas.",
    url: "https://sommaclub.com.br/institucional",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function InstitucionalLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${archivo.variable} inst`}>{children}</div>;
}
