import type { Metadata, Viewport } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";
import "../../desafios-das-esteiras-evolve/evento.css";

/**
 * Reusa o `evento.css` porque as classes `dst-*` são a linguagem visual da área
 * de operação deste projeto, e não algo do evento em si. O módulo de campanhas
 * fica irmão do Desafio das Esteiras dentro de /admin, com a mesma cara.
 */

const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-dst-sans", display: "swap" });
const mono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dst-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campanhas | Operação",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

export default function CampanhasAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`dst min-h-[100svh] ${sans.variable} ${mono.variable}`}>{children}</div>;
}
