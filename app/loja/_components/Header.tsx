"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/lib/shopify/handles";
import { LogoHorizontal } from "./brand/Logo";
import { useLoja } from "./LojaProvider";
import { MobileMenu } from "./MobileMenu";

export type NavItem = { label: string; href: string; note?: string };

/** Rotas que abrem com hero: nelas o header nasce transparente sobre a foto. */
const HERO_ROUTES = new Set<string>([ROUTES.home]);

/** Só some depois deste tanto de rolagem, para não piscar no topo da página. */
const HIDE_AFTER = 160;

/**
 * Header mínimo. Sobre o hero é transparente com texto branco; fora dele vira
 * off-white com texto preto. Some ao descer e volta ao subir.
 */
export function Header({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const { count, open, panel, hero } = useLoja();
  const [tone, setTone] = useState<"media" | "solid">(HERO_ROUTES.has(pathname) ? "media" : "solid");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const header = document.querySelector<HTMLElement>(".lj-header");
      // Enquanto a hero ainda não se registrou, vale o que a rota promete: assim
      // o header não pisca claro por cima da hero escura no primeiro instante.
      // A hero que queima pede o header sólido antes do fim dela, porque o fogo
      // chega ao topo antes da seção seguinte (`data-header-until`, do HeroFire).
      const until = Number(hero?.dataset.headerUntil) || 1;
      const over = hero ? y < hero.offsetHeight * until - (header?.offsetHeight ?? 0) : HERO_ROUTES.has(pathname) && y < 8;
      setTone(over ? "media" : "solid");
      setHidden(y > last && y > HIDE_AFTER);
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname, hero]);

  return (
    <>
      <header className="lj-header" data-tone={tone} data-hidden={hidden && panel === null}>
        <Link href={ROUTES.home} className="lj-header__logo" aria-label="SOMMA, início da loja">
          <LogoHorizontal />
        </Link>

        <nav className="lj-header__nav" aria-label="Principal">
          {nav.map((item) => (
            <Link key={item.label} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="lj-header__tools">
          <button type="button" className="lj-header__text-search" onClick={() => open("search")}>
            Busca
          </button>
          <button type="button" className="lj-header__icon lj-header__icon-search" aria-label="Buscar" onClick={() => open("search")}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="9.5" cy="9.5" r="6.5" />
              <path d="M14.5 14.5 20 20" />
            </svg>
          </button>
          <button type="button" onClick={() => open("cart")} aria-label={`Sacola, ${count} ${count === 1 ? "item" : "itens"}`}>
            Sacola ({count})
          </button>
          <button type="button" className="lj-header__icon lj-header__menu" aria-label="Abrir menu" onClick={() => open("menu")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 8.5h18M3 15.5h18" />
            </svg>
          </button>
        </div>
      </header>

      <MobileMenu nav={nav} />
    </>
  );
}
