import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";
import type { Drop, ProductSummary, ShopImage } from "@/lib/shopify/types";
import { formatMonth, pieceCode } from "../../_lib/format";
import { SommaSymbol } from "../brand/Logo";
import { ProductCard } from "../ProductCard";
import { ShopImg } from "../ShopImg";

type Props = {
  drop: Drop;
  products: ProductSummary[];
  total: number;
  /** Foto de campanha do drop. Sem ela a seção vira só a grade de produtos. */
  campaign: ShopImage | null;
};

/**
 * O drop em cartaz entra como campanha, não como grade: nome em Elizeth, foto
 * de campanha de um lado e quatro peças isoladas do outro.
 */
export function DropFeature({ drop, products, total, campaign }: Props) {
  const href = drop.collectionHandle ? ROUTES.collection(drop.collectionHandle) : ROUTES.shop;
  const month = formatMonth(drop.releaseDate);

  return (
    <section className="lj-section" id="drop" aria-labelledby="drop-titulo">
      <div className="lj-section__head">
        <div className="lj-stack lj-stack--m">
          <p className="lj-kicker lj-label">
            <SommaSymbol className="lj-kicker__symbol" />
            <span>Drop {drop.code}</span>
            <span className="lj-label--soft">061.{drop.code}</span>
            {month ? <span className="lj-label--soft">{month}</span> : null}
          </p>
          <h2 id="drop-titulo" className="lj-slab lj-slab--xl" data-reveal="split">
            {drop.title}
          </h2>
        </div>
        <div className="lj-section__aside">
          {drop.description ? <p className="lj-lead">{drop.description}</p> : null}
          <Link className="lj-link" href={href}>
            Ver o drop completo ({total}) <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="lj-drop__body" data-campaign={campaign !== null}>
        {campaign ? (
          <figure className="lj-drop__campaign">
            <div className="lj-drop__campaign-media" data-reveal="image" data-parallax="6">
              <ShopImg image={campaign} alt={campaign.altText ?? `Campanha do drop ${drop.title}`} sizes="(min-width: 60rem) 40vw, 100vw" />
            </div>
            {campaign.altText ? <figcaption>{campaign.altText}</figcaption> : null}
          </figure>
        ) : null}
        <div className={campaign ? "lj-grid lj-drop__products" : "lj-grid lj-grid--4 lj-drop__products"}>
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              note={pieceCode(i)}
              sizes={campaign ? "(min-width: 60rem) 24vw, 50vw" : "(min-width: 64rem) 24vw, (min-width: 48rem) 33vw, 50vw"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
