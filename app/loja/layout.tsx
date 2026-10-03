import type { Metadata, Viewport } from "next";
import { Inter_Tight, Zilla_Slab } from "next/font/google";
import { HANDLES, ROUTES, getCollection, getCurrentDrop, isPreviewMode } from "@/lib/shopify";
import { CartDrawer } from "./_components/CartDrawer";
import { Footer } from "./_components/Footer";
import { Header, type NavItem } from "./_components/Header";
import { LojaProvider } from "./_components/LojaProvider";
import { SearchOverlay } from "./_components/SearchOverlay";
import "./loja.css";

/**
 * Tipografia. O MIV 2026 pede Parabolica (principal) e Elizeth (apoio), mas os
 * arquivos licenciados ainda não estão no projeto. Até chegarem valem estas
 * SUBSTITUTAS do Google Fonts, escolhidas pela proximidade de desenho:
 *   Parabolica → Inter Tight (grotesca neutra, encaixe apertado)
 *   Elizeth    → Zilla Slab (serifa egípcia)
 * Para trocar: declarar as duas com `next/font/local` expondo
 * `--font-parabolica` e `--font-elizeth`; o loja.css já dá prioridade a elas.
 * Ver docs/loja/DESIGN_SYSTEM.md.
 */
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-lj-sans", display: "swap" });
const slab = Zilla_Slab({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lj-slab", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SOMMA Club Store", template: "%s | SOMMA Club Store" },
  description:
    "A loja do SOMMA Club. Running culture nascida em Brasília: drops, peças de treino e acessórios do clube que corre todo sábado, às 7h, no Parque da Cidade.",
  alternates: { canonical: ROUTES.home },
  // Fora do Google até o lançamento. Tirar esta linha é a virada de chave.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMMA Club Store",
    title: "SOMMA Club Store",
    description: "Running culture. Born in 061.",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Navegação principal. Se a Shopify falhar aqui, a loja ainda abre: só sem os números. */
async function getNav(): Promise<NavItem[]> {
  const [drop, all, archive] = await Promise.all([
    getCurrentDrop().catch(() => null),
    getCollection(HANDLES.allProducts).catch(() => null),
    getCollection(HANDLES.archive).catch(() => null),
  ]);
  return [
    { label: "Shop", href: ROUTES.shop, note: all ? pad(all.products.length) : undefined },
    {
      label: "Drops",
      href: drop?.collectionHandle ? ROUTES.collection(drop.collectionHandle) : ROUTES.shop,
      note: drop?.code,
    },
    { label: "Archive", href: ROUTES.archive, note: archive ? pad(archive.products.length) : undefined },
    { label: "Club", href: ROUTES.club, note: "061" },
  ];
}

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const nav = await getNav();
  const previewNote = isPreviewMode()
    ? "Prévia local: catálogo copiado da Shopify, sacola sem checkout. A loja de verdade lê a Storefront API."
    : null;

  return (
    <div className={`loja ${sans.variable} ${slab.variable}`}>
      <LojaProvider>
        <a className="lj-skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Header nav={nav} />
        <main id="conteudo">{children}</main>
        <Footer nav={nav} previewNote={previewNote} />
        <CartDrawer />
        <SearchOverlay />
      </LojaProvider>
    </div>
  );
}
