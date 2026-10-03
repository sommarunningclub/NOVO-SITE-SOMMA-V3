"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LogoHorizontal } from "./brand/Logo";
import type { NavItem } from "./Header";
import { useLoja } from "./LojaProvider";
import { useDialog } from "./useDialog";

/** Menu do celular: tela cheia, tipografia de pôster, selo do clube no pé. */
export function MobileMenu({ nav }: { nav: NavItem[] }) {
  const { panel, open, close, dismiss, count } = useLoja();
  const ref = useDialog(panel === "menu");
  const pathname = usePathname();

  // navegou: fecha
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <dialog ref={ref} className="lj-dialog lj-menu" aria-label="Menu" onClose={() => dismiss("menu")}>
      <div className="lj-menu__bar">
        <Link href="/loja" aria-label="SOMMA, início da loja" onClick={close}>
          <LogoHorizontal />
        </Link>
        <button type="button" className="lj-panel__close" onClick={close}>
          Fechar
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m3 3 12 12M15 3 3 15" />
          </svg>
        </button>
      </div>

      <nav className="lj-menu__nav" aria-label="Principal">
        {nav.map((item) => (
          <Link key={item.label} href={item.href} onClick={close}>
            {item.label}
            {item.note ? <small>{item.note}</small> : null}
          </Link>
        ))}
      </nav>

      <div className="lj-menu__foot">
        <div className="lj-menu__links">
          <button type="button" onClick={() => open("search")}>
            Busca
          </button>
          <button type="button" onClick={() => open("cart")}>
            Sacola ({count})
          </button>
          <span className="lj-annot" style={{ marginTop: "0.75rem" }}>
            Sáb 07:00 · Parque da Cidade · E10
          </span>
        </div>
        <Image className="lj-menu__seal" src="/loja/brand/selo-cor-escuro.svg" alt="Selo somma.club" width={88} height={87} unoptimized />
      </div>
    </dialog>
  );
}
