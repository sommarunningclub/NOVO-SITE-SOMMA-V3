/**
 * Organiza o catálogo na Shopify do jeito que a loja (/loja) lê.
 *
 * A organização (o que é drop, o que segue à venda, o que é arquivo, nomes)
 * vem de scripts/loja-curadoria.mjs, a mesma lista da prévia local.
 *
 * Em dois passos, de propósito:
 *
 *  1. Sem bandeira extra, SÓ ACRESCENTA: as coleções da loja, o menu de
 *     categorias, o lookbook, o drop, a home e os campos `somma.*` e a cor das
 *     peças. Nada que já existe muda. As coleções saem publicadas apenas no
 *     canal Headless, e nada aparece para cliente enquanto as peças estiverem
 *     em rascunho.
 *
 *  2. O que MEXE em produto que já existe só roda com bandeira própria:
 *       --renomear   nome e endereço (handle) das peças, com redirecionamento
 *       --capas      a foto que abre cada peça
 *       --ativar     tira do rascunho e publica só no canal Headless
 *
 * Pode rodar de novo quantas vezes for preciso: o que já está certo é pulado.
 * Sem --apply só mostra o plano.
 *
 * Uso:
 *   SHOPIFY_ADMIN_TOKEN=shpat_... SHOPIFY_STORE_DOMAIN=xxx.myshopify.com \
 *     node scripts/loja-shopify-catalogo.mjs [--apply] [--renomear] [--capas] [--ativar]
 */
import { COLECOES, CURADORIA, DROP, LOOKBOOK, MENU } from "./loja-curadoria.mjs";

const token = process.env.SHOPIFY_ADMIN_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-01";
const flags = new Set(process.argv.slice(2));
const APPLY = flags.has("--apply");
const RENOMEAR = flags.has("--renomear");
const CAPAS = flags.has("--capas");
const ATIVAR = flags.has("--ativar");
if (!token || !domain) {
  console.error("Defina SHOPIFY_ADMIN_TOKEN e SHOPIFY_STORE_DOMAIN.");
  process.exit(1);
}

const gid = (type, id) => `gid://shopify/${type}/${id}`;
const numero = (id) => Number(id.split("/").pop());

async function gql(query, variables) {
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 800));
  return json.data;
}

function check(payload, what, key = "userErrors") {
  const errors = payload?.[key] ?? [];
  if (errors.length) throw new Error(`${what}: ${errors.map((e) => `${(e.field ?? []).join(".")} ${e.message}`).join("; ")}`);
}

let feitos = 0;
let pendentes = 0;
/** Mostra o passo e, com --apply, executa. Devolve o resultado (ou `null` no plano). */
async function passo(texto, run) {
  console.log(`  + ${texto}`);
  if (!APPLY) {
    pendentes++;
    return null;
  }
  const result = await run();
  feitos++;
  return result;
}

// ── Estado atual ───────────────────────────────────────────────────────────

const base = await gql(`{
  publications(first: 30) { nodes { id name } }
  menus(first: 50) { nodes { id handle } }
  cores: metaobjects(type: "shopify--color-pattern", first: 50) { nodes { id handle } }
}`);
const headless = base.publications.nodes.filter((p) => /headless/i.test(p.name));
if (headless.length !== 1) {
  throw new Error(`esperava um canal Headless e achei ${headless.length}: ${base.publications.nodes.map((p) => p.name).join(", ")}`);
}
const CANAL = headless[0];
const cores = new Map(base.cores.nodes.map((c) => [c.handle, c.id]));

const PRODUTO = `
  id title handle status
  noCanal: publishedOnPublication(publicationId: $canal)
  media(first: 1) { nodes { id } }
  variants(first: 50) { nodes { title inventoryQuantity inventoryPolicy inventoryItem { tracked } } }
  drop: metafield(namespace: "somma", key: "drop") { value }
  badge: metafield(namespace: "somma", key: "badge") { value }
  keep: metafield(namespace: "somma", key: "keep_in_archive") { value }
  siblings: metafield(namespace: "somma", key: "color_siblings") { value }
  cor: metafield(namespace: "shopify", key: "color-pattern") { value }
`;
const lidos = await gql(`query($ids: [ID!]!, $canal: ID!) { nodes(ids: $ids) { ... on Product { ${PRODUTO} } } }`, {
  ids: CURADORIA.map((p) => gid("Product", p.id)),
  canal: CANAL.id,
});
const produtos = new Map();
for (const [i, node] of lidos.nodes.entries()) {
  if (!node?.id) throw new Error(`peça da curadoria não existe mais na Shopify: ${CURADORIA[i].titulo} (${CURADORIA[i].id})`);
  produtos.set(CURADORIA[i].id, node);
}

