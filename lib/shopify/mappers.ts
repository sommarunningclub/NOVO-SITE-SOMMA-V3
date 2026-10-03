/**
 * Storefront API → tipos de domínio.
 *
 * Os tipos `Raw*` descrevem só o que as queries deste módulo pedem. Nada aqui
 * inventa dado: campo ausente na Shopify vira `null` e a tela decide o que
 * fazer (em geral, não mostrar o bloco).
 */
import type {
  Cart,
  CartLine,
  ColorSibling,
  Drop,
  DropState,
  Money,
  Product,
  ProductBadge,
  ProductColor,
  ProductFit,
  ProductSummary,
  ProductVariant,
  ShopImage,
  SizeGuide,
} from "./types";

type RawMoney = { amount: string; currencyCode: string };
type RawImage = { url: string; altText: string | null; width: number | null; height: number | null };
type RawField = { value: string | null } | null;

type RawVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: RawMoney;
  compareAtPrice: RawMoney | null;
  selectedOptions: { name: string; value: string }[];
};

type RawColorPattern = {
  references: { nodes: { label?: RawField; color?: RawField }[] } | null;
} | null;

export type RawProductSummary = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  createdAt: string;
  priceRange: { minVariantPrice: RawMoney };
  compareAtPriceRange: { minVariantPrice: RawMoney };
  images: { nodes: RawImage[] };
  options: { name: string; optionValues: { name: string }[] }[];
  variants: { nodes: RawVariant[] };
  badge: RawField;
  keepInArchive: RawField;
  colorSiblingIds: RawField;
  colorPattern: RawColorPattern;
  drop: { reference: { handle?: string; code?: RawField; title?: RawField } | null } | null;
};

export type RawProductDetail = RawProductSummary & {
  description: string;
  descriptionHtml: string;
  seo: { title: string | null; description: string | null };
  allImages: { nodes: RawImage[] };
  fit: RawField;
  modelHeight: RawField;
  modelWeight: RawField;
  modelSize: RawField;
  story: RawField;
  sizeGuide: {
    reference: { title?: RawField; table?: RawField; howToMeasure?: RawField; fitNotes?: RawField } | null;
  } | null;
  colorSiblings: {
    references: {
      nodes: { handle?: string; title?: string; featuredImage?: RawImage | null; colorPattern?: RawColorPattern }[];
    } | null;
  } | null;
};

export type RawDrop = {
  handle: string;
  code: RawField;
  title: RawField;
  tagline: RawField;
  description: RawField;
  releaseDate: RawField;
  state: RawField;
  collection: { reference: { handle?: string } | null } | null;
  heroMedia: { reference: { image?: RawImage | null } | null } | null;
};

export type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: RawMoney };
  discountCodes: { code: string; applicable: boolean }[];
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { totalAmount: RawMoney; amountPerQuantity: RawMoney };
      merchandise: {
        id: string;
        title: string;
        selectedOptions: { name: string; value: string }[];
        image: RawImage | null;
        product: { handle: string; title: string };
      };
    }[];
  };
};

export function toMoney(raw: RawMoney): Money {
  return { amount: Number(raw.amount), currencyCode: raw.currencyCode };
}

export function toImage(raw: RawImage | null | undefined): ShopImage | null {
  if (!raw?.url) return null;
  // A Shopify devolve dimensão nula para alguns arquivos antigos; 4:5 é o
  // padrão das fotos de produto e evita layout shift mesmo sem a medida real.
  return { url: raw.url, altText: raw.altText, width: raw.width ?? 1000, height: raw.height ?? 1250 };
}

function toVariant(raw: RawVariant): ProductVariant {
  const price = toMoney(raw.price);
  const compare = raw.compareAtPrice ? toMoney(raw.compareAtPrice) : null;
  return {
    id: raw.id,
    title: raw.title === "Default Title" ? "Único" : raw.title,
    availableForSale: raw.availableForSale,
    quantityAvailable: raw.quantityAvailable,
    price,
    compareAtPrice: compare && compare.amount > price.amount ? compare : null,
    selectedOptions: raw.selectedOptions,
  };
}

const BADGES: readonly ProductBadge[] = ["NEW", "LIMITED"];
const FITS: readonly ProductFit[] = ["True to size", "Relaxed", "Race fit", "Oversized"];
const DROP_STATES: readonly DropState[] = ["em_breve", "ativo", "arquivo"];

function oneOf<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function toColor(raw: RawColorPattern | undefined): ProductColor | null {
  const node = raw?.references?.nodes[0];
  const name = node?.label?.value;
  return name ? { name, hex: node?.color?.value ?? null } : null;
}

function countJsonList(value: string | null | undefined): number {
  if (!value) return 0;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function toProductSummary(raw: RawProductSummary): ProductSummary {
  const price = toMoney(raw.priceRange.minVariantPrice);
  const compare = toMoney(raw.compareAtPriceRange.minVariantPrice);
  const [image, hoverImage] = raw.images.nodes.map(toImage);
  const drop = raw.drop?.reference;

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    availableForSale: raw.availableForSale,
    price,
    compareAtPrice: compare.amount > price.amount ? compare : null,
    image: image ?? null,
    hoverImage: hoverImage ?? null,
    variants: raw.variants.nodes.map(toVariant),
    // Produto sem variação vem com a opção fantasma "Title" da Shopify.
    options: raw.options
      .filter((o) => !(o.name === "Title" && o.optionValues.length <= 1))
      .map((o) => ({ name: o.name, values: o.optionValues.map((v) => v.name) })),
    badge: oneOf(raw.badge?.value, BADGES),
    keepInArchive: raw.keepInArchive?.value === "true",
    color: toColor(raw.colorPattern),
    // o metafield lista as OUTRAS cores; a própria peça conta mais uma
    colorCount: countJsonList(raw.colorSiblingIds?.value) + 1,
    drop:
      drop?.handle && drop.code?.value && drop.title?.value
        ? { handle: drop.handle, code: drop.code.value, title: drop.title.value }
        : null,
    createdAt: raw.createdAt,
  };
}

