import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Instrument_Serif } from "next/font/google";

/** Condensada: títulos, kickers e números. */
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/** Serifa editorial: só nas frases-manifesto, em doses pequenas. */
const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estação SOMMA · Café, Cultura e Movimento · powered by Evolve",
  description:
    "Proposta de construção conjunta SOMMA Club + Evolve: uma nova plataforma de alimentação, comunidade e movimento no Parque da Cidade.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ppt-estacao-somma" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function EstacaoSommaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${editorial.variable}`}>
      {/* Telas de projeção: a tipografia cresce com a tela para manter a presença editorial. */}
      <style>{`@media (min-width: 1600px) { html { font-size: 17.5px; } } @media (min-width: 1880px) { html { font-size: 19px; } }`}</style>
      {children}
    </div>
  );
}
