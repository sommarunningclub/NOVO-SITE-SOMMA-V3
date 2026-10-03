/**
 * Valida as queries da loja contra o schema REAL da Storefront API.
 *
 * Usa o endpoint sem token, que já basta para o GraphQL acusar campo que não
 * existe ou argumento errado (acesso negado a metaobjeto é esperado sem token
 * e não conta como erro). Rode ao trocar SHOPIFY_STOREFRONT_API_VERSION ou ao
 * mexer em lib/shopify/queries, fragments ou mutations.
 *
 * Uso: SHOPIFY_STORE_DOMAIN=xxx.myshopify.com npx tsx scripts/loja-valida-queries.mts
 */
import * as cartM from "../lib/shopify/mutations/cart";
import * as cartQ from "../lib/shopify/queries/cart";
import * as catalog from "../lib/shopify/queries/catalog";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";
if (!domain) {
  console.error("Defina SHOPIFY_STORE_DOMAIN.");
  process.exit(1);
}

const cart = "gid://shopify/Cart/inexistente";
const variant = "gid://shopify/ProductVariant/1";
const line = "gid://shopify/CartLine/1";

const cases: [string, string, Record<string, unknown>][] = [
  ["PRODUCT_QUERY", catalog.PRODUCT_QUERY, { handle: "x" }],
  ["RECOMMENDATIONS_QUERY", catalog.RECOMMENDATIONS_QUERY, { productId: "gid://shopify/Product/1", intent: "RELATED" }],
  ["COLLECTION_QUERY", catalog.COLLECTION_QUERY, { handle: "x", first: 5 }],
  ["CATEGORY_MENU_QUERY", catalog.CATEGORY_MENU_QUERY, { handle: "x" }],
  ["DROPS_QUERY", catalog.DROPS_QUERY, {}],
  ["HOME_QUERY", catalog.HOME_QUERY, {}],
  ["PREDICTIVE_SEARCH_QUERY", catalog.PREDICTIVE_SEARCH_QUERY, { query: "regata" }],
  ["CART_QUERY", cartQ.CART_QUERY, { id: cart }],
  ["CART_LINES_ADD_MUTATION", cartM.CART_LINES_ADD_MUTATION, { cartId: cart, lines: [{ merchandiseId: variant, quantity: 1 }] }],
  ["CART_LINES_UPDATE_MUTATION", cartM.CART_LINES_UPDATE_MUTATION, { cartId: cart, lines: [{ id: line, quantity: 1 }] }],
  ["CART_LINES_REMOVE_MUTATION", cartM.CART_LINES_REMOVE_MUTATION, { cartId: cart, lineIds: [line] }],
  ["CART_DISCOUNT_CODES_UPDATE_MUTATION", cartM.CART_DISCOUNT_CODES_UPDATE_MUTATION, { cartId: cart, discountCodes: ["X"] }],
];

let failed = 0;
for (const [name, query, variables] of cases) {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { errors?: { message: string; extensions?: { code?: string } }[] };
  const schema = (json.errors ?? []).filter((e) => e.extensions?.code !== "ACCESS_DENIED");
  if (schema.length) failed++;
  console.log(`${schema.length ? "ERRO" : "ok  "} ${name}${schema.length ? ` → ${schema.map((e) => e.message).join(" | ")}` : ""}`);
}
// CART_CREATE_MUTATION fica de fora de propósito: ela CRIARIA um carrinho de verdade.
console.log(failed ? `\n${failed} query(s) com erro de schema (versão ${version}).` : `\ntudo válido na versão ${version}.`);
process.exit(failed ? 1 : 0);
