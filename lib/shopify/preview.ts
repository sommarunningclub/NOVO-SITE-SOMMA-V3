import "server-only";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type {
  Cart,
  CartLine,
  CategoryLink,
  Collection,
  ColorSibling,
  Drop,
  Lookbook,
  Money,
  Product,
  ProductBadge,
  ProductColor,
  ProductOption,
  ProductSummary,
  ProductVariant,
  SearchResults,
  ShopImage,
} from "./types";

/**
 * Prévia local do catálogo — só `next dev` sem token (ver `isPreviewMode`).
 *
 * Lê a foto gravada por `scripts/loja-preview-snapshot.mjs`, que são os
 * produtos REAIS da loja tirados pela Admin API. Existe para dar para
 * construir e revisar as telas antes de os tokens do canal Headless chegarem;
 * não é fonte de dado em produção e o arquivo nem entra no git.
 *
 * O carrinho da prévia vive na memória do processo de dev e não tem checkout.
 */

type PreviewProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  createdAt: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  images: ShopImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  badge: ProductBadge | null;
  keepInArchive: boolean;
  color: ProductColor | null;
  colorSiblings: ColorSibling[];
  drop: { handle: string; code: string; title: string } | null;
};

type Snapshot = {
  generatedAt: string;
  products: PreviewProduct[];
  collections: { handle: string; title: string; description: string; productHandles: string[] }[];
  drops: (Omit<Drop, "heroImage" | "tagline"> & { tagline: string | null })[];
};

const FILE = join(process.cwd(), ".loja-preview", "catalog.json");
let cached: { mtimeMs: number; data: Snapshot } | null = null;

function load(): Snapshot {
  if (!existsSync(FILE)) {
    return { generatedAt: "", products: [], collections: [], drops: [] };
  }
  const { mtimeMs } = statSync(FILE);
  if (!cached || cached.mtimeMs !== mtimeMs) {
    cached = { mtimeMs, data: JSON.parse(readFileSync(FILE, "utf8")) as Snapshot };
  }
  return cached.data;
}

export function hasPreviewSnapshot(): boolean {
  return load().products.length > 0;
}

function summary(p: PreviewProduct): ProductSummary {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    availableForSale: p.availableForSale,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: p.images[0] ?? null,
    hoverImage: p.images[1] ?? null,
    variants: p.variants,
    options: p.options,
    badge: p.badge,
    keepInArchive: p.keepInArchive,
    color: p.color,
    colorCount: Math.max(p.colorSiblings.length, 1),
    drop: p.drop,
    createdAt: p.createdAt,
  };
}

function detail(p: PreviewProduct): Product {
  return {
    ...summary(p),
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    images: p.images,
    colorSiblings: p.colorSiblings,
    // Caimento, modelo, história e guia vêm de metafields que a loja ainda não preencheu.
    fit: null,
    model: null,
    storyHtml: null,
    sizeGuide: null,
    seo: { title: null, description: null },
  };
}

const byHandles = (handles: string[]): PreviewProduct[] => {
  const all = load().products;
  return handles.map((h) => all.find((p) => p.handle === h)).filter((p): p is PreviewProduct => Boolean(p));
};

export function previewProduct(handle: string): Product | null {
  const p = load().products.find((x) => x.handle === handle);
  return p ? detail(p) : null;
}

export function previewDrops(): Drop[] {
  // foto de campanha da prévia: o ensaio do boné, que mostra três peças da linha
  const campaign = load().products.find((p) => p.handle === "bone-2026")?.images[2] ?? null;
  return load().drops.map((d) => ({ ...d, heroImage: campaign }));
}

export function previewCollection(handle: string): Collection | null {
  const data = load();
  const c = data.collections.find((x) => x.handle === handle);
  if (!c) return null;
  const drop = previewDrops().find((d) => d.collectionHandle === handle) ?? null;
  return {
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: null,
    products: byHandles(c.productHandles).map(summary),
    drop,
  };
}

const CATEGORIES = ["regatas", "croppeds", "camisetas", "acessorios"];

export function previewCategories(): CategoryLink[] {
  return CATEGORIES.map((handle) => previewCollection(handle))
    .filter((c): c is Collection => c !== null && c.products.length > 0)
    .map((c) => ({ handle: c.handle, title: c.title, count: c.products.length, image: c.products[0]?.image ?? null }));
}

