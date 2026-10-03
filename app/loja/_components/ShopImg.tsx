"use client";

import Image, { type ImageLoaderProps } from "next/image";
import type { ShopImage } from "@/lib/shopify/types";

/**
 * A CDN da Shopify redimensiona sozinha (`?width=`), então a imagem de produto
 * não passa pelo otimizador da Vercel: uma ida a menos e nenhuma cota gasta.
 * Client Component só porque `loader` é função e função não atravessa a
 * fronteira servidor → cliente.
 */
function shopifyLoader({ src, width }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  return url.toString();
}

type Props = {
  image: ShopImage;
  /** Texto alternativo quando a Shopify não tem um. Vazio = imagem decorativa. */
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function ShopImg({ image, alt, sizes, priority, className }: Props) {
  const remote = image.url.startsWith("http");
  return (
    <Image
      src={image.url}
      alt={alt ?? image.altText ?? ""}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={className}
      {...(remote ? { loader: shopifyLoader } : {})}
    />
  );
}
