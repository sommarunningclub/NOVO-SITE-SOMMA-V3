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
      {
        source: "/checkout/gabriel-brito",
        destination: "/gabriel-brito",
        permanent: false,
      },
    ];
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
