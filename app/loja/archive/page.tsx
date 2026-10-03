import type { Metadata } from "next";
import Link from "next/link";
import { HANDLES, ROUTES, getCollection, getHome, loadStore } from "@/lib/shopify";
import { DropAccess } from "../_components/home/DropAccess";
import { Lines } from "../_components/Lines";
import { ProductCard } from "../_components/ProductCard";
import { StoreUnavailable } from "../_components/StoreUnavailable";
import { Page } from "../_components/Page";
import { formatMonth } from "../_lib/format";

// Mesmo valor de REVALIDATE.catalog (lib/shopify/config.ts). O Next exige literal aqui.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Archive",
  description: "Drops anteriores do SOMMA Club: peças esgotadas e últimas unidades. O que o clube já vestiu.",
  alternates: { canonical: ROUTES.archive },
};

/**
 * Archive: a memória dos drops. Peça esgotada continua aqui como registro, com
 * o estado real dela; o que ainda tem estoque pode ser comprado.
 */
export default async function ArchivePage() {
  const data = await loadStore(() => Promise.all([getCollection(HANDLES.archive), getHome()]));
  if (!data) {
    return (
      <Page>
        <StoreUnavailable />
      </Page>
    );
  }
  const [archive, home] = data;
  const products = archive?.products ?? [];

  return (
    <Page>
      <header className="lj-plp-head">
        <div className="lj-stack lj-stack--m">
          <nav aria-label="Você está em">
            <ol className="lj-crumbs lj-label">
              <li>
                <Link href={ROUTES.home}>Loja</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Archive</li>
            </ol>
          </nav>
          <h1 className="lj-display lj-display--xl" data-reveal="lines">
            <Lines lines={["Archive"]} dot={false} />
          </h1>
        </div>
        <p className="lj-lead" style={{ flex: "0 1 27rem" }}>
          Drops passados continuam aqui. O que esgotou vira registro. O que sobrou é última chance.
        </p>
      </header>

      <section className="lj-plp" aria-label={`${products.length} peças de arquivo`}>
        {products.length > 0 ? (
          <div className="lj-grid lj-grid--4">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                note={formatMonth(product.createdAt) ?? undefined}
                priority={i < 4}
                sizes="(min-width: 64rem) 24vw, (min-width: 48rem) 33vw, 50vw"
              />
            ))}
          </div>
        ) : (
          <div className="lj-empty">
            <p className="lj-display lj-display--s">O arquivo ainda está vazio.</p>
            <Link className="lj-btn" href={ROUTES.shop}>
              Ver o que está à venda
              <span className="lj-btn__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>

      <DropAccess content={home.content.newsletter} origem="archive" />
    </Page>
  );
}
