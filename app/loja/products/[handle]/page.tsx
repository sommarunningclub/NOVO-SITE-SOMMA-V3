import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ROUTES, getHome, getProduct, getRecommendations, loadStore } from "@/lib/shopify";
import type { Product } from "@/lib/shopify";
import { SommaSymbol } from "../../_components/brand/Logo";
import { DropAccess } from "../../_components/home/DropAccess";
import { ProductCard } from "../../_components/ProductCard";
import { ProductBuy } from "../../_components/product/ProductBuy";
import { ProductGallery } from "../../_components/product/ProductGallery";
import { ShopImg } from "../../_components/ShopImg";
import { StoreUnavailable } from "../../_components/StoreUnavailable";
import { Page } from "../../_components/Page";
import { descriptionParagraphs, formatMoney, formatMonth, jsonLdString } from "../../_lib/format";

// Mesmo valor de REVALIDATE.product (lib/shopify/config.ts): estoque muda mais rápido que o resto.
export const revalidate = 60;

type Props = { params: Promise<{ handle: string }> };

/**
 * Lista vazia de propósito: nenhuma peça é gerada no build (o build não
 * depende da Shopify), mas cada uma é gerada na primeira visita e fica em
 * cache pelo tempo de `revalidate`, em vez de ser renderizada a cada acesso.
 */
export function generateStaticParams() {
  return [];
}

