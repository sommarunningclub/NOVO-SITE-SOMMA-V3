/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fixa a raiz neste projeto (há outros lockfiles no sistema que confundem a deteção automática)
  outputFileTracingRoot: import.meta.dirname,
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
