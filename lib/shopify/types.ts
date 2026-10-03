/**
 * Tipos de domínio da loja.
 *
 * A interface visual só conhece estes tipos. Quem fala GraphQL com a Shopify é
 * `lib/shopify/*`; os componentes nunca veem `edges`, `nodes` nem metafields
 * crus. Trocar de versão da Storefront API mexe nos mappers, não nas telas.
 */

export type Money = {
  amount: number;
  currencyCode: string;
};

export type ShopImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type SelectedOption = { name: string; value: string };

export type ProductOption = { name: string; values: string[] };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  /** `null` quando a loja não expõe quantidade (escopo de estoque desligado). */
  quantityAvailable: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
};

/** Selos vêm do metafield `somma.badge`. SOLD OUT não é selo: é estoque. */
export type ProductBadge = "NEW" | "LIMITED";

export type ProductFit = "True to size" | "Relaxed" | "Race fit" | "Oversized";

export type ProductColor = { name: string; hex: string | null };

export type DropRef = { handle: string; code: string; title: string };

export type ColorSibling = {
  handle: string;
  title: string;
  color: ProductColor | null;
  image: ShopImage | null;
  current: boolean;
};

/** O que um card de produto precisa. Tudo o que a PLP e os trilhos carregam. */
export type ProductSummary = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  image: ShopImage | null;
  /** Segunda foto (costas, lifestyle). Só existe quando a Shopify tem a mídia. */
  hoverImage: ShopImage | null;
  variants: ProductVariant[];
  options: ProductOption[];
  badge: ProductBadge | null;
  keepInArchive: boolean;
  color: ProductColor | null;
  /** Quantas cores a peça tem, contando com ela. 1 = cor única. */
  colorCount: number;
  drop: DropRef | null;
  createdAt: string;
};

export type ProductModel = {
  heightCm: number | null;
  weightKg: number | null;
  size: string | null;
};

export type SizeGuide = {
  title: string;
  /** Primeira linha é o cabeçalho. */
  rows: string[][];
  howToMeasure: string | null;
  fitNotes: string | null;
};

export type Product = ProductSummary & {
  description: string;
  descriptionHtml: string;
  images: ShopImage[];
  colorSiblings: ColorSibling[];
  fit: ProductFit | null;
  model: ProductModel | null;
  /** HTML já convertido do rich text `somma.story`. */
  storyHtml: string | null;
  sizeGuide: SizeGuide | null;
  seo: { title: string | null; description: string | null };
};

export type DropState = "em_breve" | "ativo" | "arquivo";

export type Drop = {
  handle: string;
  code: string;
  title: string;
  tagline: string | null;
  description: string | null;
  releaseDate: string | null;
  state: DropState;
  collectionHandle: string | null;
  heroImage: ShopImage | null;
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  image: ShopImage | null;
  products: ProductSummary[];
  /** Preenchido quando a coleção é a vitrine de um drop. */
  drop: Drop | null;
};

export type CategoryLink = {
  handle: string;
  title: string;
  count: number;
  image: ShopImage | null;
};

export type Lookbook = {
  title: string;
  subtitle: string | null;
  images: ShopImage[];
  products: ProductSummary[];
};

export type HomeContent = {
  /** A imagem da hero é a arte tribal animada (HeroFire); daqui vêm só os textos. */
  hero: {
    headline: string[];
    ctaLabel: string;
  };
  manifesto: string[];
  club: { headline: string[]; text: string; image: ShopImage };
  newsletter: { headline: string[]; text: string };
  announcement: string | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantTitle: string;
  productHandle: string;
  productTitle: string;
  image: ShopImage | null;
  unitPrice: Money;
  totalPrice: Money;
  selectedOptions: SelectedOption[];
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  subtotal: Money;
  discountCodes: { code: string; applicable: boolean }[];
};

export type SearchResults = {
  products: ProductSummary[];
  collections: { handle: string; title: string }[];
  suggestions: string[];
};
