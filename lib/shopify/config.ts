import "server-only";

/**
 * Configuração da Storefront API.
 *
 * Tudo vem de variável de ambiente e este é o único arquivo que lê
 * `process.env` para a Shopify: a versão da API e o domínio nunca aparecem
 * soltos pelo código. O token privado só existe no servidor (o `server-only`
 * acima quebra o build se alguém importar isto num Client Component).
 */
export const SHOPIFY = {
  domain: process.env.SHOPIFY_STORE_DOMAIN ?? "",
  apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07",
  privateToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ?? "",
} as const;

export function isStorefrontConfigured(): boolean {
  return Boolean(SHOPIFY.domain && SHOPIFY.privateToken);
}

/**
 * Prévia local: `next dev` sem token lê a foto do catálogo gravada por
 * `scripts/loja-preview-snapshot.mjs`. Em produção isto é sempre falso, então
 * loja sem token mostra o estado de erro, nunca dado de prévia.
 */
export function isPreviewMode(): boolean {
  return process.env.NODE_ENV !== "production" && !isStorefrontConfigured();
}

/** Tempos de cache (segundos). A estratégia está em docs/loja/STORE_ARCHITECTURE.md. */
export const REVALIDATE = {
  /** Home, coleções, drops, conteúdo editorial. */
  catalog: 300,
  /** Página de produto: estoque muda mais rápido que o resto. */
  product: 60,
} as const;

export const TAGS = {
  catalog: "loja:catalogo",
  product: (handle: string) => `loja:produto:${handle}`,
  collection: (handle: string) => `loja:colecao:${handle}`,
  content: "loja:conteudo",
} as const;
