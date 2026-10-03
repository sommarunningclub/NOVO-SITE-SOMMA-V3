/**
 * Estrutura de conteúdo da loja (/loja) na Shopify.
 *
 * Cria as DEFINIÇÕES que a loja lê: metaobjetos (drop, lookbook, guia de
 * tamanhos, história, home) e os campos novos de produto (namespace `somma`).
 * Só acrescenta: nunca apaga, nunca altera definição, produto ou valor que já
 * exista. Pode rodar de novo quantas vezes for preciso; o que já existe é
 * pulado e só os campos que faltam são acrescentados.
 *
 * Tudo nasce com leitura pública pela Storefront API, que é como a loja lê.
 *
 * Uso (sem --apply só mostra o plano):
 *   SHOPIFY_ADMIN_TOKEN=shpat_... SHOPIFY_STORE_DOMAIN=xxx.myshopify.com \
 *     node scripts/loja-shopify-setup.mjs [--apply]
 */

const token = process.env.SHOPIFY_ADMIN_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-01";
const APPLY = process.argv.includes("--apply");
if (!token || !domain) {
  console.error("Defina SHOPIFY_ADMIN_TOKEN e SHOPIFY_STORE_DOMAIN.");
  process.exit(1);
}

const IMAGE = [{ name: "file_type_options", value: JSON.stringify(["Image"]) }];
const choices = (list) => [{ name: "choices", value: JSON.stringify(list) }];
/** Referência a outro metaobjeto: o id só existe depois de criado, então é resolvido na hora. */
const ref = (type) => ({ $ref: type });