console.log(`${APPLY ? "APLICANDO na loja" : "PLANO (nada é alterado sem --apply)"} · ${domain} · canal "${CANAL.name.replace(/\s+/g, " ")}"`);

// ── 1. Coleções ────────────────────────────────────────────────────────────

console.log("\nColeções");
const colecoes = new Map();
for (const c of COLECOES) {
  const wanted = c.produtos.map((id) => gid("Product", id));
  const { collectionByHandle: atual } = await gql(
    `query($handle: String!, $canal: ID!) {
      collectionByHandle(handle: $handle) { id noCanal: publishedOnPublication(publicationId: $canal) products(first: 250) { nodes { id } } }
    }`,
    { handle: c.handle, canal: CANAL.id },
  );
  let id = atual?.id ?? null;
  let noCanal = atual?.noCanal ?? false;

  if (!atual) {
    const made = await passo(`criar coleção "${c.title}" (${c.handle}) com ${wanted.length} peças`, async () => {
      const data = await gql(
        `mutation($input: CollectionInput!) {
          collectionCreate(input: $input) { collection { id handle } userErrors { field message } }
        }`,
        { input: { title: c.title, handle: c.handle, descriptionHtml: c.description ? `<p>${c.description}</p>` : "", sortOrder: "MANUAL", products: wanted } },
      );
      check(data.collectionCreate, `coleção ${c.handle}`);
      const created = data.collectionCreate.collection;
      if (created.handle !== c.handle) throw new Error(`a Shopify trocou o endereço da coleção: pedi ${c.handle}, veio ${created.handle}`);
      return created;
    });
    id = made?.id ?? null;
  } else {
    const have = new Set(atual.products.nodes.map((p) => p.id));
    const missing = wanted.filter((p) => !have.has(p));
    if (missing.length) {
      await passo(`coleção ${c.handle}: acrescentar ${missing.length} peça(s)`, async () => {
        const data = await gql(
          `mutation($id: ID!, $productIds: [ID!]!) {
            collectionAddProducts(id: $id, productIds: $productIds) { collection { id } userErrors { field message } }
          }`,
          { id: atual.id, productIds: missing },
        );
        check(data.collectionAddProducts, `coleção ${c.handle}`);
      });
    } else {
      console.log(`  = coleção ${c.handle} já existe, com as ${wanted.length} peças`);
    }
  }

  if (!noCanal) {
    await passo(`publicar coleção ${c.handle} no canal Headless`, async () => {
      const data = await gql(
        `mutation($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) { userErrors { field message } }
        }`,
        { id, input: [{ publicationId: CANAL.id }] },
      );
      check(data.publishablePublish, `publicar ${c.handle}`);
    });
  }
  colecoes.set(c.handle, id);
}

// ── 2. Menu de categorias ──────────────────────────────────────────────────

console.log("\nMenu");
if (base.menus.nodes.some((m) => m.handle === MENU.handle)) {
  console.log(`  = menu ${MENU.handle} já existe`);
} else {
  const items = MENU.colecoes.map((handle) => ({
    title: COLECOES.find((c) => c.handle === handle).title,
    type: "COLLECTION",
    resourceId: colecoes.get(handle),
  }));
  await passo(`criar menu "${MENU.title}" (${MENU.handle}): ${items.map((i) => i.title).join(", ")}`, async () => {
    const data = await gql(
      `mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
        menuCreate(title: $title, handle: $handle, items: $items) { menu { id handle } userErrors { field message } }
      }`,
      { title: MENU.title, handle: MENU.handle, items },
    );
    check(data.menuCreate, `menu ${MENU.handle}`);
  });
}

// ── 3. Lookbook, drop e home (metaobjetos) ─────────────────────────────────

