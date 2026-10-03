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
 * A curadoria abaixo (o que é drop, o que é arquivo, nomes limpos) é a
 * PROPOSTA de organização do catálogo; na loja de verdade ela vem das coleções
 * e dos metaobjetos da Shopify.
 *
 * Uso:
 *   SHOPIFY_ADMIN_TOKEN=shpat_... SHOPIFY_STORE_DOMAIN=xxx.myshopify.com \
 *     node scripts/loja-preview-snapshot.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";

const token = process.env.SHOPIFY_ADMIN_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-01";
if (!token || !domain) {
  console.error("Defina SHOPIFY_ADMIN_TOKEN e SHOPIFY_STORE_DOMAIN.");
  process.exit(1);
}

const COR = {
  laranja: { name: "Laranja", hex: "#FF4800" },
  preto: { name: "Preto", hex: "#141414" },
  branco: { name: "Branco", hex: "#FFFFFF" },
};

/**
 * handle na Shopify → como a peça entra na loja.
 * `grupo`: drop (linha 2026), core (segue à venda) ou archive.
 */
const CURADORIA = [
  // ── Drop 001 ────────────────────────────────────────────────────────────
  { fonte: "cropped-laranja", handle: "cropped-laranja", titulo: "Cropped Laranja", grupo: "drop", categoria: "croppeds", cor: COR.laranja, familia: "cropped-zip", selo: "NEW" },
  { fonte: "regata-masculina-branca-copia", handle: "regata-masculina-preta", titulo: "Regata Masculina Preta", grupo: "drop", categoria: "regatas", cor: COR.preto, familia: "regata-masculina" },
  { fonte: "camisa-de-treino-preta-nova", handle: "camisa-de-treino-preta", titulo: "Camisa de Treino Preta", grupo: "drop", categoria: "camisetas", capa: 1 },
  { fonte: "cropped-preto-copia", handle: "regata-feminina-preta", titulo: "Regata Feminina Preta", grupo: "drop", categoria: "regatas" },
  { fonte: "novo-bone-somma-club-2026", handle: "bone-2026", titulo: "Boné 2026", grupo: "drop", categoria: "acessorios" },
  { fonte: "cropped-feminino-branco-copia", handle: "regata-masculina-branca", titulo: "Regata Masculina Branca", grupo: "drop", categoria: "regatas", cor: COR.branco, familia: "regata-masculina" },
  { fonte: "cropped-laranja-copia", handle: "cropped-preto", titulo: "Cropped Preto", grupo: "drop", categoria: "croppeds", cor: COR.preto, familia: "cropped-zip" },
  { fonte: "regata-feminina-preta-copia", handle: "cropped-branco", titulo: "Cropped Branco", grupo: "drop", categoria: "croppeds", cor: COR.branco, familia: "cropped-zip" },
  { fonte: "novo-lenco-laranja-somma-club-copia", handle: "lenco-preto", titulo: "Lenço Preto", grupo: "drop", categoria: "acessorios", cor: COR.preto, familia: "lenco" },
  { fonte: "regata-masculina-preta-copia", handle: "lenco-laranja", titulo: "Lenço Laranja", grupo: "drop", categoria: "acessorios", cor: COR.laranja, familia: "lenco" },
  // ── Seguem à venda ──────────────────────────────────────────────────────
  { fonte: "regata-somma-fire-pack", handle: "regata-machao-fire-pack", titulo: "Regata Machão Fire Pack", grupo: "core", categoria: "regatas", capa: 1 },
  { fonte: "cropped-somma-laranja-v2", handle: "cropped-somma-laranja", titulo: "Cropped Somma Laranja", grupo: "core", categoria: "croppeds", capa: 3 },
  // ── Archive ─────────────────────────────────────────────────────────────
  { fonte: "cropped-rosa-8-de-marco-edicao-especial", handle: "cropped-rosa-8-de-marco", titulo: "Cropped Rosa 8 de Março", grupo: "archive", capa: 2 },
  { fonte: "cropped-somma-preto-v2", handle: "regata-somma-preto", titulo: "Regata Somma Preto", grupo: "archive", capa: 1 },
  { fonte: "camisa-de-treino-preta-pedido", handle: "camisa-de-treino-running-club", titulo: "Camisa de Treino Running Club", grupo: "archive", capa: 1 },
  { fonte: "bone-5panel-classico", handle: "bone-5panel-classico", titulo: "Boné 5panel Clássico", grupo: "archive" },
  { fonte: "moletom-preto-somma-club", handle: "moletom-preto", titulo: "Moletom Preto", grupo: "archive", capa: 2 },
  { fonte: "t-shirt-somma-machao-black", handle: "regata-machao", titulo: "Regata Machão", grupo: "archive", capa: 3 },
  { fonte: "camiseta-regata-softcore", handle: "regata-softcore", titulo: "Regata Softcore", grupo: "archive", capa: 1 },
  { fonte: "regata-machao-white-2026", handle: "regata-machao-white", titulo: "Regata Machão White", grupo: "archive", capa: 4 },
  { fonte: "t-shirt-somma-bone-white", handle: "camiseta-oversized-off-white", titulo: "Camiseta Oversized Off-White", grupo: "archive", capa: 1 },
  { fonte: "regata-somma-steck-black", handle: "regata-preta-performance", titulo: "Regata Preta Performance", grupo: "archive" },
  { fonte: "regata-machao-white-2026-copia", handle: "moletom-lifestyle-branco", titulo: "Moletom Lifestyle Branco", grupo: "archive" },
  { fonte: "t-shirt-somma-blode-orange", handle: "camisa-de-treino-laranja", titulo: "Camisa de Treino Laranja", grupo: "archive", capa: 1 },
  { fonte: "lenco-somma-club-pedido", handle: "lenco-somma-club", titulo: "Lenço Somma Club", grupo: "archive", capa: 1 },
  { fonte: "cropped-preta-performance", handle: "cropped-preto-performance", titulo: "Cropped Preto Performance", grupo: "archive" },
  { fonte: "cropped-suplex-branco", handle: "cropped-suplex-branco", titulo: "Cropped Suplex Branco", grupo: "archive" },
  { fonte: "top-oversized-off-white", handle: "cropped-oversized-off-white", titulo: "Cropped Oversized Off-White", grupo: "archive", capa: 1 },
  { fonte: "regata-de-treino-maratona-rio-2026", handle: "regata-maratona-rio-2026", titulo: "Regata Maratona Rio 2026", grupo: "archive" },
  { fonte: "cropped-feminino-maratona-rio-2026", handle: "cropped-maratona-rio-2026", titulo: "Cropped Maratona Rio 2026", grupo: "archive", capa: 1 },
  { fonte: "camisa", handle: "camiseta-maratona-rio-2026", titulo: "Camiseta Maratona Rio 2026", grupo: "archive" },
];

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

