"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import {
  CartUserError,
  addToCart,
  getCart,
  getProduct,
  getRecommendations,
  setCartDiscountCodes,
  updateCartLine,
} from "@/lib/shopify";
import type { Cart, ProductSummary } from "@/lib/shopify/types";

/**
 * Carrinho da loja. O carrinho é o da Shopify (Storefront API); aqui só mora o
 * id dele, num cookie httpOnly restrito a /loja. Nenhum preço ou estoque é
 * calculado deste lado: tudo volta da Shopify a cada operação.
 */

const COOKIE = "somma_cart";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

const variantId = z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/);
const quantity = z.number().int().min(0).max(20);
const lineId = z.string().min(1).max(300);
const discountCode = z.string().trim().min(1).max(60);

export type CartResult = { ok: true; cart: Cart | null } | { ok: false; message: string };

const GENERIC = "Não foi possível atualizar a sacola. Tente de novo.";

async function buyerIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

async function readCartId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

async function writeCartId(id: string): Promise<void> {
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/loja",
    maxAge: MAX_AGE,
  });
}

function fail(error: unknown): CartResult {
  // mensagem da Shopify (estoque, variante) é para o comprador; o resto não
  return { ok: false, message: error instanceof CartUserError ? error.message : GENERIC };
}

export async function loadCart(): Promise<Cart | null> {
  const id = await readCartId();
  if (!id) return null;
  try {
    return await getCart(id);
  } catch {
    return null;
  }
}

export async function addLine(rawVariantId: string, rawQuantity = 1): Promise<CartResult> {
  const parsed = z.object({ v: variantId, q: quantity.min(1) }).safeParse({ v: rawVariantId, q: rawQuantity });
  if (!parsed.success) return { ok: false, message: GENERIC };
  try {
    const cart = await addToCart(await readCartId(), [{ variantId: parsed.data.v, quantity: parsed.data.q }], await buyerIp());
    await writeCartId(cart.id);
    return { ok: true, cart };
  } catch (error) {
    return fail(error);
  }
}

/** Quantidade 0 remove a linha. */
export async function setLineQuantity(rawLineId: string, rawQuantity: number): Promise<CartResult> {
  const parsed = z.object({ l: lineId, q: quantity }).safeParse({ l: rawLineId, q: rawQuantity });
  const id = await readCartId();
  if (!parsed.success || !id) return { ok: false, message: GENERIC };
  try {
    return { ok: true, cart: await updateCartLine(id, parsed.data.l, parsed.data.q, await buyerIp()) };
  } catch (error) {
    return fail(error);
  }
}

/** Um cupom por vez; string vazia remove o cupom aplicado. */
export async function applyDiscount(rawCode: string): Promise<CartResult> {
  const id = await readCartId();
  if (!id) return { ok: false, message: "Adicione uma peça antes de usar o cupom." };
  const parsed = rawCode.trim() === "" ? null : discountCode.safeParse(rawCode);
  if (parsed && !parsed.success) return { ok: false, message: "Cupom inválido." };
  try {
    const cart = await setCartDiscountCodes(id, parsed ? [parsed.data] : [], await buyerIp());
    const rejected = cart.discountCodes.find((d) => !d.applicable);
    // na prévia local não há Shopify para validar o cupom
    if (rejected && cart.checkoutUrl) return { ok: false, message: `O cupom ${rejected.code} não vale para esta sacola.` };
    return { ok: true, cart };
  } catch (error) {
    return fail(error);
  }
}

/**
 * "Complete the uniform" da sacola: UMA sugestão, a primeira complementar da
 * última peça adicionada que ainda não está na sacola e tem estoque.
 */
export async function suggestForCart(rawHandles: string[]): Promise<ProductSummary | null> {
  const handles = z.array(z.string().min(1).max(255)).max(50).safeParse(rawHandles);
  if (!handles.success || handles.data.length === 0) return null;
  try {
    const last = await getProduct(handles.data[handles.data.length - 1]);
    if (!last) return null;
    const recommended = await getRecommendations(last, "COMPLEMENTARY");
    return recommended.find((p) => p.availableForSale && !handles.data.includes(p.handle)) ?? null;
  } catch {
    return null;
  }
}
