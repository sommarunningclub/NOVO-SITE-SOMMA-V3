import Link from "next/link";
import { ROUTES } from "@/lib/shopify/handles";
import type { Drop, HomeContent } from "@/lib/shopify/types";
import { SommaSymbol } from "../brand/Logo";
import { HeroMarker } from "../HeroMarker";
import { Lines } from "../Lines";
import { HeroFire } from "./HeroFire";

/**
 * Abertura da loja: a arte tribal "SOMMA RUNNING CLUB" acende sobre o preto da
 * marca e fica em chamas. Ela é a headline visual; a frase da marca e o botão
 * do drop ficam no pé, pequenos, para a arte mandar.
 *
 * A hero inteira é o papel: ao rolar, ela queima de baixo para cima e deixa
 * aparecer o resto da página (HeroFire). Quem vem depois dela precisa estar
 * dentro de `.lj-under`.
 *
 * O texto e o botão já estão no HTML e aparecem na hora (o LCP é o texto); a
 * arte acende por cima em 1,5s.
 */
export function HeroTribal({ hero, drop }: { hero: HomeContent["hero"]; drop: Drop | null }) {
  const dropHref = drop?.collectionHandle ? ROUTES.collection(drop.collectionHandle) : ROUTES.shop;

  return (
    <section className="lj-hero" data-hero>
      <HeroMarker />
      <HeroFire alt="Somma Running Club, em letras de fogo" />

      <div className="lj-hero__body lj-hero__body--tribal">
        <div className="lj-stack lj-stack--s">
          {drop ? (
            <p className="lj-kicker lj-label" data-reveal="up" data-delay="0.5">
              <SommaSymbol className="lj-kicker__symbol" />
              <span>Drop {drop.code}</span>
              <span aria-hidden="true">/</span>
              <span>{drop.title}</span>
            </p>
          ) : null}
          <h1 className="lj-display lj-hero__tagline" data-reveal="lines" data-delay="0.6">
            <Lines lines={hero.headline} />
          </h1>
        </div>

        <div className="lj-hero__foot" data-reveal="up" data-delay="0.95">
          <p className="lj-annot lj-hero__annot">
            15°48&apos;06.8&quot;S 47°54&apos;14.5&quot;W
            <br />
            Together on Saturdays
          </p>
          <Link className="lj-btn lj-btn--accent" href={dropHref}>
            {hero.ctaLabel}
            <span className="lj-btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