const QUERY = `query($handle: String!) {
  productByHandle(handle: $handle) {
    id title handle descriptionHtml productType tags createdAt
    options { name values }
    variants(first: 30) {
      nodes { id title price compareAtPrice availableForSale inventoryQuantity selectedOptions { name value } }
    }
    media(first: 12) {
      nodes { mediaContentType ... on MediaImage { image { url width height altText } } }
    }
  }
}`;

const money = (v) => (v == null ? null : { amount: Number(v), currencyCode: "BRL" });
const texto = (html) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const products = [];
for (const [ordem, item] of CURADORIA.entries()) {
  const { productByHandle: p } = await gql(QUERY, { handle: item.fonte });
  if (!p) {
    console.warn(`não encontrado: ${item.fonte}`);
    continue;
  }
  const images = p.media.nodes
    .filter((m) => m.image)
    .map((m) => ({ url: m.image.url, altText: m.image.altText ?? null, width: m.image.width, height: m.image.height }));
  // `capa`: índice da foto que abre a peça (a 1ª da Shopify nem sempre é a melhor)
  if (item.capa && images[item.capa]) images.unshift(...images.splice(item.capa, 1));

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
    color: item.cor ?? null,
    // campos de curadoria usados só para montar as coleções da prévia
    _grupo: item.grupo,
    _categoria: item.categoria ?? null,
    _familia: item.familia ?? null,
    _ordem: ordem,
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

const handles = (fn) => products.filter(fn).map((p) => p.handle);
const DROP = {
  handle: "drop-001",
  code: "001",
  title: "The Saturday Uniform",
  tagline: "Drop 001",
  description:
    "A linha 2026 do clube: regatas, croppeds, camisa de treino, boné e lenço. Feita para o sábado de manhã e para tudo o que vem depois dele.",
  releaseDate: "2026-07-18",
  state: "ativo",
  collectionHandle: "drop-001",
};
for (const p of products) p.drop = p._grupo === "drop" ? { handle: DROP.handle, code: DROP.code, title: DROP.title } : null;

const collections = [
  { handle: "drop-001", title: "The Saturday Uniform", description: DROP.description, productHandles: handles((p) => p._grupo === "drop") },
  { handle: "todos", title: "Todos os produtos", description: "", productHandles: handles((p) => p._grupo !== "archive") },
  { handle: "regatas", title: "Regatas", description: "", productHandles: handles((p) => p._categoria === "regatas") },
  { handle: "croppeds", title: "Croppeds", description: "", productHandles: handles((p) => p._categoria === "croppeds") },
  { handle: "camisetas", title: "Camisetas", description: "", productHandles: handles((p) => p._categoria === "camisetas") },
  { handle: "acessorios", title: "Acessórios", description: "", productHandles: handles((p) => p._categoria === "acessorios") },
  { handle: "archive", title: "Archive", description: "", productHandles: handles((p) => p._grupo === "archive") },
];

const out = {
  generatedAt: new Date().toISOString(),
  source: domain,
  products: products.map(({ _grupo, _categoria, _familia, _ordem, ...p }) => p),
  collections,
  drops: [DROP],
};

mkdirSync(".loja-preview", { recursive: true });
writeFileSync(".loja-preview/catalog.json", JSON.stringify(out, null, 1));
console.log(`prévia gravada: ${out.products.length} produtos, ${collections.length} coleções`);
for (const c of collections) console.log(`  ${c.handle}: ${c.productHandles.length}`);
