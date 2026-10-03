import { CART_FRAGMENTS } from "../queries/cart";

export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation LojaCartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...Cart }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENTS}
`;

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation LojaCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...Cart }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENTS}
`;

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation LojaCartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...Cart }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENTS}
`;

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation LojaCartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...Cart }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENTS}
`;

export const CART_DISCOUNT_CODES_UPDATE_MUTATION = /* GraphQL */ `
  mutation LojaCartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart { ...Cart }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENTS}
`;
