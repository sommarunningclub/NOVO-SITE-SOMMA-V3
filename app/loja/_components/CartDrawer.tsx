"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES } from "@/lib/shopify/handles";
import type { ProductSummary } from "@/lib/shopify/types";
import { suggestForCart } from "../_actions/cart";
import { track } from "../_lib/analytics";
import { formatMoney } from "../_lib/format";
import { useLoja } from "./LojaProvider";
import { QuickAdd } from "./QuickAdd";
import { ShopImg } from "./ShopImg";
import { useDialog } from "./useDialog";

/**
 * Sacola: gaveta lateral sobre o carrinho da Shopify. Mudança de quantidade e
 * remoção aparecem na hora (otimista); o subtotal que vale é o que a Shopify
 * devolve. O checkout é o da Shopify, pela `checkoutUrl` do carrinho.
 */
export function CartDrawer() {
  const { cart, count, ready, busy, error, dismissError, setQuantity, applyCode, panel, close, dismiss } = useLoja();
  const open = panel === "cart";
  const ref = useDialog(open);
  const [suggestion, setSuggestion] = useState<ProductSummary | null>(null);

  const lines = cart?.lines ?? [];
  const handles = lines.map((l) => l.productHandle).join(",");

  // uma sugestão só, e só com a gaveta aberta
  useEffect(() => {
    if (!open || !handles) {
      setSuggestion(null);
      return;
    }
    let alive = true;
    suggestForCart(handles.split(",")).then((product) => {
      if (alive) setSuggestion(product);
    });
    return () => {
      alive = false;
    };
  }, [open, handles]);

  useEffect(() => {
    if (open && cart) track.viewCart(cart);
    // dispara na abertura, não a cada mudança de linha
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="lj-dialog lj-drawer"
      aria-labelledby="sacola-titulo"
      onClose={() => dismiss("cart")}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="lj-drawer__panel">
        <div className="lj-drawer__head">
          <h2 id="sacola-titulo" className="lj-label">
            Sacola ({count})
          </h2>
          <button type="button" className="lj-panel__close" onClick={close}>
            Fechar
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m3 3 12 12M15 3 3 15" />
            </svg>
          </button>
        </div>

        <div className="lj-drawer__body">
          {error ? (
            <p className="lj-drawer__alert" role="alert">
              <span>{error}</span>
              <button type="button" onClick={dismissError}>
                Ok
              </button>
            </p>
          ) : null}

          {lines.length === 0 ? (
            <div className="lj-drawer__empty">
              <p className="lj-display lj-display--s">{ready ? "Sacola vazia." : "Abrindo a sacola."}</p>
              {ready ? (
                <Link className="lj-btn" href={ROUTES.shop} onClick={close}>
                  Ver os produtos
                  <span className="lj-btn__arrow" aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="lj-lines">
              {lines.map((line) => (
                <li key={line.id} className="lj-line-item">
                  <div className="lj-line-item__thumb">
                    {line.image ? <ShopImg image={line.image} alt="" sizes="88px" /> : null}
                  </div>
                  <div className="lj-line-item__body">
                    <div>
                      <div className="lj-line-item__top">
                        <Link href={ROUTES.product(line.productHandle)} onClick={close}>
                          {line.productTitle}
                        </Link>
                        <span>{formatMoney(line.totalPrice)}</span>
                      </div>
                      {line.variantTitle !== "Único" ? <p className="lj-line-item__variant">Tamanho {line.variantTitle}</p> : null}
                    </div>
                    <div className="lj-line-item__bottom">
                      <div className="lj-stepper" role="group" aria-label={`Quantidade de ${line.productTitle}`}>
                        <button type="button" aria-label="Diminuir" onClick={() => void setQuantity(line.id, line.quantity - 1)}>
                          −
                        </button>
                        <output aria-live="polite">{line.quantity}</output>
                        <button type="button" aria-label="Aumentar" onClick={() => void setQuantity(line.id, line.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="lj-textbtn"
                        onClick={() => {
                          track.removeFromCart(line);
                          void setQuantity(line.id, 0);
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {suggestion ? (
            <div className="lj-suggest">
              <p className="lj-label">Complete the uniform</p>
              <div className="lj-suggest__row">
                {suggestion.image ? (
                  <div className="lj-shoplook__thumb">
                    <ShopImg image={suggestion.image} alt="" sizes="58px" />
                  </div>
                ) : null}
                <div className="lj-shoplook__text" style={{ flex: 1 }}>
                  <Link href={ROUTES.product(suggestion.handle)} onClick={close}>
                    {suggestion.title}
                  </Link>
                  <div>{formatMoney(suggestion.price)}</div>
                </div>
                <QuickAdd product={suggestion} inline />
              </div>
            </div>
          ) : null}
        </div>

        {lines.length > 0 && cart ? (
          <div className="lj-drawer__foot">
            <details className="lj-coupon">
              <summary className="lj-label">
                <span>{cart.discountCodes[0] ? `Cupom ${cart.discountCodes[0].code}` : "Tem cupom?"}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = String(new FormData(e.currentTarget).get("cupom") ?? "");
                  void applyCode(code);
                }}
              >
                <label htmlFor="sacola-cupom" className="lj-sr">
                  Código do cupom
                </label>
                <input id="sacola-cupom" name="cupom" autoComplete="off" autoCapitalize="characters" defaultValue={cart.discountCodes[0]?.code ?? ""} />
                <button type="submit" className="lj-btn lj-btn--sm lj-btn--ghost" disabled={busy}>
                  Aplicar
                </button>
              </form>
            </details>

            <p className="lj-total">
              <span>Subtotal</span>
              <span>{formatMoney(cart.subtotal)}</span>
            </p>
            <p className="lj-fineprint">Frete e descontos são calculados na finalização.</p>

            {cart.checkoutUrl ? (
              <a className="lj-btn lj-btn--accent lj-btn--lg lj-btn--block" href={cart.checkoutUrl} aria-disabled={busy} onClick={() => track.beginCheckout(cart)}>
                Finalizar compra
                <span className="lj-btn__arrow" aria-hidden="true">→</span>
              </a>
            ) : (
              <p className="lj-fineprint" role="note">
                Prévia local: a finalização abre quando a loja estiver ligada à Shopify.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