console.log("\nConteúdo");
/** Cria a entrada se ela ainda não existe. Entrada que já existe nunca é reescrita. */
async function entrada(type, handle, descricao, fields) {
  const { metaobjectByHandle: atual } = await gql(
    `query($handle: MetaobjectHandleInput!) { metaobjectByHandle(handle: $handle) { id } }`,
    { handle: { type, handle } },
  );
  if (atual) {
    console.log(`  = ${type} "${handle}" já existe`);
    return atual.id;
  }
  const made = await passo(`criar ${type} "${handle}": ${descricao}`, async () => {
    const data = await gql(
      `mutation($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) { metaobject { id handle } userErrors { field message } }
      }`,
      {
        metaobject: {
          type,
          handle,
          capabilities: { publishable: { status: "ACTIVE" } },
          fields: Object.entries(fields())
            .filter(([, value]) => value != null)
            .map(([key, value]) => ({ key, value })),
        },
      },
    );
    check(data.metaobjectCreate, `${type} ${handle}`);
    return data.metaobjectCreate.metaobject;
  });
  return made?.id ?? null;
}

const lookbookId = await entrada("somma_lookbook", LOOKBOOK.handle, `${LOOKBOOK.fotos.length} fotos, ${LOOKBOOK.pecas.length} peças`, () => ({
  title: LOOKBOOK.title,
  subtitle: LOOKBOOK.subtitle,
  images: JSON.stringify(LOOKBOOK.fotos.map((id) => gid("MediaImage", id))),
  products: JSON.stringify(LOOKBOOK.pecas.map((id) => gid("Product", id))),
}));
const dropId = await entrada("somma_drop", DROP.handle, `"${DROP.title}", coleção ${DROP.collectionHandle}`, () => ({
  title: DROP.title,
  code: DROP.code,
  tagline: DROP.tagline,
  description: DROP.description,
  release_date: DROP.releaseDate,
  state: DROP.state,
  collection: colecoes.get(DROP.collectionHandle),
  hero_media: gid("MediaImage", DROP.foto),
}));
// Os textos da home ficam vazios de propósito: campo vazio usa o padrão do site.
await entrada("somma_home", "principal", "só o lookbook; os textos seguem o padrão do site", () => ({
  title: "Principal",
  lookbook: lookbookId,
}));

// ── 4. Campos das peças (só onde ainda está vazio) ─────────────────────────

console.log("\nCampos das peças");
const campos = [];
const falta = (rotulo, item, namespace, key, type, value) => {
  campos.push({ rotulo: `${item.titulo}: ${rotulo}`, input: { ownerId: gid("Product", item.id), namespace, key, type, value } });
};
for (const item of CURADORIA) {
  const p = produtos.get(item.id);
  if (item.grupo === "drop" && !p.drop) falta(`drop ${DROP.code}`, item, "somma", "drop", "metaobject_reference", dropId);
  if (item.selo && !p.badge) falta(`selo ${item.selo}`, item, "somma", "badge", "single_line_text_field", item.selo);
  if (item.grupo === "archive" && !p.keep) falta("fica no archive", item, "somma", "keep_in_archive", "boolean", "true");
  if (item.familia && !p.siblings) {
    const outras = CURADORIA.filter((o) => o.familia === item.familia && o.id !== item.id);
    falta(`outras cores (${outras.map((o) => o.titulo).join(", ")})`, item, "somma", "color_siblings", "list.product_reference", JSON.stringify(outras.map((o) => gid("Product", o.id))));
  }
  if (item.cor && !p.cor) {
    const cor = cores.get(item.cor);
    if (!cor) throw new Error(`a cor "${item.cor}" não existe na taxonomia da loja`);
    falta(`cor ${item.cor}`, item, "shopify", "color-pattern", "list.metaobject_reference", JSON.stringify([cor]));
  }
}
if (campos.length === 0) {
  console.log("  = tudo preenchido");
} else {
  for (const c of campos) console.log(`  + ${c.rotulo}`);
  if (APPLY) {
    for (let i = 0; i < campos.length; i += 25) {
      const data = await gql(
        `mutation($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message } }
        }`,
        { metafields: campos.slice(i, i + 25).map((c) => c.input) },
      );
      check(data.metafieldsSet, "campos das peças");
    }
    feitos += campos.length;
  } else {
    pendentes += campos.length;
  }
}

// ── 5. O que mexe em produto existente: só com bandeira ────────────────────

/** Sem a bandeira, só conta o que há para fazer. Com ela, mostra e (com --apply) faz. */
async function reservado(titulo, bandeira, ligada, itens, run) {
  console.log(`\n${titulo}`);
  if (itens.length === 0) return console.log("  = nada a fazer");
  if (!ligada) return console.log(`  · ${itens.length} alteração(ões) esperando a bandeira ${bandeira}`);
  for (const item of itens) await passo(item.texto, () => run(item));
}

