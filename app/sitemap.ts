import type { MetadataRoute } from "next";

/**
 * Páginas públicas que o site quer indexadas. Lista curta e explícita: página
 * de evento que sai do ar, ou área restrita, não entra aqui.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sommaclub.com.br";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/maratonamonumental2026`, changeFrequency: "daily", priority: 0.9 },
  ];
}