/** A ordem importa: quem é referenciado vem antes de quem referencia. */
const METAOBJECTS = [
  {
    type: "somma_lookbook",
    name: "Lookbook (loja)",
    description: "Sequência de fotos do trilho horizontal da home e das coleções.",
    displayNameKey: "title",
    fields: [
      { key: "title", name: "Título", type: "single_line_text_field", required: true },
      { key: "subtitle", name: "Subtítulo", type: "single_line_text_field", description: "Ex.: Brasília, 2026" },
      { key: "images", name: "Imagens", type: "list.file_reference", validations: IMAGE, description: "Mínimo de 3. Pode misturar retrato, quadrada e paisagem." },
      { key: "products", name: "Peças que aparecem nas fotos", type: "list.product_reference" },
    ],
  },
  {
    type: "somma_drop",
    name: "Drop (loja)",
    description: "Um lançamento: nome, código, texto, foto de campanha e a coleção com as peças.",
    displayNameKey: "title",
    fields: [
      { key: "title", name: "Nome do drop", type: "single_line_text_field", required: true, description: "Ex.: The Saturday Uniform" },
      { key: "code", name: "Código", type: "single_line_text_field", required: true, description: "Três dígitos: 001, 002…" },
      { key: "tagline", name: "Linha de apoio", type: "single_line_text_field" },
      { key: "description", name: "Descrição", type: "multi_line_text_field" },
      { key: "release_date", name: "Data de lançamento", type: "date" },
      { key: "state", name: "Estado", type: "single_line_text_field", validations: choices(["em_breve", "ativo", "arquivo"]), description: "O drop 'ativo' mais recente é o que aparece na home." },
      { key: "collection", name: "Coleção com as peças", type: "collection_reference" },
      { key: "hero_media", name: "Foto de campanha", type: "file_reference", validations: IMAGE },
    ],
  },
  {
    type: "somma_size_guide",
    name: "Guia de tamanhos (loja)",
    description: "Tabela de medidas por tipo de peça. Cada produto aponta para o seu guia.",
    displayNameKey: "title",
    fields: [
      { key: "title", name: "Título", type: "single_line_text_field", required: true, description: "Ex.: Regatas e camisetas" },
      { key: "table", name: "Tabela", type: "multi_line_text_field", required: true, description: "Uma medida por linha, colunas separadas por ponto e vírgula. A primeira linha é o cabeçalho. Ex.: Medida (cm);P;M;G;GG" },
      { key: "how_to_measure", name: "Como medir", type: "multi_line_text_field" },
      { key: "fit_notes", name: "Observações de caimento", type: "multi_line_text_field" },
    ],
  },
  {
    type: "somma_editorial",
    name: "História (loja)",
    description: "Texto editorial com fotos: história de drop, do clube ou de uma peça.",
    displayNameKey: "title",
    fields: [
      { key: "title", name: "Título", type: "single_line_text_field", required: true },
      { key: "kicker", name: "Rótulo", type: "single_line_text_field", description: "Ex.: Field tested" },
      { key: "body", name: "Texto", type: "rich_text_field" },
      { key: "media", name: "Fotos", type: "list.file_reference", validations: IMAGE },
      { key: "products", name: "Peças relacionadas", type: "list.product_reference" },
    ],
  },
  {
    type: "somma_home",
    name: "Home da loja",
    description: "Conteúdo editável da home. Use UMA entrada só, com o identificador 'principal'. Campo vazio usa o texto padrão do site.",
    displayNameKey: "title",
    fields: [
      { key: "title", name: "Nome interno", type: "single_line_text_field", required: true, description: "Só para identificar. Use: Principal" },
      { key: "hero_headline", name: "Headline do topo", type: "multi_line_text_field", description: "Uma linha por quebra." },
      { key: "hero_media", name: "Foto do topo (computador)", type: "file_reference", validations: IMAGE, description: "Horizontal." },
      { key: "hero_media_mobile", name: "Foto do topo (celular)", type: "file_reference", validations: IMAGE, description: "Vertical." },
      { key: "hero_cta_label", name: "Texto do botão do topo", type: "single_line_text_field" },
      { key: "manifesto", name: "Manifesto", type: "multi_line_text_field", description: "Uma linha por quebra." },
      { key: "club_headline", name: "Título do bloco do clube", type: "multi_line_text_field" },
      { key: "club_text", name: "Texto do bloco do clube", type: "multi_line_text_field" },
      { key: "club_media", name: "Fotos do clube", type: "list.file_reference", validations: IMAGE },
      { key: "lookbook", name: "Lookbook", type: "metaobject_reference", validations: [ref("somma_lookbook")] },
      { key: "announcement", name: "Aviso no topo", type: "single_line_text_field" },
      { key: "newsletter_headline", name: "Título do Drop Access", type: "multi_line_text_field" },
      { key: "newsletter_text", name: "Texto do Drop Access", type: "single_line_text_field" },
    ],
  },
];

const PRODUCT_FIELDS = [
  { key: "drop", name: "Drop", type: "metaobject_reference", validations: [ref("somma_drop")], description: "De qual drop a peça faz parte." },
  { key: "fit", name: "Caimento", type: "single_line_text_field", validations: choices(["True to size", "Relaxed", "Race fit", "Oversized"]) },
  { key: "model_height_cm", name: "Altura do modelo (cm)", type: "number_integer" },
  { key: "model_weight_kg", name: "Peso do modelo (kg)", type: "number_integer" },
  { key: "model_size", name: "Tamanho que o modelo veste", type: "single_line_text_field" },
  { key: "story", name: "História da peça", type: "rich_text_field", description: "Por que a peça existe. Aparece em destaque na página do produto." },
  { key: "badge", name: "Selo", type: "single_line_text_field", validations: choices(["NEW", "LIMITED"]), description: "Sold out não é selo: vem do estoque." },
  { key: "keep_in_archive", name: "Manter no archive", type: "boolean", description: "Peça esgotada continua visível como registro." },
  { key: "size_guide", name: "Guia de tamanhos", type: "metaobject_reference", validations: [ref("somma_size_guide")] },
  { key: "color_siblings", name: "Outras cores", type: "list.product_reference", description: "As OUTRAS cores da mesma peça (não incluir a própria)." },
];

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

