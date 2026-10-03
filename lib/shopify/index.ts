import "server-only";
import { ShopifyError, storefront } from "./client";
import { REVALIDATE, TAGS, isPreviewMode } from "./config";
import { HANDLES } from "./handles";
import {
  toCart,
  toDrop,
  toImage,
  toLines,
  toProduct,
  toProductSummary,
  type RawCart,
  type RawDrop,
  type RawProductDetail,
  type RawProductSummary,
} from "./mappers";
import {
  CART_CREATE_MUTATION,
  CART_DISCOUNT_CODES_UPDATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
} from "./mutations/cart";
import * as preview from "./preview";
import { CART_QUERY } from "./queries/cart";
import {
  CATEGORY_MENU_QUERY,
  COLLECTION_QUERY,
  DROPS_QUERY,
  HOME_QUERY,
  PREDICTIVE_SEARCH_QUERY,
  PRODUCT_QUERY,
  RECOMMENDATIONS_QUERY,
} from "./queries/catalog";
import type {
  Cart,
  CategoryLink,
  Collection,
  Drop,
  HomeContent,
  Lookbook,
  Product,
  ProductSummary,
  SearchResults,
  ShopImage,
} from "./types";

export { ShopifyError };
export { isPreviewMode } from "./config";

/**
 * Carrega dados da loja sem deixar a Shopify derrubar o site.
 *
 * Devolve `null` (a página mostra "loja indisponível") em dois casos:
 *  - loja sem token configurado, que é o estado de antes do lançamento;
 *  - qualquer falha da Shopify DURANTE O BUILD: um soluço da Shopify na hora do
 *    deploy não pode quebrar o build do site inteiro. A página nasce
 *    indisponível e se conserta sozinha na próxima revalidação.
 * Em tempo de execução, falha passageira é relançada de propósito: na
 * revalidação o Next continua servindo a última versão boa, e numa página
 * ainda sem cache quem responde é o error.tsx.
 */
export async function loadStore<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (error instanceof ShopifyError && (error.kind === "config" || building)) {
      console.error("[loja] Shopify indisponível:", error.message);
      return null;
    }
    throw error;
  }
}
export { HANDLES, ROUTES } from "./handles";
export type * from "./types";

/**
 * API da loja para as telas. Tudo aqui devolve tipo de domínio; nenhuma tela
 * monta query nem conhece o formato da Storefront API.
 */

// ── Produto ─────────────────────────────────────────────────────────────────

export async function getProduct(handle: string): Promise<Product | null> {
  if (isPreviewMode()) return preview.previewProduct(handle);
  const data = await storefront<{ product: RawProductDetail | null }>(PRODUCT_QUERY, {
    variables: { handle },
    revalidate: REVALIDATE.product,
    tags: [TAGS.catalog, TAGS.product(handle)],
  });
  return data.product ? toProduct(data.product) : null;
}

/**
 * COMPLEMENTARY = "Complete the uniform" (o que usar junto);
 * RELATED = "You may also like" (parecidos). Quem decide é a Shopify.
 */
export async function getRecommendations(
  product: Pick<Product, "id" | "handle">,
  intent: "RELATED" | "COMPLEMENTARY",
): Promise<ProductSummary[]> {
  if (isPreviewMode()) return preview.previewRecommendations(product.handle, intent);
  const data = await storefront<{ productRecommendations: RawProductSummary[] | null }>(RECOMMENDATIONS_QUERY, {
    variables: { productId: product.id, intent },
    tags: [TAGS.catalog],
  });
  return (data.productRecommendations ?? []).map(toProductSummary);
}

// ── Coleções e drops ────────────────────────────────────────────────────────

export async function getDrops(): Promise<Drop[]> {
  if (isPreviewMode()) return preview.previewDrops();
  const data = await storefront<{ metaobjects: { nodes: RawDrop[] } }>(DROPS_QUERY, {
    tags: [TAGS.content],
  });
  return data.metaobjects.nodes.map(toDrop).filter((d): d is Drop => d !== null);
}

/** O drop em cartaz: o `ativo` de lançamento mais recente. */
export async function getCurrentDrop(): Promise<Drop | null> {
  const drops = await getDrops();
  return (
    drops
      .filter((d) => d.state === "ativo")
      .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))[0] ?? null
  );
}

export async function getCollection(handle: string): Promise<Collection | null> {
  if (isPreviewMode()) return preview.previewCollection(handle);
  const [data, drops] = await Promise.all([
    storefront<{
      collection: {
        handle: string;
        title: string;
        description: string;
        image: Parameters<typeof toImage>[0];
        products: { nodes: RawProductSummary[] };
      } | null;
    }>(COLLECTION_QUERY, {
      variables: { handle, first: 100 },
      tags: [TAGS.catalog, TAGS.collection(handle)],
    }),
    getDrops(),
  ]);
  const c = data.collection;
  if (!c) return null;
  return {
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: toImage(c.image),
    products: c.products.nodes.map(toProductSummary),
    drop: drops.find((d) => d.collectionHandle === c.handle) ?? null,
  };
}

