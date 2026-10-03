import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";
import { SOMMA } from "@/lib/somma-data";
import type { NavItem } from "./Header";

/**
 * Rodapé editorial: o selo do clube e o horário do treino em tipografia de
 * cartaz. O selo é a versão oficial "cor sobre escuro" do MIV.
 */
export function Footer({ nav, previewNote }: { nav: NavItem[]; previewNote: string | null }) {
  const shop = nav.filter((item) => item.href.startsWith("/loja"));

  return (
    <footer className="lj-dark lj-footer">
      <div className="lj-footer__sign">
        <Image className="lj-footer__seal" src="/loja/brand/selo-cor-escuro.svg" alt="Selo somma.club" width={148} height={147} unoptimized />
        <p className="lj-display lj-footer__time">
          Sáb. 7AM. E10. 061<span className="lj-dot">.</span>
        </p>
      </div>

      <div className="lj-footer__cols">
        <div>
          <h2 className="lj-label">Shop</h2>
          <ul>
            {shop.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>{item.label === "Shop" ? "Todos os produtos" : item.label === "Drops" ? `Drop ${item.note ?? ""}`.trim() : item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="lj-label">Clube</h2>
          <ul>
            <li>
              <Link href={ROUTES.club}>O clube</Link>
            </li>
            <li>
              <Link href="/assessoria">Assessoria</Link>
            </li>
            <li>
              <Link href="/seja-parceiro">Seja parceiro</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="lj-label">Ajuda</h2>
          <ul>
            <li>
              <Link href="/politica-de-privacidade">Política de privacidade</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="lj-label">Social</h2>
          <ul>
            <li>
              <a href={SOMMA.links.instagram} rel="noopener">Instagram</a>
            </li>
            <li>
              <a href={SOMMA.links.tiktok} rel="noopener">TikTok</a>
            </li>
            <li>
              <a href={SOMMA.links.strava} rel="noopener">Strava</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="lj-footer__legal">
        <p>© {new Date().getFullYear()} SOMMA Club · Brasília, Brasil</p>
        <p className="lj-annot">15°48&apos;06.8&quot;S 47°54&apos;14.5&quot;W · Together on Saturdays</p>
      </div>

      {previewNote ? <p className="lj-preview-note">{previewNote}</p> : null}
    </footer>
  );
}
