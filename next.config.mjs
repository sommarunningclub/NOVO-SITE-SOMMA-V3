/**
 * Política de segurança de resposta (headers).
 *
 * Os quatro primeiros são absolutos: não dependem do que a página carrega e não
 * têm como quebrar nada. Valem para todas as rotas.
 *
 * A CSP entra em **Report-Only** de propósito. O site carrega Google Tag
 * Manager, Analytics, Maps (com WebGL e tiles 3D), Supabase, imagens de meia
 * dúzia de CDNs e o inline de hidratação do próprio Next. Ligar CSP bloqueante
 * de primeira derruba alguma coisa — e derrubar o checkout para arrumar header
 * seria trocar um problema por outro pior. Report-Only registra a violação sem
 * bloquear: rode assim, acompanhe o console em produção por alguns dias, ajuste
 * a lista e só então troque `Content-Security-Policy-Report-Only` por
 * `Content-Security-Policy`.
 *
 * `frame-ancestors 'none'` é a exceção: já vale hoje pelo X-Frame-Options.
 */
const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' e 'unsafe-eval' cobrem o bootstrap do Next e o GTM. É o que
  // impede esta política de ser estrita — trocar por nonce é o próximo passo.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://maps.gstatic.com https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://brasilapi.com.br https://publica.cnpj.ws https://maps.googleapis.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.vercel-insights.com https://vercel.live",
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.googletagmanager.com https://calendar.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  // HTTPS obrigatório por 2 anos, incluindo subdomínios. A Vercel já serve tudo
  // em HTTPS, então não há caminho legítimo em texto claro para quebrar.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Sem adivinhação de tipo: um upload que se declara imagem não vira script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza caminho nem query para outros sites — o link de ticket e o token
  // de edição vivem na URL.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Clickjacking: nenhuma página do site pode ser embutida em iframe alheio.
  { key: "X-Frame-Options", value: "DENY" },
  // Nada de câmera, microfone ou geolocalização por padrão. O leitor de QR do
  // check-in usa câmera na própria origem, que `self` continua permitindo.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self), payment=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
