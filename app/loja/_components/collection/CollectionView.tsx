"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProductSummary, ShopImage } from "@/lib/shopify/types";
import { track } from "../../_lib/analytics";
import { pieceCode } from "../../_lib/format";
import { gsap, prefersReducedMotion } from "../../_motion";
import { useDialog } from "../useDialog";
import { ProductCard } from "../ProductCard";
import { ShopImg } from "../ShopImg";

type SortKey = "destaque" | "novidades" | "menor-preco" | "maior-preco";

const SORTS: Record<SortKey, string> = {
  destaque: "Destaques",
  novidades: "Novidades",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
};

const DENSITIES = [2, 3, 4] as const;
type Density = (typeof DENSITIES)[number];

/** Ordem natural dos tamanhos; o que não está aqui vai para o fim, em ordem alfabética. */
const SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XGG", "EXGG"];

type Filters = { sizes: string[]; colors: string[]; available: boolean };
const NO_FILTERS: Filters = { sizes: [], colors: [], available: false };

type FlipModule = typeof import("gsap/Flip");

const sizeOf = (v: ProductSummary["variants"][number]) =>
  v.selectedOptions.find((o) => /tamanho|size/i.test(o.name))?.value ?? null;

function matches(product: ProductSummary, filters: Filters): boolean {
  if (filters.available && !product.availableForSale) return false;
  if (filters.colors.length && !(product.color && filters.colors.includes(product.color.name))) return false;
  if (filters.sizes.length) {
    // o tamanho só conta se estiver disponível: filtrar por M e cair numa peça sem M frustra
    const has = product.variants.some((v) => v.availableForSale && filters.sizes.includes(sizeOf(v) ?? ""));
    if (!has) return false;
  }
  return true;
}

function sortProducts(products: ProductSummary[], sort: SortKey): ProductSummary[] {
  if (sort === "destaque") return products;
  const list = [...products];
  if (sort === "novidades") list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "menor-preco") list.sort((a, b) => a.price.amount - b.price.amount);
  if (sort === "maior-preco") list.sort((a, b) => b.price.amount - a.price.amount);
  return list;
}

type Props = {
  products: ProductSummary[];
  /** Nome da lista para o analytics (view_item_list). */
  listName: string;
  /** Códigos editoriais 061.00N só fazem sentido quando a coleção é um drop. */
  showCodes?: boolean;
  /** Foto de lookbook inserida na grade. Só aparece na ordem padrão, sem filtro. */
  insert?: { image: ShopImage; label: string; caption: string } | null;
};

/**
 * Grade da coleção com filtro, ordenação e densidade, tudo no navegador.
 *
 * O catálogo é pequeno, então a coleção inteira já está na página e filtrar não
 * faz requisição. Isso deixa o GSAP Flip trabalhar: a grade é fotografada
 * antes da mudança e as peças que sobram deslizam para o novo lugar.
 * O estado vai para a URL para o link filtrado poder ser compartilhado.
 */
