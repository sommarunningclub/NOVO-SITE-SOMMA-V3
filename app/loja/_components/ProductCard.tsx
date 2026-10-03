import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";
import type { ProductSummary } from "@/lib/shopify/types";
import { formatMoney, stockState } from "../_lib/format";
import { QuickAdd } from "./QuickAdd";
import { ShopImg } from "./ShopImg";

type Props = {
  product: ProductSummary;
  /** `sizes` do <img>: quem monta a grade sabe a largura da coluna. */
  sizes: string;
  /** Primeira fileira da página: carrega sem lazy. */
  priority?: boolean;
  /** Anotação curta ao lado das cores: código editorial (061.008) ou mês do drop. */
  note?: string;
};

const STATUS = {
  "sold-out": "Sold out",
  "last-units": "Últimas unidades",
} as const;

/**
 * Card de produto. Não é um "card": sem caixa, sem sombra, sem raio. Foto,
 * nome, preço e o estado real da peça. Tudo o que aparece vem da Shopify:
 * selo é metafield, sold out e últimas unidades são estoque.
 */
export function ProductCard({ product, sizes, priority, note }: Props) {
  const state = stockState(product);
  const tag = state === "sold-out" ? null : product.badge === "NEW" ? "Novo" : product.badge === "LIMITED" ? "Limited" : null;
  const meta = [note, product.colorCount > 1 ? `${product.colorCount} cores` : null].filter(Boolean).join(" · ");

  return (
    <article className="lj-card" data-sold-out={state === "sold-out"} data-flip-id={product.handle}>
      <div className="lj-card__media">
        {product.image ? <ShopImg image={product.image} alt={product.title} sizes={sizes} priority={priority} /> : null}
        {product.hoverImage ? <ShopImg image={product.hoverImage} alt="" sizes={sizes} className="lj-card__hover" /> : null}
        {tag ? <span className="lj-tag lj-card__tag">{tag}</span> : null}
        <QuickAdd product={product} />
      </div>

      <div className="lj-card__info">
        <div className="lj-card__row">
          <h3 className="lj-card__title">
            <Link href={ROUTES.product(product.handle)}>{product.title}</Link>
          </h3>
          <span className="lj-card__price">
            {product.compareAtPrice ? <s>{formatMoney(product.compareAtPrice)}</s> : null}
            {formatMoney(product.price)}
          </span>
        </div>
        {meta || state !== "available" ? (
          <p className="lj-card__meta">
            {product.color?.hex ? <span className="lj-swatch" style={{ background: product.color.hex }} aria-hidden="true" /> : null}
            {meta ? <span>{meta}</span> : null}
            {state !== "available" ? (
              <span className={state === "last-units" ? "lj-tag" : "lj-label"} style={{ marginLeft: "auto" }}>
                {STATUS[state]}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </article>
  );
}
