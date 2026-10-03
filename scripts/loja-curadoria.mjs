/**
 * Curadoria do catálogo da loja (/loja): o que é drop, o que segue à venda e o
 * que é arquivo, com que nome, em que endereço e em que ordem.
 *
 * É uma lista só, usada em dois lugares:
 *  - scripts/loja-preview-snapshot.mjs monta a prévia local com ela;
 *  - scripts/loja-shopify-catalogo.mjs grava a mesma organização na Shopify.
 *
 * Cada peça é achada pelo `id` do produto na Shopify, que nunca muda. O handle
 * (endereço) é justamente uma das coisas a acertar, então não serve de chave.
 * `capa` é o id da foto que deve abrir a peça (a primeira da Shopify nem sempre
 * é a melhor); sem `capa`, vale a ordem que já está lá.
 */

/** Cores: a chave é o identificador da cor na taxonomia da Shopify (`shopify--color-pattern`). */
export const COR = {
  laranja: { name: "Laranja", hex: "#FF4800" },
  preto: { name: "Preto", hex: "#141414" },
  branco: { name: "Branco", hex: "#FFFFFF" },
};

/** `grupo`: drop (linha 2026), core (segue à venda) ou archive. `familia` junta as cores da mesma peça. */
export const CURADORIA = [
  // ── Drop 001 ────────────────────────────────────────────────────────────
  { id: 9357891272957, handle: "cropped-laranja", titulo: "Cropped Laranja", grupo: "drop", categoria: "croppeds", cor: "laranja", familia: "cropped-zip", selo: "NEW" },
  { id: 9357892485373, handle: "regata-masculina-preta", titulo: "Regata Masculina Preta", grupo: "drop", categoria: "regatas", cor: "preto", familia: "regata-masculina" },
  { id: 9357890715901, handle: "camisa-de-treino-preta", titulo: "Camisa de Treino Preta", grupo: "drop", categoria: "camisetas", capa: 38049332363517 },
  { id: 9357891502333, handle: "regata-feminina-preta", titulo: "Regata Feminina Preta", grupo: "drop", categoria: "regatas" },
  { id: 9305254887677, handle: "bone-2026", titulo: "Boné 2026", grupo: "drop", categoria: "acessorios" },
  { id: 9357892288765, handle: "regata-masculina-branca", titulo: "Regata Masculina Branca", grupo: "drop", categoria: "regatas", cor: "branco", familia: "regata-masculina" },
  { id: 9357891404029, handle: "cropped-preto", titulo: "Cropped Preto", grupo: "drop", categoria: "croppeds", cor: "preto", familia: "cropped-zip" },
  { id: 9357891797245, handle: "cropped-branco", titulo: "Cropped Branco", grupo: "drop", categoria: "croppeds", cor: "branco", familia: "cropped-zip" },
  { id: 9357893337341, handle: "lenco-preto", titulo: "Lenço Preto", grupo: "drop", categoria: "acessorios", cor: "preto", familia: "lenco" },
  { id: 9357892813053, handle: "lenco-laranja", titulo: "Lenço Laranja", grupo: "drop", categoria: "acessorios", cor: "laranja", familia: "lenco" },
  // ── Seguem à venda ──────────────────────────────────────────────────────
  { id: 9213472145661, handle: "regata-machao-fire-pack", titulo: "Regata Machão Fire Pack", grupo: "core", categoria: "regatas", capa: 37210966163709 },
  { id: 9213475324157, handle: "cropped-somma-laranja", titulo: "Cropped Somma Laranja", grupo: "core", categoria: "croppeds", capa: 37210979631357 },
  // ── Archive ─────────────────────────────────────────────────────────────
  { id: 9171932479741, handle: "cropped-rosa-8-de-marco", titulo: "Cropped Rosa 8 de Março", grupo: "archive", capa: 36897585299709 },
  { id: 9213501735165, handle: "regata-somma-preto", titulo: "Regata Somma Preto", grupo: "archive", capa: 37211107819773 },
  { id: 9155628826877, handle: "camisa-de-treino-running-club", titulo: "Camisa de Treino Running Club", grupo: "archive", capa: 36602380452093 },
  { id: 9051194294525, handle: "bone-5panel-classico", titulo: "Boné 5panel Clássico", grupo: "archive" },
  { id: 9213500260605, handle: "moletom-preto", titulo: "Moletom Preto", grupo: "archive", capa: 37211100020989 },
  { id: 9049073746173, handle: "regata-machao", titulo: "Regata Machão", grupo: "archive", capa: 36284279128317 },
  { id: 9213478240509, handle: "regata-softcore", titulo: "Regata Softcore", grupo: "archive", capa: 37210991329533 },
  { id: 9117599465725, handle: "regata-machao-white", titulo: "Regata Machão White", grupo: "archive", capa: 36706311045373 },
  { id: 9049078857981, handle: "camiseta-oversized-off-white", titulo: "Camiseta Oversized Off-White", grupo: "archive", capa: 36284271755517 },
  { id: 9049079283965, handle: "regata-preta-performance", titulo: "Regata Preta Performance", grupo: "archive" },
  { id: 9117628006653, handle: "moletom-lifestyle-branco", titulo: "Moletom Lifestyle Branco", grupo: "archive" },
  { id: 9049074172157, handle: "camisa-de-treino-laranja", titulo: "Camisa de Treino Laranja", grupo: "archive", capa: 36284222963965 },
  { id: 9167086321917, handle: "lenco-somma-club", titulo: "Lenço Somma Club", grupo: "archive", capa: 36849516708093 },
  { id: 9117666607357, handle: "cropped-preto-performance", titulo: "Cropped Preto Performance", grupo: "archive" },
  { id: 9087728353533, handle: "cropped-suplex-branco", titulo: "Cropped Suplex Branco", grupo: "archive" },
  { id: 9087727436029, handle: "cropped-oversized-off-white", titulo: "Cropped Oversized Off-White", grupo: "archive", capa: 36316372828413 },
  { id: 9276937273597, handle: "regata-maratona-rio-2026", titulo: "Regata Maratona Rio 2026", grupo: "archive" },
  { id: 9276935897341, handle: "cropped-maratona-rio-2026", titulo: "Cropped Maratona Rio 2026", grupo: "archive", capa: 37561718833405 },
  { id: 9276941041917, handle: "camiseta-maratona-rio-2026", titulo: "Camiseta Maratona Rio 2026", grupo: "archive" },
];