export function previewRecommendations(handle: string, intent: "RELATED" | "COMPLEMENTARY"): ProductSummary[] {
  const data = load();
  const current = data.products.find((p) => p.handle === handle);
  if (!current) return [];
  const onSale = byHandles(data.collections.find((c) => c.handle === "todos")?.productHandles ?? []);
  const others = onSale.filter((p) => p.handle !== handle);
  const accessories = new Set(data.collections.find((c) => c.handle === "acessorios")?.productHandles ?? []);
  if (intent === "COMPLEMENTARY") {
    // peça de roupa pede acessório; acessório pede roupa
    const wantAccessory = !accessories.has(handle);
    return others.filter((p) => accessories.has(p.handle) === wantAccessory).slice(0, 2).map(summary);
  }
  return others.filter((p) => !accessories.has(p.handle) || accessories.has(handle)).slice(0, 4).map(summary);
}

export function previewLookbook(): Lookbook | null {
  const pick = (handle: string, index: number): ShopImage | null =>
    load().products.find((p) => p.handle === handle)?.images[index] ?? null;
  const images = [
    pick("bone-2026", 1),
    pick("cropped-somma-laranja", 0),
    pick("bone-2026", 3),
    pick("regata-machao-fire-pack", 0),
    pick("bone-2026", 5),
    pick("cropped-somma-laranja", 1),
  ].filter((i): i is ShopImage => i !== null);
  if (images.length < 3) return null;
  return {
    title: "Lookbook",
    subtitle: "Brasília, 2026",
    images,
    products: byHandles(["bone-2026", "cropped-somma-laranja", "regata-machao-fire-pack"]).map(summary),
  };
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function previewSearch(query: string): SearchResults {
  const q = fold(query.trim());
  if (!q) return { products: [], collections: [], suggestions: [] };
  const data = load();
  const products = data.products.filter((p) => fold(p.title).includes(q)).slice(0, 6).map(summary);
  const collections = data.collections
    .filter((c) => fold(c.title).includes(q))
    .slice(0, 3)
    .map((c) => ({ handle: c.handle, title: c.title }));
  return { products, collections, suggestions: [] };
}

// ── Carrinho da prévia (memória do processo de dev) ─────────────────────────

type PreviewCartState = { lines: { id: string; variantId: string; quantity: number }[]; discountCodes: string[] };

const store = globalThis as typeof globalThis & { __lojaPreviewCarts?: Map<string, PreviewCartState> };
const carts = (store.__lojaPreviewCarts ??= new Map<string, PreviewCartState>());

function buildCart(id: string, state: PreviewCartState): Cart {
  const all = load().products;
  const lines: CartLine[] = [];
  for (const line of state.lines) {
    const product = all.find((p) => p.variants.some((v) => v.id === line.variantId));
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) continue;
    lines.push({
      id: line.id,
      quantity: line.quantity,
      variantId: variant.id,
      variantTitle: variant.title,
      productHandle: product.handle,
      productTitle: product.title,
      image: product.images[0] ?? null,
      unitPrice: variant.price,
      totalPrice: { amount: variant.price.amount * line.quantity, currencyCode: variant.price.currencyCode },
      selectedOptions: variant.selectedOptions,
    });
  }
  return {
    id,
    // prévia não tem checkout: a gaveta mostra o aviso em vez do botão
    checkoutUrl: "",
    totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
    lines,
    subtotal: { amount: lines.reduce((n, l) => n + l.totalPrice.amount, 0), currencyCode: "BRL" },
    discountCodes: state.discountCodes.map((code) => ({ code, applicable: false })),
  };
}

export function previewCartGet(id: string): Cart | null {
  const state = carts.get(id);
  return state ? buildCart(id, state) : null;
}

export function previewCartMutate(
  id: string | null,
  change: (state: PreviewCartState) => void,
): Cart {
  const cartId = id && carts.has(id) ? id : `previa-${Date.now().toString(36)}`;
  const state = carts.get(cartId) ?? { lines: [], discountCodes: [] };
  change(state);
  state.lines = state.lines.filter((l) => l.quantity > 0);
  carts.set(cartId, state);
  return buildCart(cartId, state);
}
