import { HANDLES, getCategories, getCollection, getCurrentDrop, getHome, loadStore } from "@/lib/shopify";
import { DropAccess } from "./_components/home/DropAccess";
import { DropFeature } from "./_components/home/DropFeature";
import { ArchiveTeaser, CategoryIndex, ClubBlock, Manifesto } from "./_components/home/Editorial";
import { HeroTribal } from "./_components/home/HeroTribal";
import { LookbookRail } from "./_components/home/LookbookRail";
import { Page } from "./_components/Page";
import { StoreUnavailable } from "./_components/StoreUnavailable";

// Mesmo valor de REVALIDATE.catalog (lib/shopify/config.ts). O Next exige literal aqui.
export const revalidate = 300;

/** Quantas peças entram na home em cada trilho; o resto mora na coleção. */
const DROP_PREVIEW = 4;
const ARCHIVE_PREVIEW = 4;

/**
 * Home como flagship: marca, drop, manifesto, categorias, lookbook, clube,
 * arquivo e cadastro. A ordem alterna momento comercial e momento cultural
 * para a página não virar produto, produto, produto, rodapé.
 */
export default async function LojaHome() {
  const data = await loadStore(async () => {
    const [home, drop, categories, archive] = await Promise.all([
      getHome(),
      getCurrentDrop(),
      getCategories(),
      getCollection(HANDLES.archive),
    ]);
    const dropCollection = drop?.collectionHandle ? await getCollection(drop.collectionHandle) : null;
    return { ...home, drop, categories, archive, dropCollection };
  });
  if (!data) {
    return (
      <Page>
        <StoreUnavailable />
      </Page>
    );
  }
  const { content, lookbook, drop, categories, archive, dropCollection } = data;

  return (
    <Page hero>
      <HeroTribal hero={content.hero} drop={drop} />
      {/* Embaixo do papel: sobe por cima da hero enquanto ela queima (loja.css, HeroFire). */}
      <div className="lj-under">
        {drop && dropCollection ? (
          <DropFeature
            drop={drop}
            products={dropCollection.products.slice(0, DROP_PREVIEW)}
            total={dropCollection.products.length}
            campaign={drop.heroImage}
          />
        ) : null}
        <Manifesto lines={content.manifesto} />
        <CategoryIndex categories={categories} />
        {lookbook ? <LookbookRail lookbook={lookbook} /> : null}
        <ClubBlock club={content.club} />
        <ArchiveTeaser products={archive?.products.slice(0, ARCHIVE_PREVIEW) ?? []} total={archive?.products.length ?? 0} />
        <DropAccess content={content.newsletter} />
      </div>
    </Page>
  );
}
