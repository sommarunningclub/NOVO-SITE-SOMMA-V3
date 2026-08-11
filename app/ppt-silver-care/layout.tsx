import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Instrument_Serif } from "next/font/google";

/** Condensada da marca: títulos, kickers e números. */
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/** Serifa editorial: usada só nas frases-manifesto, em doses pequenas. */
const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Somma Club × Silver Care · Proposta de parceria",
  description:
    "Proposta de parceria recorrente: colocar a Silver Care dentro da rotina de quem corre — antes, durante e depois do treino.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/ppt-silver-care" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function SilverCareLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${editorial.variable}`}>{children}</div>;
}