const SITE = "https://sommaclub.com.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const loaded = await loadStore(async () => ({ product: await getProduct(handle) }));
  if (!loaded) return {};
  // aqui, e não só na página: antes do streaming o status HTTP ainda pode ser 404
  if (!loaded.product) notFound();
  const { product } = loaded;
  const title = product.seo.title || product.title;
  const description = product.seo.description || product.description.slice(0, 160) || undefined;
  return {
    title,
    description,
    alternates: { canonical: ROUTES.product(handle) },
    openGraph: {
      title,
      description,
      images: product.image ? [{ url: product.image.url, width: product.image.width, height: product.image.height }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Dados estruturados só com o que a Shopify afirma: preço, moeda e disponibilidade reais. */
function jsonLd(product: Product) {
  const url = `${SITE}${ROUTES.product(product.handle)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description || undefined,
      image: product.images.map((i) => i.url),
      url,
      brand: { "@type": "Brand", name: "SOMMA Club" },
      offers: product.variants.map((v) => ({
        "@type": "Offer",
        name: v.title,
        price: v.price.amount.toFixed(2),
        priceCurrency: v.price.currencyCode,
        availability: v.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Loja", item: `${SITE}${ROUTES.home}` },
        ...(product.drop
          ? [{ "@type": "ListItem", position: 2, name: `Drop ${product.drop.code}`, item: `${SITE}${ROUTES.collection(product.drop.handle)}` }]
          : []),
        { "@type": "ListItem", position: product.drop ? 3 : 2, name: product.title, item: url },
      ],
    },
  ];
}

/** "Complete the uniform" (o que usar junto) e "You may also like" (parecidos). */
async function Recommendations({ product, intent }: { product: Product; intent: "RELATED" | "COMPLEMENTARY" }) {
  const items = await getRecommendations(product, intent).catch(() => []);
  if (items.length === 0) return null;

  if (intent === "COMPLEMENTARY") {
    return (
      <section className="lj-section lj-white" aria-labelledby="completa-titulo">
        <div className="lj-pair">
          <div className="lj-stack lj-stack--s">
            <p className="lj-label">Combina com</p>
            <h2 id="completa-titulo" className="lj-slab lj-slab--m">
              Complete the uniform
            </h2>
          </div>
          <div className="lj-grid">
            {items.slice(0, 2).map((item) => (
              <ProductCard key={item.id} product={item} sizes="(min-width: 60rem) 32vw, 50vw" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lj-section" aria-labelledby="parecidos-titulo">
      <div className="lj-section__head">
        <h2 id="parecidos-titulo" className="lj-display lj-display--s">
          You may also like
        </h2>
      </div>
      <div className="lj-grid lj-grid--4">
        {items.slice(0, 4).map((item) => (
          <ProductCard key={item.id} product={item} sizes="(min-width: 64rem) 24vw, (min-width: 48rem) 33vw, 50vw" />
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const loaded = await loadStore(async () => ({ product: await getProduct(handle) }));
  if (!loaded) {
    return (
      <Page>
        <StoreUnavailable />
      </Page>
    );
  }
  const { product } = loaded;
  if (!product) notFound();

  const soldOut = !product.availableForSale;
  const month = formatMonth(product.createdAt);
  const paragraphs = descriptionParagraphs(product.descriptionHtml);
  const model = product.model;
  const modelLine =
    model && (model.heightCm || model.size)
      ? [model.heightCm ? `${(model.heightCm / 100).toFixed(2).replace(".", ",")} m` : null, model.weightKg ? `${model.weightKg} kg` : null, model.size ? `veste ${model.size}` : null]
          .filter(Boolean)
          .join(", ")
      : null;
  const newsletter = soldOut ? (await getHome()).content.newsletter : null;

  return (
    <Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd(product)) }} />

      <div className="lj-pdp">
        <nav className="lj-pdp__crumbs" aria-label="Você está em">
          <ol className="lj-crumbs lj-label">
            <li>
              <Link href={ROUTES.home}>Loja</Link>
            </li>
            <li aria-hidden="true">/</li>
            {product.drop && !soldOut ? (
              <li>
                <Link href={ROUTES.collection(product.drop.handle)}>Drop {product.drop.code}</Link>
              </li>
            ) : (
              <li>
                <Link href={soldOut || product.keepInArchive ? ROUTES.archive : ROUTES.shop}>{soldOut || product.keepInArchive ? "Archive" : "Shop"}</Link>
              </li>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page">{product.title}</li>
          </ol>
        </nav>

        <ProductGallery images={product.images} title={product.title} />

        <div className="lj-pdp__info">
          <div className="lj-stack lj-stack--s">
            <p className="lj-kicker lj-label">
              <SommaSymbol className="lj-kicker__symbol" />
              <span>{product.drop ? `Drop ${product.drop.code}` : product.keepInArchive ? "Archive" : "SOMMA Club"}</span>
              {month ? <span className="lj-label--soft">{month}</span> : null}
              {!soldOut && product.badge ? <span className="lj-tag">{product.badge === "NEW" ? "Novo" : "Limited"}</span> : null}
            </p>
            <h1 className="lj-display lj-pdp__title">{product.title}</h1>
            {soldOut ? null : (
              <p className="lj-pdp__price">
                {product.compareAtPrice ? <s>{formatMoney(product.compareAtPrice)}</s> : null}
                {formatMoney(product.price)}
              </p>
            )}
          </div>

          {product.colorSiblings.length > 1 ? (
            <div className="lj-pdp__block lj-pdp__block--rule">
              <p className="lj-label">
                Cor{product.color ? <span className="lj-label--soft">: {product.color.name}</span> : null}
              </p>
              <div className="lj-swatches">
                {product.colorSiblings.map((sibling) => (
                  <Link
                    key={sibling.handle}
                    href={ROUTES.product(sibling.handle)}
                    aria-label={sibling.color?.name ?? sibling.title}
                    aria-current={sibling.current ? "true" : undefined}
                    scroll={false}
                  >
                    {sibling.image ? <ShopImg image={sibling.image} alt="" sizes="56px" /> : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {soldOut ? (
            // Esgotado não é erro: a peça vira registro de arquivo, sem botão desligado.
            <>
              <div className="lj-soldout">
                <p className="lj-display lj-soldout__word">
                  Sold out<span className="lj-dot">.</span>
                </p>
                <p className="lj-annot">
                  Peça de arquivo
                  {month ? (
                    <>
                      <br />
                      {month}
                    </>
                  ) : null}
                </p>
              </div>
              <div className="lj-hero__actions">
                <a className="lj-btn" href="#drop-access-titulo">
                  Entrar no Drop Access
                  <span className="lj-btn__arrow" aria-hidden="true">→</span>
                </a>
                <Link className="lj-link" href={ROUTES.shop}>
                  Ver o que está à venda
                </Link>
              </div>
            </>
          ) : (
            <ProductBuy product={product} />
          )}

          {product.fit || modelLine ? (
            <dl className="lj-specs">
              {product.fit ? (
                <div>
                  <dt className="lj-label">Caimento</dt>
                  <dd>{product.fit}</dd>
                </div>
              ) : null}
              {modelLine ? (
                <div>
                  <dt className="lj-label">Modelo</dt>
                  <dd>{modelLine}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </div>

      {product.storyHtml ? (
        <section className="lj-section lj-dark" aria-labelledby="historia-titulo">
          <div className="lj-story">
            <div className="lj-stack lj-stack--m">
              <h2 id="historia-titulo" className="lj-label lj-label--soft">
                Why we made it
              </h2>
              <p className="lj-annot">
                Somma Running Club
                <br />
                Together on Saturdays
              </p>
            </div>
            <div className="lj-story__text" dangerouslySetInnerHTML={{ __html: product.storyHtml }} />
          </div>
        </section>
      ) : null}

      {paragraphs.length > 0 ? (
        <section className="lj-section" aria-label="Detalhes da peça">
          <div className="lj-details">
            <div>
              <h2 className="lj-label">Sobre a peça</h2>
              <div className="lj-prose">
                {paragraphs.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </div>
            <div>
              <h2 className="lj-label">061</h2>
              <p className="lj-annot">
                {product.drop ? (
                  <>
                    Drop {product.drop.code} / {product.drop.title}
                    <br />
                  </>
                ) : null}
                {month ? (
                  <>
                    {month}
                    <br />
                  </>
                ) : null}
                Brasília
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <Suspense fallback={null}>
        <Recommendations product={product} intent="COMPLEMENTARY" />
      </Suspense>
      <Suspense fallback={null}>
        <Recommendations product={product} intent="RELATED" />
      </Suspense>

      {newsletter ? <DropAccess content={newsletter} origem="pdp" /> : null}
    </Page>
  );
}
