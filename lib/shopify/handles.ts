/**
 * Handles da Shopify que o código conhece pelo nome. Ficam todos aqui para
 * não haver string de loja espalhada pelas telas.
 */
export const HANDLES = {
  /** Coleção com tudo o que está à venda (drop atual + peças que seguem). */
  allProducts: "todos",
  /** Coleção de peças de arquivo: esgotadas ou em últimas unidades. */
  archive: "archive",
  /** Menu (Conteúdo > Menus) que lista as categorias da home. */
  categoryMenu: "loja-categorias",
} as const;

/** Rotas da loja. A loja vive em /loja dentro do site do clube. */
export const ROUTES = {
  home: "/loja",
  shop: `/loja/collections/${HANDLES.allProducts}`,
  archive: "/loja/archive",
  collection: (handle: string) => `/loja/collections/${handle}`,
  product: (handle: string) => `/loja/products/${handle}`,
  club: "/",
} as const;