export function CollectionView({ products, listName, showCodes = false, insert = null }: Props) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>("destaque");
  const [density, setDensity] = useState<Density>(3);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sheet = useDialog(filtersOpen);

  const grid = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipModule["Flip"] | null>(null);
  const before = useRef<ReturnType<FlipModule["Flip"]["getState"]> | null>(null);

  // Flip só é baixado nesta página, e fora do caminho crítico
  useEffect(() => {
    let alive = true;
    import("gsap/Flip").then((mod) => {
      if (!alive) return;
      gsap.registerPlugin(mod.Flip);
      flip.current = mod.Flip;
    });
    return () => {
      alive = false;
    };
  }, []);

  // estado inicial a partir da URL (link compartilhado)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const list = (key: string) => (q.get(key) ?? "").split(",").filter(Boolean);
    const urlSort = q.get("ordem") as SortKey | null;
    const urlDensity = Number(q.get("grade"));
    setFilters({ sizes: list("tamanho"), colors: list("cor"), available: q.get("disponivel") === "1" });
    if (urlSort && urlSort in SORTS) setSort(urlSort);
    if (DENSITIES.includes(urlDensity as Density)) setDensity(urlDensity as Density);
    track.viewItemList(listName, products);
    // roda uma vez por coleção
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listName]);

  /** Fotografa a grade antes da mudança; o layout effect abaixo anima até o novo estado. */
  const change = (apply: () => void) => {
    if (flip.current && grid.current && !prefersReducedMotion()) {
      before.current = flip.current.getState(grid.current.querySelectorAll("[data-flip-id]"));
    }
    apply();
  };

  useLayoutEffect(() => {
    const state = before.current;
    before.current = null;
    if (!state || !flip.current || !grid.current) return;
    flip.current.from(state, {
      // inclui os cards que acabaram de entrar, para o onEnter valer para eles
      targets: grid.current.querySelectorAll("[data-flip-id]"),
      duration: 0.55,
      ease: "power3.inOut",
      absolute: true,
      // curto de propósito: a grade responde ao clique, não faz a pessoa esperar
      onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.15 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.2 }),
    });
  }, [filters, sort, density]);

  // espelha o estado na URL sem navegar
  useEffect(() => {
    const q = new URLSearchParams();
    if (filters.sizes.length) q.set("tamanho", filters.sizes.join(","));
    if (filters.colors.length) q.set("cor", filters.colors.join(","));
    if (filters.available) q.set("disponivel", "1");
    if (sort !== "destaque") q.set("ordem", sort);
    if (density !== 3) q.set("grade", String(density));
    const query = q.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters, sort, density]);

  const sizes = useMemo(() => {
    const all = new Set<string>();
    for (const p of products) for (const v of p.variants) {
      const size = sizeOf(v);
      if (size) all.add(size);
    }
    // "P babylook" ordena pelo P; entre iguais, o tamanho simples vem antes da modelagem
    const base = (s: string) => s.split(" ")[0].toUpperCase();
    const rank = (s: string) => (SIZE_ORDER.includes(base(s)) ? SIZE_ORDER.indexOf(base(s)) : SIZE_ORDER.length);
    const plain = (s: string) => (s.includes(" ") ? 1 : 0);
    return [...all].sort((a, b) => plain(a) - plain(b) || rank(a) - rank(b) || a.localeCompare(b, "pt-BR"));
  }, [products]);

  const colors = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const p of products) if (p.color) seen.set(p.color.name, p.color.hex);
    return [...seen].map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);
  const visible = sorted.filter((p) => matches(p, filters));
  const activeCount = filters.sizes.length + filters.colors.length + (filters.available ? 1 : 0);
  const pristine = activeCount === 0 && sort === "destaque";
  const hasFilters = sizes.length > 1 || colors.length > 1 || products.some((p) => !p.availableForSale);

  const toggle = (key: "sizes" | "colors", value: string) =>
    change(() =>
      setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] })),
    );

  return (
    <>
      <div className="lj-toolbar">
        <p className="lj-label" aria-live="polite" style={{ margin: 0 }}>
          {visible.length} {visible.length === 1 ? "produto" : "produtos"}
        </p>
        <div className="lj-toolbar__group">
          {hasFilters ? (
            <button type="button" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
              Filtrar{activeCount ? ` (${activeCount})` : " +"}
            </button>
          ) : null}
          <label>
            <span>Ordenar:</span>
            <select value={sort} onChange={(e) => change(() => setSort(e.target.value as SortKey))}>
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORTS[key]}
                </option>
              ))}
            </select>
          </label>
          <div className="lj-density" role="group" aria-label="Densidade da grade">
            {DENSITIES.map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} colunas`}
                aria-pressed={density === n}
                onClick={() => change(() => setDensity(n))}
              >
                {Array.from({ length: n }, (_, i) => (
                  <i key={i} />
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lj-plp">
        <div ref={grid} className="lj-plp__grid" data-density={density}>
          {sorted.map((product, i) => {
            const shown = matches(product, filters);
            return (
              <Fragment key={product.id}>
                {shown ? (
                  <ProductCard
                    product={product}
                    note={showCodes ? pieceCode(products.indexOf(product)) : undefined}
                    priority={i < 3}
                    sizes={density === 2 ? "50vw" : density === 4 ? "(min-width: 60rem) 25vw, 50vw" : "(min-width: 48rem) 33vw, 50vw"}
                  />
                ) : null}
                {pristine && insert && i === 2 ? (
                  <figure className="lj-insert lj-insert--wide" data-flip-id="insert-lookbook">
                    <div className="lj-insert__media">
                      <ShopImg image={insert.image} alt={insert.image.altText ?? insert.caption} sizes="(min-width: 48rem) 66vw, 100vw" />
                    </div>
                    <figcaption>
                      <span className="lj-label">{insert.label}</span>
                      <br />
                      <span className="lj-card__meta">{insert.caption}</span>
                    </figcaption>
                  </figure>
                ) : null}
                {pristine && insert && i === 6 ? (
                  <div className="lj-strip" data-flip-id="insert-strip">
                    <p className="lj-strip__quote">
                      Together on Saturdays<span className="lj-dot">.</span>
                    </p>
                    <p className="lj-annot" style={{ margin: 0, textAlign: "right" }}>
                      Somma Running Club
                      <br />
                      15°48&apos;06.8&quot;S 47°54&apos;14.5&quot;W
                    </p>
                  </div>
                ) : null}
              </Fragment>
            );
          })}
          {visible.length === 0 ? (
            <div className="lj-empty">
              {products.length === 0 ? (
                // coleção sem peça nenhuma: não é culpa de filtro, então não oferece limpar
                <p className="lj-display lj-display--s">Ainda não há peças aqui.</p>
              ) : (
                <>
                  <p className="lj-display lj-display--s">Nenhuma peça com esses filtros.</p>
                  <button type="button" className="lj-btn lj-btn--ghost" onClick={() => change(() => setFilters(NO_FILTERS))}>
                    Limpar filtros
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <dialog
        ref={sheet}
        className="lj-dialog lj-sheet"
        aria-labelledby="filtros-titulo"
        onClose={() => setFiltersOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setFiltersOpen(false);
        }}
      >
        <div className="lj-drawer__panel">
          <div className="lj-drawer__head">
            <h2 id="filtros-titulo" className="lj-label">
              Filtrar
            </h2>
            <button type="button" className="lj-panel__close" onClick={() => setFiltersOpen(false)}>
              Fechar
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m3 3 12 12M15 3 3 15" />
              </svg>
            </button>
          </div>
          <div className="lj-drawer__body">
            {sizes.length > 1 ? (
              <fieldset className="lj-filters__group">
                <legend className="lj-label">Tamanho</legend>
                <div className="lj-filters__options">
                  {sizes.map((size) => (
                    <label key={size} className="lj-check">
                      <input type="checkbox" checked={filters.sizes.includes(size)} onChange={() => toggle("sizes", size)} />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {colors.length > 1 ? (
              <fieldset className="lj-filters__group">
                <legend className="lj-label">Cor</legend>
                <div className="lj-filters__options">
                  {colors.map((color) => (
                    <label key={color.name} className="lj-check">
                      <input type="checkbox" checked={filters.colors.includes(color.name)} onChange={() => toggle("colors", color.name)} />
                      <span>
                        {color.hex ? <i className="lj-swatch" style={{ background: color.hex }} aria-hidden="true" /> : null}
                        {color.name}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <fieldset className="lj-filters__group">
              <legend className="lj-label">Disponibilidade</legend>
              <div className="lj-filters__options">
                <label className="lj-check">
                  <input type="checkbox" checked={filters.available} onChange={() => change(() => setFilters((f) => ({ ...f, available: !f.available })))} />
                  <span>Só o que tem estoque</span>
                </label>
              </div>
            </fieldset>
          </div>
          <div className="lj-drawer__foot">
            <button type="button" className="lj-btn lj-btn--block" onClick={() => setFiltersOpen(false)}>
              Ver {visible.length} {visible.length === 1 ? "produto" : "produtos"}
              <span className="lj-btn__arrow" aria-hidden="true">→</span>
            </button>
            {activeCount ? (
              <button type="button" className="lj-textbtn" onClick={() => change(() => setFilters(NO_FILTERS))}>
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
