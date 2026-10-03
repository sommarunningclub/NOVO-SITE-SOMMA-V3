import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";
import type { CategoryLink, HomeContent, ProductSummary } from "@/lib/shopify/types";
import { formatMonth } from "../../_lib/format";
import { Lines } from "../Lines";
import { ProductCard } from "../ProductCard";
import { ShopImg } from "../ShopImg";

/**
 * Momentos editoriais da home. Cada um é um Server Component sem estado: o
 * movimento é declarado por `data-reveal` e ligado pelo MotionRoot.
 */

/** As linhas que a marca já estampa por dentro das peças. */
const COORDS = "15°48'06.8\"S 47°54'14.5\"W";

export function Manifesto({ lines }: { lines: string[] }) {
  return (
    <section className="lj-section lj-dark lj-manifesto" aria-label="Manifesto">
      <p className="lj-label lj-label--soft">Manifesto</p>
      <h2 className="lj-display lj-display--l" data-reveal="lines">
        <Lines lines={lines} />
      </h2>
      <div className="lj-manifesto__foot">
        <p className="lj-annot">
          Somma Running Club
          <br />
          Together on Saturdays
        </p>
        <p className="lj-label lj-label--soft">Sáb 07:00 / Parque da Cidade / E10</p>
      </div>
    </section>
  );
}

/** Índice de categorias como sumário de revista: tipografia grande, uma linha por categoria. */
export function CategoryIndex({ categories }: { categories: CategoryLink[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="lj-section" aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo" className="lj-label">
        Shop por categoria
      </h2>
      <nav className="lj-cats" aria-label="Categorias">
        {categories.map((category, i) => (
          <Link key={category.handle} href={ROUTES.collection(category.handle)} className="lj-cats__item">
            <span className="lj-label lj-cats__index">{String(i + 1).padStart(2, "0")}</span>
            <span className="lj-display lj-cats__name">{category.title}</span>
            <span className="lj-label lj-cats__count">
              {String(category.count).padStart(2, "0")} {category.count === 1 ? "peça" : "peças"}
            </span>
            {category.image ? <ShopImg image={category.image} alt="" sizes="84px" className="lj-cats__thumb" /> : null}
          </Link>
        ))}
      </nav>
    </section>
  );
}

export function ClubBlock({ club }: { club: HomeContent["club"] }) {
  return (
    <section className="lj-section lj-dark" id="club" aria-labelledby="club-titulo">
      <div className="lj-club">
        <div className="lj-club__media" data-reveal="image" data-parallax="8">
          <ShopImg image={club.image} sizes="(min-width: 60rem) 40vw, 100vw" />
        </div>
        <div className="lj-club__text">
          <div className="lj-stack lj-stack--l">
            <p className="lj-label lj-label--soft">The Club</p>
            <h2 id="club-titulo" className="lj-display lj-display--m" data-reveal="lines">
              <Lines lines={club.headline} />
            </h2>
            <p className="lj-lead" style={{ maxWidth: "32.5rem" }}>
              {club.text}
            </p>
          </div>
          <div className="lj-stack lj-stack--m">
            <dl className="lj-facts lj-annot">
              <div>
                <dt>Dia</dt>
                <dd>Sábado</dd>
              </div>
              <div>
                <dt>Hora</dt>
                <dd>07:00</dd>
              </div>
              <div>
                <dt>Onde</dt>
                <dd>Parque da Cidade, E10</dd>
              </div>
              <div>
                <dt>Cidade</dt>
                <dd>Brasília, 061</dd>
              </div>
              <div>
                <dt>Coordenadas</dt>
                <dd>{COORDS}</dd>
              </div>
            </dl>
            <Link className="lj-link" href={ROUTES.club}>
              Conheça o clube <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Peças de arquivo na home: memória do clube, com o estado real de cada uma. */
export function ArchiveTeaser({ products, total }: { products: ProductSummary[]; total: number }) {
  if (products.length === 0) return null;
  return (
    <section className="lj-section" id="archive" aria-labelledby="archive-titulo">
      <div className="lj-section__head">
        <div className="lj-stack lj-stack--s">
          <p className="lj-label">Drops anteriores</p>
          <h2 id="archive-titulo" className="lj-display lj-display--l" data-reveal="lines">
            <Lines lines={["Archive"]} dot={false} />
          </h2>
        </div>
        <div className="lj-section__aside">
          <p className="lj-lead">Drops passados continuam aqui. O que esgotou vira registro. O que sobrou é última chance.</p>
        </div>
      </div>
      <div className="lj-grid lj-grid--4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            note={formatMonth(product.createdAt) ?? undefined}
            sizes="(min-width: 64rem) 24vw, (min-width: 48rem) 33vw, 50vw"
          />
        ))}
      </div>
      <p style={{ marginTop: "2.5rem" }}>
        <Link className="lj-link" href={ROUTES.archive}>
          Ver o archive completo ({total}) <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
