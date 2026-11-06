import type { Metadata } from "next";
import { CAMINHO_CORRE } from "@/lib/vem-correr-comigo/regras";
import "./corre.css";

const titulo = "Vem correr comigo? · Dexcomplica Love Run";
const descricao = "Encontre sua companhia, forme seu grupo e venha descomplicar com a gente. Exclusivo para inscritos.";

/** Metadados genéricos de propósito: o link compartilhado nunca mostra dado de ninguém. */
export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: CAMINHO_CORRE },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: { title: titulo, description: descricao, images: [{ url: "/dexcomplica-love-run/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: titulo, description: descricao, images: ["/dexcomplica-love-run/og.jpg"] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
