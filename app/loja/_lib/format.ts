import type { Money, ProductSummary } from "@/lib/shopify/types";

const formatters = new Map<string, Intl.NumberFormat>();

/** "R$ 109,90". O símbolo e a vírgula vêm do Intl, não de concatenação. */
export function formatMoney(money: Money): string {
  let fmt = formatters.get(money.currencyCode);
  if (!fmt) {
    fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: money.currencyCode });
    formatters.set(money.currencyCode, fmt);
  }
  return fmt.format(money.amount);
}

/** "jul 2026" a partir de uma data ISO. */
export function formatMonth(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "America/Sao_Paulo" })
    .format(date)
    .replace(".", "")
    .replace(" de ", " ");
}

/** Código editorial da peça dentro de uma lista: 061.001, 061.002… */
export function pieceCode(index: number): string {
  return `061.${String(index + 1).padStart(3, "0")}`;
}

export type StockState = "sold-out" | "last-units" | "available";

/** Abaixo disto a peça ganha o aviso de últimas unidades (quando a loja expõe estoque). */
const LAST_UNITS = 5;

/**
 * Estado de estoque a partir do dado real da Shopify. Sem quantidade exposta
 * não existe "últimas unidades": escassez não se inventa.
 */
export function stockState(product: Pick<ProductSummary, "availableForSale" | "variants">): StockState {
  if (!product.availableForSale) return "sold-out";
  const known = product.variants.every((v) => v.quantityAvailable !== null);
  if (!known) return "available";
  const total = product.variants.reduce((n, v) => n + Math.max(v.quantityAvailable ?? 0, 0), 0);
  return total > 0 && total <= LAST_UNITS ? "last-units" : "available";
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

/**
 * Descrição da Shopify (HTML do editor do admin) → parágrafos de texto puro.
 * A tela monta os <p> com React, então nenhum HTML de fora é injetado na página.
 */
export function descriptionParagraphs(html: string): string[] {
  return html
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name] ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * JSON-LD para dentro de <script>. O `<` vira escape unicode para que um
 * texto de produto contendo "</script>" não consiga fechar a tag.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
