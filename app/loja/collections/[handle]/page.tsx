import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { HANDLES, ROUTES, getCollection, getHome, loadStore } from "@/lib/shopify";
import type { Collection } from "@/lib/shopify";
import { SommaSymbol } from "../../_components/brand/Logo";
import { CollectionView } from "../../_components/collection/CollectionView";
import { ShopImg } from "../../_components/ShopImg";
import { StoreUnavailable } from "../../_components/StoreUnavailable";
import { Page } from "../../_components/Page";
import { formatMonth, jsonLdString } from "../../_lib/format";

// Mesmo valor de REVALIDATE.catalog (lib/shopify/config.ts). O Next exige literal aqui.
export const revalidate = 300;

type Props = { params: Promise<{ handle: string }> };

/**
 * Lista vazia de propósito: nenhuma coleção é gerada no build (o build não
 * depende da Shopify), mas cada uma é gerada na primeira visita e fica em
 * cache pelo tempo de `revalidate`, em vez de ser renderizada a cada acesso.
 */
export function generateStaticParams() {
  return [];
}

const SITE = "https://sommaclub.com.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const loaded = await loadStore(async () => ({ collection: await getCollection(handle) }));
  if (!loaded) return {};
  // aqui, e não só na página: antes do streaming o status HTTP ainda pode ser 404
  if (!loaded.collection) notFound();
  const { collection } = loaded;
  const title = collection.drop ? `Drop ${collection.drop.code}: ${collection.drop.title}` : collection.title;
  const description = collection.drop?.description || collection.description || undefined;
  const image = collection.drop?.heroImage ?? collection.image ?? collection.products[0]?.image;
  return {
    title,
    description,
    alternates: { canonical: ROUTES.collection(handle) },
    openGraph: { title, description, images: image ? [{ url: image.url, width: image.width, height: image.height }] : undefined },
  };
}

function Crumbs({ collection }: { collection: Collection }) {
  return (
    <nav aria-label="Você está em">
      <ol className="lj-crumbs lj-label">
        <li>
          <Link href={ROUTES.home}>Loja</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{collection.drop ? `Drop ${collection.drop.code}` : collection.title}</li>
      </ol>
    </nav>
  );
}

/** Coleção de drop abre como campanha: nome em Elizeth, texto, ficha e foto. */
function DropHero({ collection }: { collection: Collection & { drop: NonNullable<Collection["drop"]> } }) {
  const { drop } = collection;
  const month = formatMonth(drop.releaseDate);
  return (
    <header className="lj-plp-hero">
      <div className="lj-plp-hero__text">
        <Crumbs collection={collection} />
        <div className="lj-stack lj-stack--m">
          <p className="lj-kicker lj-label">
            <SommaSymbol className="lj-kicker__symbol" />
            <span>Drop {drop.code}</span>
            <span className="lj-label--soft">061.{drop.code}</span>
          </p>
          <h1 className="lj-slab lj-slab--xl" data-reveal="split">
            {drop.title}
          </h1>
          {drop.description ? (
            <p className="lj-lead" style={{ maxWidth: "28.75rem" }}>
              {drop.description}
            </p>
          ) : null}
        </div>
        <dl className="lj-meta lj-annot">
          <div>
            <dt>Peças</dt>
            <dd>{collection.products.length}</dd>
          </div>
          {month ? (
            <div>
              <dt>Lançamento</dt>
              <dd>{month}</dd>
            </div>
          ) : null}
          <div>
            <dt>Origem</dt>
            <dd>Brasília, 061</dd>
          </div>
        </dl>
      </div>
      {drop.heroImage ? (
        <div className="lj-plp-hero__media" data-reveal="image">
          <ShopImg image={drop.heroImage} alt={drop.heroImage.altText ?? `Campanha do drop ${drop.title}`} sizes="(min-width: 60rem) 58vw, 100vw" priority />
        </div>
      ) : null}
    </header>
  );
}

function PlainHead({ collection }: { collection: Collection }) {
  return (
    <header className="lj-plp-head">
      <div className="lj-stack lj-stack--m">
        <Crumbs collection={collection} />
        <h1 className="lj-display lj-display--l">{collection.title}</h1>
      </div>
      {collection.description ? (
        <p className="lj-lead" style={{ flex: "0 1 27rem" }}>
          {collection.description}
        </p>
      ) : null}
    </header>
  );
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  // o arquivo tem página própria
  if (handle === HANDLES.archive) permanentRedirect(ROUTES.archive);

  const loaded = await loadStore(async () => {
    const collection = await getCollection(handle);
    // foto de lookbook no meio da grade: só nas coleções de drop
    const lookbook = collection?.drop ? (await getHome()).lookbook : null;
    return { collection, lookbook };
  });
  if (!loaded) {
    return (
      <Page>
        <StoreUnavailable />
      </Page>
    );
  }
  const { collection, lookbook } = loaded;
  if (!collection) notFound();

  const insert =
    lookbook && lookbook.images[0]
      ? {
          image: lookbook.images[0],
          label: [lookbook.title, lookbook.subtitle].filter(Boolean).join(" / "),
          caption: lookbook.products.map((p) => p.title).join(", "),
        }
      : null;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Loja", item: `${SITE}${ROUTES.home}` },
      { "@type": "ListItem", position: 2, name: collection.title, item: `${SITE}${ROUTES.collection(handle)}` },
    ],
  };

  return (
    <Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      {collection.drop ? <DropHero collection={{ ...collection, drop: collection.drop }} /> : <PlainHead collection={collection} />}
      <CollectionView
        products={collection.products}
        listName={collection.drop ? `Drop ${collection.drop.code}` : collection.title}
        showCodes={collection.drop !== null}
        insert={insert}
      />
      <aside className="lj-next" aria-label="A seguir">
        <div className="lj-stack lj-stack--s">
          <p className="lj-label lj-label--soft">A seguir</p>
          <Link href={ROUTES.archive} className="lj-display lj-display--l">
            Archive <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="lj-lead" style={{ flex: "0 1 22.5rem" }}>
          Drops anteriores, peças esgotadas e últimas unidades.
        </p>
      </aside>
    </Page>
  );
}
