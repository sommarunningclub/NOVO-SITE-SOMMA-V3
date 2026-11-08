/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fixa a raiz neste projeto (há outros lockfiles no sistema que confundem a deteção automática)
  outputFileTracingRoot: import.meta.dirname,
  // A imagem do ingresso do BORA com SOMMA lê as fontes Altone do disco.
  outputFileTracingIncludes: {
    "/boracomsomma/ingresso/imagem": ["./components/bora/fonts/**"],
  },
  // O link do Gabriel nasceu em /checkout/gabriel-brito e já circulou assim.
  // Ele agora mora na raiz, junto com os dos outros professores, e o caminho
  // antigo continua levando ao mesmo lugar. Temporário (307) de propósito: o
  // permanente fica gravado no navegador do cliente e não se desfaz.
  async redirects() {
    return [
      // Dexcomplica Love Run (07/11/2026): fora do ar desde 07/11 a pedido do
      // Alex. A LP e tudo abaixo dela (ingresso, transferência, agenda, Vem
      // Correr Comigo, tela de senha) vão para a home, e as APIs desses fluxos
      // param de responder. As imagens em /dexcomplica-love-run/... (public)
      // continuam, porque os e-mails já enviados apontam para elas. Para
      // religar, apagar estas linhas e EVENTO_REALIZADO em
      // lib/dexcomplica-love-run/event.config.ts. O banco não foi alterado.
      ...[
        "/dexcomplica",
        "/dexcomplica/:path*",
        "/dexcomplica-love-run",
        "/dexcomplica-love-run/ingresso/:token",
        "/dexcomplica-love-run/agenda.ics",
        "/api/dexcomplica-love-run/:path*",
      ].map((source) => ({ source, destination: "/", permanent: false })),
      {
        source: "/checkout/gabriel-brito",
        destination: "/gabriel-brito",
        permanent: false,
      },
      // Eventos que já passaram, fora do ar desde 27/10/2026 a pedido do Alex.
      // O código das páginas continua no repo: para religar uma, basta apagar
      // a linha dela. Só as páginas públicas saem; os links pessoais (ticket do
      // Desafio, que o admin abre, e obrigado/credencial do SOMMA DAY, que
      // foram por e-mail) continuam funcionando.
      ...[
        "/desafios-das-esteiras-evolve",
        "/desafios-das-esteiras-evolve/inscricao",
        "/desafios-das-esteiras-evolve/meu-cadastro",
        "/edicao-especial-set-2026",
        "/shakeout-centauro-somma-rj",
        "/wings-das-atleticas-2026",
        "/wings/ranking",
      ].map((source) => ({ source, destination: "/", permanent: false })),
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
      "operador",
      "p",
      "privacidade",
      "regulamento",
      "resgatar",
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
