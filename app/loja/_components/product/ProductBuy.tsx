"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import { track } from "../../_lib/analytics";
import { formatMoney } from "../../_lib/format";
import { useLoja } from "../LojaProvider";
import { useDialog } from "../useDialog";

/** Abaixo disto o tamanho escolhido mostra quantas unidades restam. */
const LOW_STOCK = 3;

/**
 * Bloco de compra da PDP: tamanho, estoque real do tamanho, botão e, no
 * celular, a barra fixa que aparece quando o botão principal sai da tela.
 * Tamanho é botão grande, nunca <select>. Nada aqui depende de hover.
 */
export function ProductBuy({ product }: { product: Product }) {
  const { add } = useLoja();
  const single = product.variants.length === 1 ? product.variants[0] : null;
  const [selected, setSelected] = useState<ProductVariant | null>(single);
  const [nudge, setNudge] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = useDialog(guideOpen);
  const mainButton = useRef<HTMLButtonElement>(null);
  const sizes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track.viewItem(product);
    // uma vez por peça
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // barra fixa: só depois que o botão principal ficou para cima da tela
  useEffect(() => {
    const el = mainButton.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const buy = () => {
    if (!selected) {
      setNudge(true);
      sizes.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      sizes.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
      return;
    }
    if (!selected.availableForSale) return;
    void add({
      variantId: selected.id,
      quantity: 1,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: selected.title,
      image: product.image,
      unitPrice: selected.price,
      selectedOptions: selected.selectedOptions,
    });
  };

  const left = selected?.quantityAvailable ?? null;
  const stock = !selected
    ? null
    : !selected.availableForSale
      ? { state: "out", text: `Esgotado no tamanho ${selected.title}` }
      : left !== null && left > 0 && left <= LOW_STOCK
        ? { state: "low", text: left === 1 ? "Última unidade neste tamanho" : `Últimas ${left} unidades neste tamanho` }
        : { state: "in", text: single ? "Em estoque" : `Em estoque no tamanho ${selected.title}` };

  const price = selected?.price ?? product.price;
  const label = !selected ? "Escolha o tamanho" : selected.availableForSale ? "Adicionar à sacola" : "Esgotado neste tamanho";

  return (
    <>
      {single ? null : (
        <div className="lj-pdp__block">
          <div className="lj-pdp__row lj-label">
            <span id="tamanho-rotulo">
              Tamanho{selected ? <span className="lj-label--soft">: {selected.title}</span> : null}
            </span>
            {product.sizeGuide ? (
              <button type="button" className="lj-textbtn" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
                Guia de tamanhos
              </button>
            ) : null}
          </div>
          <div ref={sizes} className="lj-sizes" role="group" aria-labelledby="tamanho-rotulo">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                aria-pressed={selected?.id === variant.id}
                data-available={variant.availableForSale}
                aria-label={variant.availableForSale ? variant.title : `${variant.title}, esgotado`}
                onClick={() => {
                  setSelected(variant);
                  setNudge(false);
                }}
              >
                {variant.title}
              </button>
            ))}
          </div>
          <p className="lj-stock" data-state={stock?.state ?? "in"} aria-live="polite">
            {stock ? (
              <>
                <i aria-hidden="true" />
                {stock.text}
              </>
            ) : nudge ? (
              "Escolha um tamanho para adicionar à sacola."
            ) : (
              " "
            )}
          </p>
        </div>
      )}

      {single && stock ? (
        <p className="lj-stock" data-state={stock.state}>
          <i aria-hidden="true" />
          {stock.text}
        </p>
      ) : null}

      <button
        ref={mainButton}
        type="button"
        className="lj-btn lj-btn--lg lj-btn--block"
        onClick={buy}
        aria-disabled={selected !== null && !selected.availableForSale}
      >
        <span>{label}</span>
        <span>
          {formatMoney(price)} <span className="lj-btn__arrow" aria-hidden="true">→</span>
        </span>
      </button>

      <div className="lj-buybar" data-visible={barVisible} aria-hidden={!barVisible}>
        <div className="lj-buybar__text">
          <strong>{product.title}</strong>
          <span>
            {selected && !single ? `${selected.title} · ` : ""}
            {formatMoney(price)}
          </span>
        </div>
        <button type="button" className="lj-btn" onClick={buy} tabIndex={barVisible ? 0 : -1}>
          {selected ? "Adicionar" : "Escolher tamanho"}
          <span className="lj-btn__arrow" aria-hidden="true">→</span>
        </button>
      </div>

      {product.sizeGuide ? (
        <dialog
          ref={guide}
          className="lj-dialog lj-sheet"
          aria-labelledby="guia-titulo"
          onClose={() => setGuideOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuideOpen(false);
          }}
        >
          <div className="lj-drawer__panel">
            <div className="lj-drawer__head">
              <h2 id="guia-titulo" className="lj-label">
                {product.sizeGuide.title}
              </h2>
              <button type="button" className="lj-panel__close" onClick={() => setGuideOpen(false)}>
                Fechar
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m3 3 12 12M15 3 3 15" />
                </svg>
              </button>
            </div>
            <div className="lj-drawer__body" style={{ paddingBlock: "1.25rem" }}>
              <div className="lj-table-wrap">
                <table className="lj-table">
                  <thead>
                    <tr>
                      {product.sizeGuide.rows[0].map((cell, i) => (
                        <th key={i} scope="col">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeGuide.rows.slice(1).map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, i) =>
                          i === 0 ? (
                            <th key={i} scope="row">
                              {cell}
                            </th>
                          ) : (
                            <td key={i}>{cell}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {product.sizeGuide.howToMeasure ? (
                <p className="lj-prose" style={{ marginTop: "1.5rem", whiteSpace: "pre-line" }}>
                  {product.sizeGuide.howToMeasure}
                </p>
              ) : null}
              {product.sizeGuide.fitNotes ? (
                <p className="lj-prose" style={{ marginTop: "1rem", whiteSpace: "pre-line" }}>
                  {product.sizeGuide.fitNotes}
                </p>
              ) : null}
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
