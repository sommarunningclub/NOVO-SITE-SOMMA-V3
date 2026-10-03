import type { Cart, CartLine, Money, ProductSummary } from "@/lib/shopify/types";

/**
 * Eventos de e-commerce da loja, no padrão GA4.
 *
 * O site já carrega GA4 (gtag) e GTM no layout raiz; a loja não adiciona tag
 * nenhuma. Cada evento sai por UM caminho só, para nunca contar em dobro:
 * `gtag` quando existe (vai direto ao GA4), senão `dataLayer` (GTM). O
 * container do GTM hoje não tem tag de e-commerce; se um dia ganhar, troca-se
 * o transporte aqui, num lugar só.
 *
 * `purchase` não sai daqui: a compra termina no checkout da Shopify, fora do
 * site (ver docs/loja/STORE_ARCHITECTURE.md).
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Item = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price: number;
  quantity: number;
  index?: number;
  item_list_name?: string;
};

function send(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    if (window.gtag) {
      window.gtag("event", event, params);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    // zera o objeto anterior, como o GA4 recomenda, para um evento não herdar itens do outro
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event, ecommerce: params });
  } catch {
    // analytics nunca pode derrubar a compra
  }
}

const fromProduct = (p: ProductSummary, extra: Partial<Item> = {}): Item => ({
  item_id: p.handle,
  item_name: p.title,
  price: p.price.amount,
  quantity: 1,
  ...extra,
});

const fromLine = (l: CartLine): Item => ({
  item_id: l.productHandle,
  item_name: l.productTitle,
  item_variant: l.variantTitle,
  price: l.unitPrice.amount,
  quantity: l.quantity,
});

const value = (m: Money) => ({ currency: m.currencyCode, value: m.amount });

export const track = {
  viewItemList(listName: string, products: ProductSummary[]) {
    if (products.length === 0) return;
    send("view_item_list", {
      item_list_name: listName,
      items: products.map((p, index) => fromProduct(p, { index, item_list_name: listName })),
    });
  },
  selectItem(listName: string, product: ProductSummary, index: number) {
    send("select_item", { item_list_name: listName, items: [fromProduct(product, { index, item_list_name: listName })] });
  },
  viewItem(product: ProductSummary) {
    send("view_item", { ...value(product.price), items: [fromProduct(product)] });
  },
  addToCart(item: { handle: string; title: string; variantTitle: string; price: Money; quantity: number }) {
    send("add_to_cart", {
      currency: item.price.currencyCode,
      value: item.price.amount * item.quantity,
      items: [{ item_id: item.handle, item_name: item.title, item_variant: item.variantTitle, price: item.price.amount, quantity: item.quantity }],
    });
  },
  removeFromCart(line: CartLine) {
    send("remove_from_cart", { ...value(line.totalPrice), items: [fromLine(line)] });
  },
  viewCart(cart: Cart) {
    send("view_cart", { ...value(cart.subtotal), items: cart.lines.map(fromLine) });
  },
  beginCheckout(cart: Cart) {
    send("begin_checkout", { ...value(cart.subtotal), items: cart.lines.map(fromLine) });
  },
  search(term: string) {
    send("search", { search_term: term });
  },
};
