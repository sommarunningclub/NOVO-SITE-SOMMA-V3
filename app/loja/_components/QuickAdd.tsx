"use client";

import { useState } from "react";
import type { ProductSummary, ProductVariant } from "@/lib/shopify/types";
import { useLoja } from "./LojaProvider";

/**
 * Compra rápida no card.
 *
 * Desktop com mouse: os tamanhos sobem no hover ou no foco. Toque: um botão
 * "+" sempre visível abre os tamanhos. Peça de tamanho único entra direto.
 * Nenhuma ação depende de hover nem de gesto escondido.
 * `inline` é a versão em linha (lookbook, sugestões): sempre o botão "+".
 */
export function QuickAdd({ product, inline = false }: { product: ProductSummary; inline?: boolean }) {
  const { add } = useLoja();
  const [open, setOpen] = useState(false);

  if (!product.availableForSale) return null;

  const single = product.variants.length === 1 ? product.variants[0] : null;

  const pick = (variant: ProductVariant) => {
    setOpen(false);
    void add({
      variantId: variant.id,
      quantity: 1,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: variant.title,
      image: product.image,
      unitPrice: variant.price,
      selectedOptions: variant.selectedOptions,
    });
  };

  return (
    <div className={inline ? "lj-quick lj-quick--inline" : "lj-quick"} data-open={open}>
      <button
        type="button"
        className="lj-quick__open"
        aria-label={single ? `Adicionar ${product.title} à sacola` : `Escolher tamanho de ${product.title}`}
        aria-expanded={single ? undefined : open}
        onClick={() => (single ? pick(single) : setOpen(true))}
      >
        +
      </button>

      <div className="lj-quick__sizes" role="group" aria-label={`Adicionar ${product.title} à sacola`}>
        {single ? (
          <button type="button" onClick={() => pick(single)}>
            Adicionar à sacola
          </button>
        ) : (
          <>
            <span className="lj-quick__label">Adicionar tamanho</span>
            {product.variants.map((variant) => (
              <button key={variant.id} type="button" disabled={!variant.availableForSale} onClick={() => pick(variant)}>
                {variant.title}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
