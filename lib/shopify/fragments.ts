/**
 * Fragments da Storefront API. Cada query importa só os que usa; a ordem de
 * concatenação não importa para o GraphQL, só a presença.
 */

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment Image on Image {
    url
    altText
    width
    height
  }
`;

export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment Money on MoneyV2 {
    amount
    currencyCode
  }
`;

export const VARIANT_FRAGMENT = /* GraphQL */ `
  fragment Variant on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    price { ...Money }
    compareAtPrice { ...Money }
    selectedOptions { name value }
  }
`;

/** Cor vinda da taxonomia padrão da Shopify (`shopify.color-pattern`). */
const COLOR_FIELDS = /* GraphQL */ `
  colorPattern: metafield(namespace: "shopify", key: "color-pattern") {
    references(first: 1) {
      nodes {
        ... on Metaobject {
          label: field(key: "label") { value }
          color: field(key: "color") { value }
        }
      }
    }
  }
`;

/** O que um card precisa: nada de descrição, mídia completa ou história. */
export const PRODUCT_SUMMARY_FRAGMENT = /* GraphQL */ `
  fragment ProductSummary on Product {
    id
    handle
    title
    availableForSale
    createdAt
    priceRange { minVariantPrice { ...Money } }
    compareAtPriceRange { minVariantPrice { ...Money } }
    images(first: 2) { nodes { ...Image } }
    options { name optionValues { name } }
    variants(first: 50) { nodes { ...Variant } }
    badge: metafield(namespace: "somma", key: "badge") { value }
    keepInArchive: metafield(namespace: "somma", key: "keep_in_archive") { value }
    colorSiblingIds: metafield(namespace: "somma", key: "color_siblings") { value }
    ${COLOR_FIELDS}
    drop: metafield(namespace: "somma", key: "drop") {
      reference {
        ... on Metaobject {
          handle
          code: field(key: "code") { value }
          title: field(key: "title") { value }
        }
      }
    }
  }
`;

/** Tudo o que só a página de produto usa, somado ao resumo. */
export const PRODUCT_DETAIL_FRAGMENT = /* GraphQL */ `
  fragment ProductDetail on Product {
    ...ProductSummary
    description
    descriptionHtml
    seo { title description }
    allImages: images(first: 20) { nodes { ...Image } }
    fit: metafield(namespace: "somma", key: "fit") { value }
    modelHeight: metafield(namespace: "somma", key: "model_height_cm") { value }
    modelWeight: metafield(namespace: "somma", key: "model_weight_kg") { value }
    modelSize: metafield(namespace: "somma", key: "model_size") { value }
    story: metafield(namespace: "somma", key: "story") { value }
    sizeGuide: metafield(namespace: "somma", key: "size_guide") {
      reference {
        ... on Metaobject {
          title: field(key: "title") { value }
          table: field(key: "table") { value }
          howToMeasure: field(key: "how_to_measure") { value }
          fitNotes: field(key: "fit_notes") { value }
        }
      }
    }
    colorSiblings: metafield(namespace: "somma", key: "color_siblings") {
      references(first: 10) {
        nodes {
          ... on Product {
            handle
            title
            featuredImage { ...Image }
            ${COLOR_FIELDS}
          }
        }
      }
    }
  }
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { ...Money } }
    discountCodes { code applicable }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ...Money } amountPerQuantity { ...Money } }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
            image { ...Image }
            product { handle title }
          }
        }
      }
    }
  }
`;

/** Campos de um drop (metaobjeto `somma_drop`). */
export const DROP_FIELDS = /* GraphQL */ `
  handle
  code: field(key: "code") { value }
  title: field(key: "title") { value }
  tagline: field(key: "tagline") { value }
  description: field(key: "description") { value }
  releaseDate: field(key: "release_date") { value }
  state: field(key: "state") { value }
  collection: field(key: "collection") { reference { ... on Collection { handle } } }
  heroMedia: field(key: "hero_media") { reference { ... on MediaImage { image { ...Image } } } }
`;