export async function getCategories(): Promise<CategoryLink[]> {
  if (isPreviewMode()) return preview.previewCategories();
  type RawItem = {
    title: string;
    resource: {
      handle?: string;
      image?: Parameters<typeof toImage>[0];
      products?: { nodes: { id: string; featuredImage: Parameters<typeof toImage>[0] }[] };
    } | null;
  };
  const data = await storefront<{ menu: { items: RawItem[] } | null }>(CATEGORY_MENU_QUERY, {
    variables: { handle: HANDLES.categoryMenu },
    tags: [TAGS.catalog, TAGS.content],
  });
  const links: CategoryLink[] = [];
  for (const item of data.menu?.items ?? []) {
    const handle = item.resource?.handle;
    const products = item.resource?.products?.nodes ?? [];
    // categoria vazia não aparece: a home não promete o que a loja não tem
    if (!handle || products.length === 0) continue;
    links.push({
      handle,
      title: item.title,
      count: products.length,
      image: toImage(item.resource?.image) ?? toImage(products[0]?.featuredImage),
    });
  }
  return links;
}

// ── Home ────────────────────────────────────────────────────────────────────

const local = (url: string, width: number, height: number, altText: string): ShopImage => ({
  url,
  width,
  height,
  altText,
});

/**
 * Conteúdo padrão da home. Vale enquanto o metaobjeto `somma_home` não existe
 * ou tem campo vazio; cada campo preenchido na Shopify substitui o seu par
 * daqui, sem deploy. As frases estão em docs/loja/COPY_SUGESTOES.md.
 */
const HOME_DEFAULTS: HomeContent = {
  hero: {
    headline: ["Running culture.", "Born in 061."],
    ctaLabel: "Shop the drop",
  },
  manifesto: ["We run.", "But that's not", "really the point."],
  club: {
    headline: ["These clothes", "come from", "somewhere."],
    text: "Todo sábado, às 7h, o clube se encontra no Estacionamento 10 do Parque da Cidade. É gratuito e aberto a todos os níveis. As roupas nascem ali.",
    image: local("/loja/img/clube-eixao.jpg", 1066, 1600, "Corredoras e corredores do SOMMA lado a lado no asfalto molhado do Eixão"),
  },
  newsletter: {
    headline: ["Before", "everyone else."],
    text: "Drop access. Club stories. No spam.",
  },
  announcement: null,
};

type RawHome = {
  heroHeadline: { value: string | null } | null;
  heroCtaLabel: { value: string | null } | null;
  manifesto: { value: string | null } | null;
  clubHeadline: { value: string | null } | null;
  clubText: { value: string | null } | null;
  clubMedia: { references: { nodes: { image?: Parameters<typeof toImage>[0] }[] } | null } | null;
  announcement: { value: string | null } | null;
  newsletterHeadline: { value: string | null } | null;
  newsletterText: { value: string | null } | null;
  lookbook: {
    reference: {
      title?: { value: string | null } | null;
      subtitle?: { value: string | null } | null;
      images?: { references: { nodes: { image?: Parameters<typeof toImage>[0] }[] } | null } | null;
      products?: { references: { nodes: RawProductSummary[] } | null } | null;
    } | null;
  } | null;
};

const orDefault = (lines: string[], fallback: string[]) => (lines.length ? lines : fallback);

export async function getHome(): Promise<{ content: HomeContent; lookbook: Lookbook | null }> {
  if (isPreviewMode()) return { content: HOME_DEFAULTS, lookbook: preview.previewLookbook() };

  const data = await storefront<{ metaobject: RawHome | null }>(HOME_QUERY, { tags: [TAGS.content] });
  const m = data.metaobject;
  if (!m) return { content: HOME_DEFAULTS, lookbook: null };

  const d = HOME_DEFAULTS;
  const content: HomeContent = {
    hero: {
      headline: orDefault(toLines(m.heroHeadline?.value), d.hero.headline),
      ctaLabel: m.heroCtaLabel?.value || d.hero.ctaLabel,
    },
    manifesto: orDefault(toLines(m.manifesto?.value), d.manifesto),
    club: {
      headline: orDefault(toLines(m.clubHeadline?.value), d.club.headline),
      text: m.clubText?.value || d.club.text,
      image: toImage(m.clubMedia?.references?.nodes[0]?.image) ?? d.club.image,
    },
    newsletter: {
      headline: orDefault(toLines(m.newsletterHeadline?.value), d.newsletter.headline),
      text: m.newsletterText?.value || d.newsletter.text,
    },
    announcement: m.announcement?.value || null,
  };

  const lb = m.lookbook?.reference;
  const images = (lb?.images?.references?.nodes ?? [])
    .map((n) => toImage(n.image))
    .filter((i): i is ShopImage => i !== null);
  const lookbook: Lookbook | null =
    lb && images.length >= 3
      ? {
          title: lb.title?.value || "Lookbook",
          subtitle: lb.subtitle?.value ?? null,
          images,
          products: (lb.products?.references?.nodes ?? []).filter((p) => p?.handle).map(toProductSummary),
        }
      : null;

  return { content, lookbook };
}

