/**
 * Prévia local do catálogo da loja (/loja) — SÓ para desenvolvimento.
 *
 * A loja lê tudo da Storefront API. Enquanto os tokens do canal Headless não
 * existem (ou os produtos ainda estão em rascunho), não há o que a Storefront
 * devolver. Este script tira uma foto do catálogo REAL pela Admin API (apenas
 * queries) e grava em `.loja-preview/catalog.json`, que fica fora do git e só é
 * lido com `next dev` sem token configurado (ver lib/shopify/preview.ts).
 *
 * Não é um catálogo local: nada disto vai para produção, e o arquivo deixa de
 * ser lido no instante em que SHOPIFY_STOREFRONT_PRIVATE_TOKEN existe.
 *
 * A curadoria (o que é drop, o que é arquivo, nomes limpos) vem de
 * scripts/loja-curadoria.mjs e é a PROPOSTA de organização do catálogo. Quem a
 * grava na Shopify de verdade é scripts/loja-shopify-catalogo.mjs.
 *
 * Uso:
 *   SHOPIFY_ADMIN_TOKEN=shpat_... SHOPIFY_STORE_DOMAIN=xxx.myshopify.com \
 *     node scripts/loja-preview-snapshot.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { COLECOES, COR, CURADORIA, DROP } from "./loja-curadoria.mjs";

const token = process.env.SHOPIFY_ADMIN_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-01";
if (!token || !domain) {
  console.error("Defina SHOPIFY_ADMIN_TOKEN e SHOPIFY_STORE_DOMAIN.");
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 600));
  return json.data;
}

const QUERY = `query($id: ID!) {
  product(id: $id) {
    id title handle descriptionHtml productType tags createdAt
    options { name values }
    variants(first: 30) {
      nodes { id title price compareAtPrice availableForSale inventoryQuantity selectedOptions { name value } }
    }
    media(first: 12) {
      nodes { id mediaContentType ... on MediaImage { image { url width height altText } } }
    }
  }
}`;

const money = (v) => (v == null ? null : { amount: Number(v), currencyCode: "BRL" });
const texto = (html) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const products = [];
for (const [ordem, item] of CURADORIA.entries()) {
  const { product: p } = await gql(QUERY, { id: `gid://shopify/Product/${item.id}` });
  if (!p) {
    console.warn(`não encontrado: ${item.titulo} (${item.id})`);
    continue;
  }
  const media = p.media.nodes.filter((m) => m.image);
  // `capa`: a foto que abre a peça vai para a frente
  const capa = item.capa ? media.findIndex((m) => m.id.endsWith(`/${item.capa}`)) : -1;
  if (capa > 0) media.unshift(...media.splice(capa, 1));
  const images = media.map((m) => ({ url: m.image.url, altText: m.image.altText ?? null, width: m.image.width, height: m.image.height }));

  const variants = p.variants.nodes.map((v) => ({
    id: v.id,
    title: v.title === "Default Title" ? "Único" : v.title,
    availableForSale: v.availableForSale,
    quantityAvailable: v.inventoryQuantity,
    price: money(v.price),
    compareAtPrice: v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price) ? money(v.compareAtPrice) : null,
    selectedOptions: v.selectedOptions,
  }));
  const menor = variants.reduce((a, b) => (b.price.amount < a.price.amount ? b : a), variants[0]);

  products.push({
    id: p.id,
    handle: item.handle,
    title: item.titulo,
    description: texto(p.descriptionHtml),
    descriptionHtml: p.descriptionHtml ?? "",
    productType: p.productType ?? "",
    tags: p.tags,
    createdAt: p.createdAt,
    availableForSale: variants.some((v) => v.availableForSale),
    price: menor.price,
    compareAtPrice: menor.compareAtPrice,
    images,
    options: p.options.filter((o) => !(o.name === "Title" && o.values.length === 1)),
    variants,
    badge: item.selo ?? null,
    keepInArchive: item.grupo === "archive",
    color: COR[item.cor] ?? null,
    // campos de curadoria usados só para montar as coleções da prévia
    _grupo: item.grupo,
    _categoria: item.categoria ?? null,
    _familia: item.familia ?? null,
    _ordem: ordem,
    _id: item.id,
  });
}

// irmãs de cor: mesma família, outro handle
for (const p of products) {
  p.colorSiblings = p._familia
    ? products
        .filter((o) => o._familia === p._familia)
        .map((o) => ({ handle: o.handle, title: o.title, color: o.color, image: o.images[0] ?? null, current: o.handle === p.handle }))
    : [];
}

const { foto: _foto, ...drop } = DROP;
for (const p of products) p.drop = p._grupo === "drop" ? { handle: DROP.handle, code: DROP.code, title: DROP.title } : null;

const handleDe = new Map(products.map((p) => [p._id, p.handle]));
const collections = COLECOES.map((c) => ({
  handle: c.handle,
  title: c.title,
  description: c.description,
  productHandles: c.produtos.map((id) => handleDe.get(id)).filter(Boolean),
}));

const out = {
  generatedAt: new Date().toISOString(),
  source: domain,
  products: products.map(({ _grupo, _categoria, _familia, _ordem, _id, ...p }) => p),
  collections,
  drops: [drop],
};

mkdirSync(".loja-preview", { recursive: true });
writeFileSync(".loja-preview/catalog.json", JSON.stringify(out, null, 1));
console.log(`prévia gravada: ${out.products.length} produtos, ${collections.length} coleções`);
for (const c of collections) console.log(`  ${c.handle}: ${c.productHandles.length}`);
