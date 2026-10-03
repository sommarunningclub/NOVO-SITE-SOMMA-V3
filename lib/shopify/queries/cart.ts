import { CART_FRAGMENT, IMAGE_FRAGMENT, MONEY_FRAGMENT } from "../fragments";

export const CART_FRAGMENTS = `${IMAGE_FRAGMENT}${MONEY_FRAGMENT}${CART_FRAGMENT}`;

/** Carrinho nunca usa cache compartilhado: é de um comprador só. */
export const CART_QUERY = /* GraphQL */ `
  query LojaCart($id: ID!) {
    cart(id: $id) { ...Cart }
  }
  ${CART_FRAGMENTS}
`;