/** O drop em cartaz (metaobjeto `somma_drop`). `foto` é a foto de campanha: o ensaio do boné. */
export const DROP = {
  handle: "drop-001",
  code: "001",
  title: "The Saturday Uniform",
  tagline: "Drop 001",
  description:
    "A linha 2026 do clube: regatas, croppeds, camisa de treino, boné e lenço. Feita para o sábado de manhã e para tudo o que vem depois dele.",
  releaseDate: "2026-07-18",
  state: "ativo",
  collectionHandle: "drop-001",
  foto: 37916265578749,
};

/** Lookbook da home (metaobjeto `somma_lookbook`): fotos que já estão na Shopify, nas peças. */
export const LOOKBOOK = {
  handle: "brasilia-2026",
  title: "Lookbook",
  subtitle: "Brasília, 2026",
  fotos: [37916265513213, 37210979631357, 37916265611517, 37210966163709, 37916265677053, 37210979533053],
  pecas: [9305254887677, 9213475324157, 9213472145661],
};

const ids = (keep) => CURADORIA.filter(keep).map((p) => p.id);

/** Coleções que a loja lê. A ordem das peças é a da curadoria. */
export const COLECOES = [
  { handle: DROP.collectionHandle, title: DROP.title, description: DROP.description, produtos: ids((p) => p.grupo === "drop") },
  { handle: "todos", title: "Todos os produtos", description: "", produtos: ids((p) => p.grupo !== "archive") },
  { handle: "regatas", title: "Regatas", description: "", produtos: ids((p) => p.categoria === "regatas") },
  { handle: "croppeds", title: "Croppeds", description: "", produtos: ids((p) => p.categoria === "croppeds") },
  { handle: "camisetas", title: "Camisetas", description: "", produtos: ids((p) => p.categoria === "camisetas") },
  { handle: "acessorios", title: "Acessórios", description: "", produtos: ids((p) => p.categoria === "acessorios") },
  { handle: "archive", title: "Archive", description: "", produtos: ids((p) => p.grupo === "archive") },
];

/** Menu das categorias da home (Conteúdo > Menus). Os itens apontam para coleções acima. */
export const MENU = {
  handle: "loja-categorias",
  title: "Loja: categorias",
  colecoes: ["regatas", "croppeds", "camisetas", "acessorios"],
};
