/* ═══════════════════════════════════════════════════════════════════════════
   SOMMA ENERGY RUN · powered by Choco Energy
   Conteúdo da proposta Somma Club × 100% Você. Fonte única de verdade:
   editar aqui muda a apresentação inteira.
   ═══════════════════════════════════════════════════════════════════════════ */

export const DECK = {
  marca: "100% VOCÊ",
  produto: "CHOCO ENERGY",
  evento: "SOMMA ENERGY RUN",
  periodo: "SETEMBRO 2026",
  local: "BRASÍLIA · DF",
} as const;

export const MANTRA = [
  { label: "ENERGIA", when: "ANTES" },
  { label: "PERFORMANCE", when: "DURANTE" },
  { label: "COMUNIDADE", when: "DEPOIS" },
] as const;

export const EQUACAO = [
  {
    n: "01",
    titulo: "CHOCO ENERGY",
    desc: "Um produto de energia procurando o contexto certo para ser experimentado.",
  },
  {
    n: "02",
    titulo: "RUNNING",
    desc: "O momento em que energia e performance deixam de ser conceito e viram necessidade.",
  },
  {
    n: "03",
    titulo: "COMMUNITY",
    desc: "Pessoas reunidas por vontade própria, num ritual que se repete todo sábado.",
  },
] as const;

/* ─────────────────────────────────────────────────────────────────────────
   A comunidade. Números informados pela operação do Somma — não estimar
   nem arredondar para cima sem confirmação.
   ───────────────────────────────────────────────────────────────────────── */

export const COMUNIDADE = {
  tagline: "O MAIOR RUNNING CLUB DO DISTRITO FEDERAL",
  instagram: { handle: "@somma.club", url: "https://instagram.com/somma.club" },

  /** Os três números que sustentam a proposta. */
  numeros: [
    {
      chave: "membros",
      prefixo: "+",
      valor: 6,
      sufixo: " mil",
      label: "Membros na base própria",
      desc: "Comunidade construída no encontro presencial, semana após semana.",
    },
    {
      chave: "sabado",
      texto: "200–450",
      label: "Correndo todo sábado",
      desc: "Parque da Cidade, 7h. Toda semana, o ano inteiro.",
    },
    {
      chave: "seguidores",
      valor: 14.2,
      sufixo: " mil",
      decimais: 1,
      label: "Seguidores no Instagram",
      desc: "@somma.club — o canal onde a comunidade se reconhece.",
    },
  ],

  /** Desempenho do Instagram nos últimos 30 dias. */
  instagramStats: [
    { valor: "645,6 mil", label: "Visualizações" },
    { valor: "58,1 mil", label: "Contas alcançadas" },
    { valor: "12,8 mil", label: "Interações" },
    { valor: "70%", label: "Do alcance vem de seguidores" },
  ],

  nota:
    "Dados de Instagram referentes ao período de 28 de junho a 27 de julho de 2026. A média de participantes por sábado é informada pela operação do Somma.",
};

export type EtapaId = "energy-point" | "energy-run" | "community-moment";

export const ETAPAS: {
  id: EtapaId;
  n: string;
  fase: string;
  eixo: string;
  titulo: string;
  itens: string[];
  modos?: { nome: string; desc: string }[];
}[] = [
  {
    id: "energy-point",
    n: "01",
    fase: "ANTES",
    eixo: "ENERGIA",
    titulo: "ENERGY POINT",
    itens: [
      "Recepção dos participantes",
      "Experimentação e degustação do Choco Energy antes da corrida",
      "Interação da marca com a comunidade",
      "Conteúdo, QR Code, benefícios e comunicação da marca",
    ],
  },
  {
    id: "energy-run",
    n: "02",
    fase: "DURANTE",
    eixo: "PERFORMANCE",
    titulo: "ENERGY RUN",
    itens: [
      "Treino especial Somma",
      "Possibilidade de divisão dos corredores por proposta",
    ],
    modos: [
      { nome: "ENERGY 5K", desc: "Corrida social." },
      { nome: "ENERGY PACE", desc: "Desafio de ritmo." },
      { nome: "ENERGY CHALLENGE", desc: "Ativação especial de performance." },
    ],
  },
  {
    id: "community-moment",
    n: "03",
    fase: "DEPOIS",
    eixo: "COMUNIDADE",
    titulo: "COMMUNITY MOMENT",
    itens: [
      "Chegada e encontro da comunidade",
      "Conteúdo e fotos",
      "Relacionamento",
      "Marca inserida naturalmente na experiência",
    ],
  },
];

