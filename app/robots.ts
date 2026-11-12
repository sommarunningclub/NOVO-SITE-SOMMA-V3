import type { MetadataRoute } from "next";

/** Tudo liberado, menos as APIs e as áreas da equipe e do ingresso do Meeting. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/maratonamonumental2026/admin",
          "/maratonamonumental2026/credenciamento",
          "/maratonamonumental2026/obrigado",
          "/maratonamonumental2026/confirmacao",
        ],
      },
    ],
    sitemap: "https://sommaclub.com.br/sitemap.xml",
  };
}