function toInt(field: RawField): number | null {
  const n = Number.parseInt(field?.value ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

/** Tabela do guia: uma medida por linha, colunas separadas por ponto e vírgula. */
export function parseSizeTable(table: string | null | undefined): string[][] {
  return (table ?? "")
    .split(/\r?\n/)
    .map((line) => line.split(";").map((cell) => cell.trim()))
    .filter((cells) => cells.some(Boolean));
}

function toSizeGuide(raw: RawProductDetail["sizeGuide"]): SizeGuide | null {
  const ref = raw?.reference;
  const rows = parseSizeTable(ref?.table?.value);
  if (!ref || rows.length < 2) return null;
  return {
    title: ref.title?.value ?? "Guia de tamanhos",
    rows,
    howToMeasure: ref.howToMeasure?.value ?? null,
    fitNotes: ref.fitNotes?.value ?? null,
  };
}

export function toProduct(raw: RawProductDetail): Product {
  const summary = toProductSummary(raw);
  const images = raw.allImages.nodes.map(toImage).filter((i): i is ShopImage => i !== null);

  const siblings: ColorSibling[] = (raw.colorSiblings?.references?.nodes ?? [])
    .filter((n): n is { handle: string; title: string; featuredImage?: RawImage | null; colorPattern?: RawColorPattern } =>
      Boolean(n.handle && n.title),
    )
    .map((n) => ({
      handle: n.handle,
      title: n.title,
      color: toColor(n.colorPattern),
      image: toImage(n.featuredImage),
      current: false,
    }));
  const colorSiblings: ColorSibling[] = siblings.length
    ? [{ handle: raw.handle, title: raw.title, color: summary.color, image: summary.image, current: true }, ...siblings]
    : [];

  const heightCm = toInt(raw.modelHeight);
  const weightKg = toInt(raw.modelWeight);
  const size = raw.modelSize?.value ?? null;

  return {
    ...summary,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    images,
    colorSiblings,
    fit: oneOf(raw.fit?.value, FITS),
    model: heightCm || weightKg || size ? { heightCm, weightKg, size } : null,
    storyHtml: richTextToHtml(raw.story?.value),
    sizeGuide: toSizeGuide(raw.sizeGuide),
    seo: raw.seo,
  };
}

export function toDrop(raw: RawDrop): Drop | null {
  const title = raw.title?.value;
  const code = raw.code?.value;
  if (!title || !code) return null;
  return {
    handle: raw.handle,
    code,
    title,
    tagline: raw.tagline?.value ?? null,
    description: raw.description?.value ?? null,
    releaseDate: raw.releaseDate?.value ?? null,
    state: oneOf(raw.state?.value, DROP_STATES) ?? "ativo",
    collectionHandle: raw.collection?.reference?.handle ?? null,
    heroImage: toImage(raw.heroMedia?.reference?.image),
  };
}

export function toCart(raw: RawCart): Cart {
  const lines: CartLine[] = raw.lines.nodes.map((line) => ({
    id: line.id,
    quantity: line.quantity,
    variantId: line.merchandise.id,
    variantTitle: line.merchandise.title === "Default Title" ? "Único" : line.merchandise.title,
    productHandle: line.merchandise.product.handle,
    productTitle: line.merchandise.product.title,
    image: toImage(line.merchandise.image),
    unitPrice: toMoney(line.cost.amountPerQuantity),
    totalPrice: toMoney(line.cost.totalAmount),
    selectedOptions: line.merchandise.selectedOptions,
  }));
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    lines,
    subtotal: toMoney(raw.cost.subtotalAmount),
    discountCodes: raw.discountCodes,
  };
}

/** Linhas de um campo de texto multilinha (headline, manifesto). */
export function toLines(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// ── Rich text da Shopify → HTML ─────────────────────────────────────────────

type RichNode = {
  type: string;
  value?: string;
  bold?: boolean;
  italic?: boolean;
  url?: string;
  level?: number;
  listType?: "ordered" | "unordered";
  children?: RichNode[];
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderRich(node: RichNode): string {
  const inner = () => (node.children ?? []).map(renderRich).join("");
  switch (node.type) {
    case "root":
      return inner();
    case "paragraph":
      return `<p>${inner()}</p>`;
    case "heading":
      return `<h${Math.min(Math.max(node.level ?? 3, 2), 4)}>${inner()}</h${Math.min(Math.max(node.level ?? 3, 2), 4)}>`;
    case "list":
      return node.listType === "ordered" ? `<ol>${inner()}</ol>` : `<ul>${inner()}</ul>`;
    case "list-item":
      return `<li>${inner()}</li>`;
    case "link":
      // só http(s): o conteúdo vem do admin, mas URL não confiável não vira href
      return /^https?:\/\//.test(node.url ?? "")
        ? `<a href="${escapeHtml(node.url ?? "")}" rel="noopener">${inner()}</a>`
        : inner();
    case "text": {
      let text = escapeHtml(node.value ?? "");
      if (node.bold) text = `<strong>${text}</strong>`;
      if (node.italic) text = `<em>${text}</em>`;
      return text;
    }
    default:
      return inner();
  }
}

export function richTextToHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const html = renderRich(JSON.parse(value) as RichNode);
    return html || null;
  } catch {
    return null;
  }
}
