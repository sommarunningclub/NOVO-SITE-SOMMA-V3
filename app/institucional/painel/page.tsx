import type { Metadata } from "next";
import { PainelPagina } from "../_components/painel/PainelPagina";

export const metadata: Metadata = {
  title: "SOMMA Club · Painel da comunidade",
  description: "Recorrência, estreantes e retenção da comunidade SOMMA Club, em números agregados.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://sommaclub.com.br/institucional/painel" },
};

export default function PainelPage() {
  return <PainelPagina />;
}