export const ENTREGAS = [
  "COMUNIDADE",
  "CONTEXTO",
  "EXPERIÊNCIA",
  "CONTEÚDO",
  "INFLUÊNCIA",
  "EXPERIMENTAÇÃO",
  "RELACIONAMENTO",
  "BRANDING",
] as const;

export const POSICIONAMENTO =
  "O Somma não é uma plataforma de vendas e não garante venda direta. Somos uma plataforma de comunidade e experiências para marcas que desejam construir relevância dentro do universo wellness.";

export type Plano = {
  id: string;
  nome: string;
  valor: number;
  resumo: string;
  destaque?: boolean;
  selo?: string;
  heranca?: string;
  itens: string[];
  nota?: string;
};

export const PLANOS: Plano[] = [
  {
    id: "essential",
    nome: "ESSENTIAL",
    valor: 2000,
    resumo: "Presença da marca dentro de um treino Somma.",
    itens: [
      "Ativação em 1 treino Somma",
      "Espaço para degustação",
      "Acesso à comunidade",
      "Organização da ação",
      "Comunicação nos grupos",
      "2 Stories Somma",
    ],
    nota: "Não inclui naming da edição. Esta é a menor ativação comercial realizada pelo Somma.",
  },
  {
    id: "energy-run",
    nome: "ENERGY RUN",
    valor: 3500,
    resumo: "A edição vira sua. A marca deixa de estar no evento e passa a ser o evento.",
    destaque: true,
    selo: "RECOMENDADO",
    heranca: "Tudo do Essential, mais:",
    itens: [
      "SOMMA ENERGY RUN powered by Choco Energy",
      "Identidade temática do treino",
      "Dinâmica especial de corrida",
      "Energy Point",
      "QR Code ou CTA da campanha",
      "4 Stories",
      "1 conteúdo colaborativo",
      "Integração da marca com a experiência",
      "Cobertura da ativação",
    ],
  },
  {
    id: "energy-takeover",
    nome: "ENERGY TAKEOVER",
    valor: 5000,
    resumo: "A experiência inteira sob a marca, do primeiro ponto de contato ao pós-treino.",
    heranca: "Tudo do Energy Run, mais:",
    itens: [
      "Maior presença de branding",
      "Takeover da experiência",
      "Reel colaborativo",
      "Cobertura completa de Stories",
      "Mais pontos de interação",
      "Possibilidade de desafios e ativações adicionais",
      "Maior integração com influenciadores convidados",
      "Experiência pós-treino personalizada",
    ],
  },
];

export const RESPONSABILIDADES = {
  somma: [
    "Conceito",
    "Estratégia",
    "Comunidade",
    "Operação esportiva",
    "Organização do treino",
    "Comunicação",
    "Conteúdo conforme plano contratado",
    "Dinâmicas da experiência",
  ],
  marca: [
    "Produto para degustação",
    "Equipe de sampling caso necessária",
    "Materiais de PDV",
    "Transporte dos produtos",
    "Estrutura específica da marca",
    "Cenografia adicional",
    "Brindes",
    "Influenciadores contratados pela marca",
  ],
} as const;

export const NOTA_EXTRAS =
  "Estruturas, cenografia ou demandas adicionais fora do escopo acima podem ser orçadas separadamente.";