// 5a. Nome e endereço
const renomes = [];
for (const item of CURADORIA) {
  const p = produtos.get(item.id);
  if (p.title === item.titulo && p.handle === item.handle) continue;
  const partes = [];
  if (p.title !== item.titulo) partes.push(`nome "${p.title}" → "${item.titulo}"`);
  if (p.handle !== item.handle) partes.push(`endereço ${p.handle} → ${item.handle}`);
  renomes.push({ texto: partes.join(" | "), id: p.id, input: { title: item.titulo, handle: item.handle } });
}
// Endereço desejado que hoje pertence a uma peça FORA da curadoria: ela cede o lugar.
const cedem = [];
for (const item of CURADORIA) {
  if (produtos.get(item.id).handle === item.handle) continue;
  const { productByHandle: dono } = await gql(`query($handle: String!) { productByHandle(handle: $handle) { id title } }`, { handle: item.handle });
  if (!dono) continue;
  // Entre peças da própria curadoria a troca dependeria da ordem; hoje não há nenhum caso.
  if (produtos.has(numero(dono.id))) throw new Error(`o endereço ${item.handle} hoje é de outra peça da curadoria ("${dono.title}"): acerte a ordem à mão`);
  cedem.push({ texto: `liberar o endereço ${item.handle}: "${dono.title}" (fora da loja) passa a ${item.handle}-antiga`, id: dono.id, input: { handle: `${item.handle}-antiga` } });
}
const renomear = (item) =>
  gql(
    `mutation($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id handle } userErrors { field message } } }`,
    { product: { id: item.id, redirectNewHandle: true, ...item.input } },
  ).then((data) => check(data.productUpdate, item.texto));
await reservado("Nome e endereço das peças", "--renomear", RENOMEAR, [...cedem, ...renomes], renomear);

// 5b. Foto de capa
const capas = CURADORIA.filter((item) => item.capa && produtos.get(item.id).media.nodes[0]?.id !== gid("MediaImage", item.capa)).map((item) => ({
  texto: `${item.titulo}: trocar a foto que abre a peça`,
  id: gid("Product", item.id),
  media: gid("MediaImage", item.capa),
}));
await reservado("Foto de capa", "--capas", CAPAS, capas, (item) =>
  gql(
    `mutation($id: ID!, $moves: [MoveInput!]!) { productReorderMedia(id: $id, moves: $moves) { job { id } mediaUserErrors { field message } } }`,
    { id: item.id, moves: [{ id: item.media, newPosition: "0" }] },
  ).then((data) => check(data.productReorderMedia, item.texto, "mediaUserErrors")),
);

// 5c. Ativar e publicar só no canal Headless
const ativar = CURADORIA.filter((item) => {
  const p = produtos.get(item.id);
  return p.status !== "ACTIVE" || !p.noCanal;
}).map((item) => {
  const p = produtos.get(item.id);
  const estoque = p.variants.nodes.reduce((sum, v) => sum + Math.max(v.inventoryQuantity, 0), 0);
  const avisos = [];
  if (p.variants.nodes.some((v) => !v.inventoryItem.tracked)) avisos.push("estoque NÃO controlado: vende sem limite");
  if (p.variants.nodes.some((v) => v.inventoryPolicy === "CONTINUE")) avisos.push("vende mesmo zerado");
  if (p.variants.nodes.some((v) => v.inventoryQuantity < 0)) avisos.push("tem tamanho com estoque negativo");
  return {
    texto: `${item.titulo} (${item.grupo}, ${estoque} em estoque)${avisos.length ? ` ⚠ ${avisos.join("; ")}` : ""}`,
    id: p.id,
    ativo: p.status === "ACTIVE",
    noCanal: p.noCanal,
  };
});
await reservado("Ativar e publicar no canal Headless", "--ativar", ATIVAR, ativar, async (item) => {
  if (!item.ativo) {
    const data = await gql(
      `mutation($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id status } userErrors { field message } } }`,
      { product: { id: item.id, status: "ACTIVE" } },
    );
    check(data.productUpdate, item.texto);
  }
  if (!item.noCanal) {
    const data = await gql(
      `mutation($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
      { id: item.id, input: [{ publicationId: CANAL.id }] },
    );
    check(data.publishablePublish, item.texto);
  }
});

console.log(APPLY ? `\nfeito: ${feitos} alteração(ões).` : `\n${pendentes} alteração(ões) no plano. Para aplicar: acrescente --apply`);
