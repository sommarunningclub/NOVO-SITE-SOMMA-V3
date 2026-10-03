import {
  DROP_FIELDS,
  IMAGE_FRAGMENT,
  MONEY_FRAGMENT,
  PRODUCT_DETAIL_FRAGMENT,
  PRODUCT_SUMMARY_FRAGMENT,
  VARIANT_FRAGMENT,
} from "../fragments";

const SUMMARY = `${IMAGE_FRAGMENT}${MONEY_FRAGMENT}${VARIANT_FRAGMENT}${PRODUCT_SUMMARY_FRAGMENT}`;

/** /loja/products/[handle] */
export const PRODUCT_QUERY = /* GraphQL */ `
  query LojaProduct($handle: String!) {
    product(handle: $handle) { ...ProductDetail }
  }
  ${SUMMARY}
  ${PRODUCT_DETAIL_FRAGMENT}
`;

/** "Complete the uniform" (COMPLEMENTARY) e "You may also like" (RELATED). */
export const RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query LojaRecommendations($productId: ID!, $intent: ProductRecommendationIntent!) {
    productRecommendations(productId: $productId, intent: $intent) { ...ProductSummary }
  }
  ${SUMMARY}
`;

/**
 * /loja/collections/[handle]. O catálogo é pequeno: a coleção vem inteira e o
 * filtro acontece no navegador (é o que permite reorganizar a grade com Flip
 * sem nova requisição). Passou de `first`, vira paginação no servidor.
 */
export const COLLECTION_QUERY = /* GraphQL */ `
  query LojaCollection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      handle
      title
      description
      image { ...Image }
      products(first: $first) { nodes { ...ProductSummary } }
    }
  }
  ${SUMMARY}
`;

/**
 * Índice de categorias da home: é um menu da Shopify (Conteúdo > Menus), então
 * a equipe muda a ordem e os itens sem deploy.
 */
export const CATEGORY_MENU_QUERY = /* GraphQL */ `
  query LojaCategoryMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        title
        resource {
          ... on Collection {
            handle
            image { ...Image }
            products(first: 100) { nodes { id featuredImage { ...Image } } }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const DROPS_QUERY = /* GraphQL */ `
  query LojaDrops {
    metaobjects(type: "somma_drop", first: 50) {
      nodes { ${DROP_FIELDS} }
    }
  }
  ${IMAGE_FRAGMENT}
`;

/** Conteúdo editável da home: metaobjeto único `somma_home`, handle `principal`. */
export const HOME_QUERY = /* GraphQL */ `
  query LojaHome {
    metaobject(handle: { type: "somma_home", handle: "principal" }) {
      heroHeadline: field(key: "hero_headline") { value }
      heroCtaLabel: field(key: "hero_cta_label") { value }
      manifesto: field(key: "manifesto") { value }
      clubHeadline: field(key: "club_headline") { value }
      clubText: field(key: "club_text") { value }
      clubMedia: field(key: "club_media") { references(first: 1) { nodes { ... on MediaImage { image { ...Image } } } } }
      announcement: field(key: "announcement") { value }
      newsletterHeadline: field(key: "newsletter_headline") { value }
      newsletterText: field(key: "newsletter_text") { value }
      lookbook: field(key: "lookbook") {
        reference {
          ... on Metaobject {
            title: field(key: "title") { value }
            subtitle: field(key: "subtitle") { value }
            images: field(key: "images") { references(first: 12) { nodes { ... on MediaImage { image { ...Image } } } } }
            products: field(key: "products") { references(first: 6) { nodes { ... on Product { ...ProductSummary } } } }
          }
        }
      }
    }
  }
  ${SUMMARY}
`;

/** Busca enquanto digita. Sem cache. */
export const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query LojaPredictiveSearch($query: String!) {
    predictiveSearch(query: $query, limit: 6, types: [PRODUCT, COLLECTION, QUERY]) {
      products { ...ProductSummary }
      collections { handle title }
      queries { text }
    }
  }
  ${SUMMARY}
`;
