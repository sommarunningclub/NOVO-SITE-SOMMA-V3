"use client";

import { useEffect, useRef, useState } from "react";
import type { ShopImage } from "@/lib/shopify/types";
import { ShopImg } from "../ShopImg";

/**
 * Galeria da peça. Celular: fita horizontal com snap, imagem de ponta a ponta
 * e contador. Desktop: duas colunas, sem carrossel, cada foto na sua proporção
 * (todas as fotos à vista, a informação de compra fica presa ao lado).
 */
export function ProductGallery({ images, title }: { images: ShopImage[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCurrent(Math.round(el.scrollLeft / el.clientWidth) + 1);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (images.length === 0) return <div className="lj-gallery" />;

  return (
    <div className="lj-gallery">
      <div
        ref={track}
        className="lj-gallery__track"
        data-count={images.length}
        tabIndex={0}
        role="region"
        aria-label={`Fotos de ${title}: ${images.length}`}
      >
        {images.map((image, i) => (
          <figure key={image.url} className="lj-gallery__item" style={{ "--lj-ratio": `${image.width} / ${image.height}` } as React.CSSProperties}>
            <ShopImg
              image={image}
              alt={image.altText || `${title}, foto ${i + 1} de ${images.length}`}
              sizes="(min-width: 60rem) 33vw, 100vw"
              priority={i < 2}
            />
          </figure>
        ))}
      </div>
      {images.length > 1 ? (
        <span className="lj-label lj-gallery__count" aria-hidden="true">
          {String(Math.min(current, images.length)).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
      ) : null}
    </div>
  );
}
