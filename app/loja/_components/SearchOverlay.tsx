"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/lib/shopify/handles";
import type { SearchResults } from "@/lib/shopify/types";
import { track } from "../_lib/analytics";
import { formatMoney } from "../_lib/format";
import { useLoja } from "./LojaProvider";
import { ShopImg } from "./ShopImg";
import { useDialog } from "./useDialog";

const RECENT_KEY = "somma:loja:buscas";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 180;
const EMPTY: SearchResults = { products: [], collections: [], suggestions: [] };

/** Buscas recentes ficam só neste navegador; nada disso vai para servidor. */
function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string): string[] {
  const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // armazenamento bloqueado: a busca funciona igual, só sem histórico
  }
  return next;
}

type Status = "idle" | "loading" | "done" | "error";

/** Busca em tela cheia com resultado enquanto a pessoa digita. */
export function SearchOverlay() {
  const { panel, close, dismiss } = useLoja();
  const open = panel === "search";
  const ref = useDialog(open);
  const input = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
    input.current?.focus();
  }, [open]);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/loja/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResults((await res.json()) as SearchResults);
        setStatus("done");
        track.search(q);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term]);

  const leave = () => {
    const q = term.trim();
    if (q.length >= 2) setRecent(saveRecent(q));
    close();
  };

  const nothing = status === "done" && results.products.length === 0 && results.collections.length === 0;

  return (
    <dialog ref={ref} className="lj-dialog lj-search" aria-label="Busca" onClose={() => dismiss("search")}>
      <div className="lj-search__bar">
        <span className="lj-label">Busca</span>
        <button type="button" className="lj-panel__close" onClick={close}>
          Fechar
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m3 3 12 12M15 3 3 15" />
          </svg>
        </button>
      </div>

      <form className="lj-search__field" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="loja-busca" className="lj-sr">
          O que você procura?
        </label>
        <input
          ref={input}
          id="loja-busca"
          type="search"
          placeholder="Regata, boné…"
          autoComplete="off"
          enterKeyHint="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </form>

      <div className="lj-search__results" aria-live="polite">
        <div>
          {status === "error" ? <p className="lj-lead">A busca não respondeu. Tente de novo.</p> : null}
          {nothing ? (
            <p className="lj-lead">
              Nada encontrado para “{term.trim()}”. Tente o nome da peça, como regata, cropped ou boné.
            </p>
          ) : null}
          {results.products.length > 0 ? (
            <>
              <h2 className="lj-label lj-label--soft">Produtos</h2>
              <ul className="lj-search__list lj-search__list--products">
                {results.products.map((product) => (
                  <li key={product.id}>
                    <Link href={ROUTES.product(product.handle)} className="lj-hit" onClick={leave}>
                      <span className="lj-hit__thumb">{product.image ? <ShopImg image={product.image} alt="" sizes="52px" /> : null}</span>
                      <span>
                        <strong>{product.title}</strong>
                        {product.availableForSale ? formatMoney(product.price) : "Sold out"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div>
          {results.collections.length > 0 ? (
            <>
              <h2 className="lj-label lj-label--soft">Coleções</h2>
              <ul className="lj-search__list lj-search__list--plain">
                {results.collections.map((collection) => (
                  <li key={collection.handle}>
                    <Link href={ROUTES.collection(collection.handle)} onClick={leave}>
                      {collection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {status === "idle" && recent.length > 0 ? (
            <>
              <h2 className="lj-label lj-label--soft">Buscas recentes</h2>
              <ul className="lj-search__list lj-search__list--plain">
                {recent.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => setTerm(item)}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
