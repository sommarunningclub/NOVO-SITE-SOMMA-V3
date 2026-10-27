import type { MetadataRoute } from "next";

// Nome e ícone que o iPhone usa quando a pessoa adiciona o site à Tela de Início.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOMMA Club",
    short_name: "SOMMA",
    description: "O maior running club do Distrito Federal.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "pt-BR",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