function check(payload, what) {
  if (payload.userErrors?.length) throw new Error(`${what}: ${payload.userErrors.map((e) => `${(e.field ?? []).join(".")} ${e.message}`).join("; ")}`);
}

const existing = await gql(`{
  metaobjectDefinitions(first: 100) { nodes { id type fieldDefinitions { key } } }
  metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "somma") { nodes { key } }
}`);
const defs = new Map(existing.metaobjectDefinitions.nodes.map((d) => [d.type, { id: d.id, keys: new Set(d.fieldDefinitions.map((f) => f.key)) }]));
const productKeys = new Set(existing.metafieldDefinitions.nodes.map((d) => d.key));

/** Troca `{ $ref: tipo }` pelo id real da definição referenciada. */
function resolve(validations = []) {
  return validations.map((v) => {
    if (!v.$ref) return v;
    const target = defs.get(v.$ref);
    if (!target) throw new Error(`definição referenciada ainda não existe: ${v.$ref}`);
    return { name: "metaobject_definition_id", value: target.id };
  });
}

const field = (f) => ({
  key: f.key,
  name: f.name,
  type: f.type,
  description: f.description,
  required: f.required ?? false,
  validations: APPLY || !f.validations?.some((v) => v.$ref) ? resolve(f.validations) : [],
});

console.log(APPLY ? "APLICANDO na loja" : "PLANO (nada é alterado sem --apply)", `· ${domain}\n`);

for (const def of METAOBJECTS) {
  const current = defs.get(def.type);
  if (!current) {
    console.log(`+ metaobjeto ${def.type} ("${def.name}") com ${def.fields.length} campos`);
    if (!APPLY) continue;
    const data = await gql(
      `mutation($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id type } userErrors { field message } }
      }`,
      {
        definition: {
          type: def.type,
          name: def.name,
          description: def.description,
          displayNameKey: def.displayNameKey,
          access: { storefront: "PUBLIC_READ" },
          capabilities: { publishable: { enabled: true } },
          fieldDefinitions: def.fields.map(field),
        },
      },
    );
    check(data.metaobjectDefinitionCreate, def.type);
    defs.set(def.type, { id: data.metaobjectDefinitionCreate.metaobjectDefinition.id, keys: new Set(def.fields.map((f) => f.key)) });
    continue;
  }
  const missing = def.fields.filter((f) => !current.keys.has(f.key));
  if (missing.length === 0) {
    console.log(`= metaobjeto ${def.type} já existe, completo`);
    continue;
  }
  console.log(`~ metaobjeto ${def.type}: acrescentar ${missing.map((f) => f.key).join(", ")}`);
  if (!APPLY) continue;
  const data = await gql(
    `mutation($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
      metaobjectDefinitionUpdate(id: $id, definition: $definition) { metaobjectDefinition { id } userErrors { field message } }
    }`,
    { id: current.id, definition: { fieldDefinitions: missing.map((f) => ({ create: field(f) })) } },
  );
  check(data.metaobjectDefinitionUpdate, def.type);
}

for (const f of PRODUCT_FIELDS) {
  if (productKeys.has(f.key)) {
    console.log(`= campo de produto somma.${f.key} já existe`);
    continue;
  }
  console.log(`+ campo de produto somma.${f.key} ("${f.name}", ${f.type})`);
  if (!APPLY) continue;
  const data = await gql(
    `mutation($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field message } }
    }`,
    {
      definition: {
        namespace: "somma",
        key: f.key,
        name: f.name,
        description: f.description,
        type: f.type,
        ownerType: "PRODUCT",
        pin: true,
        access: { storefront: "PUBLIC_READ" },
        validations: resolve(f.validations),
      },
    },
  );
  check(data.metafieldDefinitionCreate, `somma.${f.key}`);
}

console.log(APPLY ? "\nfeito." : "\npara aplicar: acrescente --apply");
