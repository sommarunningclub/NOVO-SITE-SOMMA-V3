import "server-only";
import { SHOPIFY, isStorefrontConfigured, REVALIDATE } from "./config";

/**
 * Erro da camada Shopify. As telas não mostram `message` ao visitante: usam
 * `kind` para escolher o estado de erro (ver app/loja/error.tsx).
 */
export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "http" | "graphql",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

type StorefrontOptions = {
  variables?: Record<string, unknown>;
  /** Segundos de cache; `false` desliga (carrinho e busca nunca usam cache). */
  revalidate?: number | false;
  tags?: string[];
  /**
   * IP de quem está comprando. A Shopify pede esse header nas chamadas feitas
   * do servidor com token privado, para a proteção contra bots do carrinho
   * enxergar o comprador e não o IP da Vercel.
   */
  buyerIp?: string | null;
};

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] };

export async function storefront<T>(query: string, options: StorefrontOptions = {}): Promise<T> {
  if (!isStorefrontConfigured()) {
    throw new ShopifyError("Storefront API sem domínio ou token configurado.", "config");
  }

  const { variables, revalidate = REVALIDATE.catalog, tags, buyerIp } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Shopify-Storefront-Private-Token": SHOPIFY.privateToken,
  };
  if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;

  let res: Response;
  try {
    res = await fetch(`https://${SHOPIFY.domain}/api/${SHOPIFY.apiVersion}/graphql.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate, tags } }),
    });
  } catch {
    throw new ShopifyError("Não foi possível falar com a Shopify.", "http");
  }

  if (!res.ok) throw new ShopifyError(`Storefront API respondeu ${res.status}.`, "http", res.status);

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new ShopifyError(json.errors.map((e) => e.message).join("; "), "graphql");
  }
  if (!json.data) throw new ShopifyError("Storefront API respondeu sem dados.", "graphql");
  return json.data;
}