// ── Busca ───────────────────────────────────────────────────────────────────

export async function searchCatalog(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return { products: [], collections: [], suggestions: [] };
  if (isPreviewMode()) return preview.previewSearch(q);
  const data = await storefront<{
    predictiveSearch: {
      products: RawProductSummary[];
      collections: { handle: string; title: string }[];
      queries: { text: string }[];
    } | null;
  }>(PREDICTIVE_SEARCH_QUERY, { variables: { query: q }, revalidate: false });
  const r = data.predictiveSearch;
  return {
    products: (r?.products ?? []).map(toProductSummary),
    collections: r?.collections ?? [],
    suggestions: (r?.queries ?? []).map((s) => s.text),
  };
}

// ── Carrinho ────────────────────────────────────────────────────────────────

export type CartLineInput = { variantId: string; quantity: number };

type CartPayload = { cart: RawCart | null; userErrors: { field: string[] | null; message: string }[] };

function unwrap(payload: CartPayload): Cart {
  if (payload.userErrors.length || !payload.cart) {
    throw new CartUserError(payload.userErrors[0]?.message ?? "Carrinho indisponível.");
  }
  return toCart(payload.cart);
}

/** Erro que a Shopify devolve como `userErrors` (estoque, variante inválida). */
export class CartUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartUserError";
  }
}

export async function getCart(id: string): Promise<Cart | null> {
  if (isPreviewMode()) return preview.previewCartGet(id);
  const data = await storefront<{ cart: RawCart | null }>(CART_QUERY, { variables: { id }, revalidate: false });
  return data.cart ? toCart(data.cart) : null;
}

export async function addToCart(cartId: string | null, lines: CartLineInput[], buyerIp: string | null): Promise<Cart> {
  if (isPreviewMode()) {
    return preview.previewCartMutate(cartId, (state) => {
      for (const line of lines) {
        const existing = state.lines.find((l) => l.variantId === line.variantId);
        if (existing) existing.quantity += line.quantity;
        else state.lines.push({ id: `linha-${line.variantId.split("/").pop()}`, ...line });
      }
    });
  }
  const input = lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity }));
  if (!cartId) {
    const data = await storefront<{ cartCreate: CartPayload }>(CART_CREATE_MUTATION, {
      variables: { lines: input },
      revalidate: false,
      buyerIp,
    });
    return unwrap(data.cartCreate);
  }
  const data = await storefront<{ cartLinesAdd: CartPayload }>(CART_LINES_ADD_MUTATION, {
    variables: { cartId, lines: input },
    revalidate: false,
    buyerIp,
  });
  return unwrap(data.cartLinesAdd);
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number, buyerIp: string | null): Promise<Cart> {
  if (isPreviewMode()) {
    return preview.previewCartMutate(cartId, (state) => {
      const line = state.lines.find((l) => l.id === lineId);
      if (line) line.quantity = quantity;
    });
  }
  if (quantity <= 0) {
    const data = await storefront<{ cartLinesRemove: CartPayload }>(CART_LINES_REMOVE_MUTATION, {
      variables: { cartId, lineIds: [lineId] },
      revalidate: false,
      buyerIp,
    });
    return unwrap(data.cartLinesRemove);
  }
  const data = await storefront<{ cartLinesUpdate: CartPayload }>(CART_LINES_UPDATE_MUTATION, {
    variables: { cartId, lines: [{ id: lineId, quantity }] },
    revalidate: false,
    buyerIp,
  });
  return unwrap(data.cartLinesUpdate);
}

export async function setCartDiscountCodes(cartId: string, codes: string[], buyerIp: string | null): Promise<Cart> {
  if (isPreviewMode()) {
    return preview.previewCartMutate(cartId, (state) => {
      state.discountCodes = codes;
    });
  }
  const data = await storefront<{ cartDiscountCodesUpdate: CartPayload }>(CART_DISCOUNT_CODES_UPDATE_MUTATION, {
    variables: { cartId, discountCodes: codes },
    revalidate: false,
    buyerIp,
  });
  return unwrap(data.cartDiscountCodesUpdate);
}
