/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fixa a raiz neste projeto (há outros lockfiles no sistema que confundem a deteção automática)
  outputFileTracingRoot: import.meta.dirname,
  // O link do Gabriel nasceu em /checkout/gabriel-brito e já circulou assim.
  // Ele agora mora na raiz, junto com os dos outros professores, e o caminho
  // antigo continua levando ao mesmo lugar. Temporário (307) de propósito: o
  // permanente fica gravado no navegador do cliente e não se desfaz.
  async redirects() {
    return [
      // A LP do Love Run nasceu em /dexcomplica-love-run e foi publicada em
      // /dexcomplica. Só as páginas redirecionam: as imagens continuam em
      // /dexcomplica-love-run/... (public), então nada de curinga aqui.
      { source: "/dexcomplica-love-run", destination: "/dexcomplica", permanent: false },
      { source: "/dexcomplica-love-run/ingresso/:token", destination: "/dexcomplica/ingresso/:token", permanent: false },
      { source: "/dexcomplica-love-run/agenda.ics", destination: "/dexcomplica/agenda.ics", permanent: false },
      {
        source: "/checkout/gabriel-brito",
        destination: "/gabriel-brito",
        permanent: false,
      },
    ];
  },
  // Apps próprios na Vercel, cada um com basePath. Aqui o site só encaminha
  // esses caminhos. /michelob não é catch-all: public/michelob (capa, toolkit)
  // alimenta os decks /ppt-michelob* e o simulador Ultra Balance.
  async rewrites() {
    const bora = process.env.BORA_EXPERIENCE_URL || "https://bora-experience.vercel.app";
    const michelob =
      process.env.MICHELOB_URL || "https://projeto-michelob-2026.vercel.app";
    const muRotas = [
      "_next",
      "api",
      "admin",
      "comunidade",
      "desafio",
      "entrar",
      "faq",
      "meu-ingresso",
      "meu-passaporte",
      "meu-perfil",
      "meu-token",
      "meus-beneficios",
      "em-breve",
      "email",
      "obrigado",
      "p",
      "privacidade",
      "regulamento",
      "fotos",
      "marca",
    ];
    return {
      beforeFiles: [
        { source: "/ppt-somma-bora", destination: `${bora}/ppt-somma-bora` },
        { source: "/ppt-somma-bora/:path*", destination: `${bora}/ppt-somma-bora/:path*` },
        { source: "/michelob", destination: `${michelob}/michelob` },
        { source: "/michelob/icon.svg", destination: `${michelob}/michelob/icon.svg` },
        { source: "/michelob/favicon.ico", destination: `${michelob}/michelob/favicon.ico` },
        { source: "/michelob/apple-icon", destination: `${michelob}/michelob/apple-icon` },
        { source: "/michelob/apple-icon.png", destination: `${michelob}/michelob/apple-icon.png` },
        ...muRotas.flatMap((r) => [
          { source: `/michelob/${r}`, destination: `${michelob}/michelob/${r}` },
          {
            source: `/michelob/${r}/:path*`,
            destination: `${michelob}/michelob/${r}/:path*`,
          },
        ]),
      ],
    };
  },
  images: {
    // AVIF primeiro: ~30-50% menor que WebP na mesma qualidade → alta definição sem pesar.
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
};

export default nextConfig;
