"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Cart, CartLine, Money, SelectedOption, ShopImage } from "@/lib/shopify/types";
import { addLine, applyDiscount, loadCart, setLineQuantity } from "../_actions/cart";
import { track } from "../_lib/analytics";

/**
 * Estado de cliente da loja: a sacola e qual painel está aberto.
 *
 * A sacola é carregada DEPOIS da hidratação, por server action. Assim as
 * páginas não leem cookie no servidor e continuam cacheáveis na CDN; o preço
 * é o contador da sacola aparecer um instante depois do resto.
 *
 * As operações são otimistas: a tela muda na hora e a resposta da Shopify
 * confirma ou desfaz. Quem manda no número final é sempre a Shopify.
 */

export type Panel = "cart" | "search" | "menu" | null;

/** O que o card ou a PDP sabem sobre a peça no momento do clique. */
export type CartDraft = {
  variantId: string;
  quantity: number;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  image: ShopImage | null;
  unitPrice: Money;
  selectedOptions: SelectedOption[];
};

type LojaContext = {
  cart: Cart | null;
  count: number;
  /** `false` até a primeira leitura da sacola terminar. */
  ready: boolean;
  busy: boolean;
  error: string | null;
  dismissError: () => void;
  add: (draft: CartDraft) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  applyCode: (code: string) => Promise<boolean>;
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
  /**
   * Fecha só se o painel aberto ainda for este. É o que o `onClose` de cada
   * <dialog> usa: trocar de painel (menu → busca) fecha o primeiro dialog, e
   * esse fechamento não pode derrubar o segundo.
   */
  dismiss: (panel: Exclude<Panel, null>) => void;
  /**
   * A seção de hero da página atual, ou `null`. Quem registra é o <HeroMarker />
   * de dentro da própria hero: o header não pode procurá-la sozinho porque ele
   * hidrata antes de a página chegar.
   */
  hero: HTMLElement | null;
  setHero: (el: HTMLElement | null) => void;
};

const Context = createContext<LojaContext | null>(null);

export function useLoja(): LojaContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useLoja precisa estar dentro de <LojaProvider>.");
  return ctx;
}

const money = (amount: number, currencyCode: string): Money => ({ amount, currencyCode });

function recount(cart: Cart, lines: CartLine[]): Cart {
  return {
    ...cart,
    lines,
    totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: money(
      lines.reduce((n, l) => n + l.totalPrice.amount, 0),
      cart.subtotal.currencyCode,
    ),
  };
}

function optimisticAdd(cart: Cart | null, draft: CartDraft): Cart {
  const base: Cart = cart ?? {
    id: "",
    checkoutUrl: "",
    totalQuantity: 0,
    lines: [],
    subtotal: money(0, draft.unitPrice.currencyCode),
    discountCodes: [],
  };
  const existing = base.lines.find((l) => l.variantId === draft.variantId);
  const lines = existing
    ? base.lines.map((l) =>
        l === existing
          ? { ...l, quantity: l.quantity + draft.quantity, totalPrice: money(l.unitPrice.amount * (l.quantity + draft.quantity), l.unitPrice.currencyCode) }
          : l,
      )
    : [
        ...base.lines,
        {
          id: `otimista-${draft.variantId}`,
          quantity: draft.quantity,
          variantId: draft.variantId,
          variantTitle: draft.variantTitle,
          productHandle: draft.productHandle,
          productTitle: draft.productTitle,
          image: draft.image,
          unitPrice: draft.unitPrice,
          totalPrice: money(draft.unitPrice.amount * draft.quantity, draft.unitPrice.currencyCode),
          selectedOptions: draft.selectedOptions,
        },
      ];
  return recount(base, lines);
}

function optimisticQuantity(cart: Cart, lineId: string, quantity: number): Cart {
  const lines = cart.lines
    .map((l) => (l.id === lineId ? { ...l, quantity, totalPrice: money(l.unitPrice.amount * quantity, l.unitPrice.currencyCode) } : l))
    .filter((l) => l.quantity > 0);
  return recount(cart, lines);
}

export function LojaProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [hero, setHero] = useState<HTMLElement | null>(null);

  // A resposta que vale é a da operação mais recente; resposta velha não
  // sobrescreve uma tela que já andou.
  const seq = useRef(0);
  const cartRef = useRef<Cart | null>(null);
  cartRef.current = cart;

  useEffect(() => {
    let alive = true;
    loadCart()
      .then((loaded) => {
        if (alive && seq.current === 0) setCart(loaded);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const settle = useCallback(async (mine: number, run: () => Promise<{ ok: true; cart: Cart | null } | { ok: false; message: string }>) => {
    setPending((n) => n + 1);
    try {
      const result = await run();
      if (result.ok) {
        if (mine === seq.current) setCart(result.cart);
        return true;
      }
      setError(result.message);
      // desfaz o otimismo com o estado real
      if (mine === seq.current) setCart(await loadCart());
      return false;
    } catch {
      setError("Não foi possível atualizar a sacola. Tente de novo.");
      if (mine === seq.current) setCart(await loadCart());
      return false;
    } finally {
      setPending((n) => n - 1);
    }
  }, []);

  const add = useCallback(
    (draft: CartDraft) => {
      const mine = ++seq.current;
      setError(null);
      setCart(optimisticAdd(cartRef.current, draft));
      setPanel("cart");
      track.addToCart({ handle: draft.productHandle, title: draft.productTitle, variantTitle: draft.variantTitle, price: draft.unitPrice, quantity: draft.quantity });
      return settle(mine, () => addLine(draft.variantId, draft.quantity));
    },
    [settle],
  );

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      const current = cartRef.current;
      if (!current) return;
      const mine = ++seq.current;
      setError(null);
      setCart(optimisticQuantity(current, lineId, quantity));
      await settle(mine, () => setLineQuantity(lineId, quantity));
    },
    [settle],
  );

  const applyCode = useCallback(
    (code: string) => {
      const mine = ++seq.current;
      setError(null);
      return settle(mine, () => applyDiscount(code));
    },
    [settle],
  );

  const value = useMemo<LojaContext>(
    () => ({
      cart,
      count: cart?.totalQuantity ?? 0,
      ready,
      busy: pending > 0,
      error,
      dismissError: () => setError(null),
      add,
      setQuantity,
      applyCode,
      panel,
      open: setPanel,
      close: () => setPanel(null),
      dismiss: (name) => setPanel((current) => (current === name ? null : current)),
      hero,
      setHero,
    }),
    [cart, ready, pending, error, add, setQuantity, applyCode, panel, hero],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
