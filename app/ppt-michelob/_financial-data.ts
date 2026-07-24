/**
 * Dados da Proposta Financeira do deck /ppt-michelob-proposta.
 *
 * Todos os números, tabelas e listas comerciais moram aqui, tipados, para que
 * a view apenas componha. O mesmo array alimenta tabela (desktop) e cards
 * (mobile), sem duplicação de conteúdo.
 */

/* ── 1. Investimento ───────────────────────────────────────────────────── */

export const INVESTIMENTO = {
  totalLabel: "Investimento total Somma",
  total: "R$ 240.000,00",
  totalNota:
    "Valor referente às entregas estratégicas, tecnológicas, esportivas, de comunidade, conteúdo e mensuração executadas pelo Somma.",
  selo: "Impostos inclusos",
  tributacaoLabel: "Tributação considerada",
  tributacao: "6%",
  tributosLabel: "Valor estimado dos tributos",
  tributos: "R$ 14.400,00",
  liquidoLabel: "Valor líquido estimado para execução do projeto",
  liquido: "R$ 225.600,00",
  observacao:
    "Os custos de produção física, estrutura, atrações, fornecedores, brindes, alimentação, mídia e operação do evento não estão incluídos no fee do Somma.",
  frase:
    "O Somma entrega a plataforma estratégica e esportiva da campanha. A Michelob viabiliza a estrutura física e operacional da experiência.",
} as const;

/** Os dois cartões comparativos da Tela 1. */
export const COMPARATIVO = [
  {
    titulo: "Serviços do Somma",
    valor: "R$ 240.000,00",
    texto: "Estratégia, tecnologia, comunidade, operação esportiva, conteúdo e mensuração.",
    destaque: true,
  },
  {
    titulo: "Produção física do evento",
    valor: null,
    texto: "Contratação e custeio direto pela Michelob Ultra ou agência responsável.",
    destaque: false,
  },
] as const;

/* ── 2. O que o Somma está vendendo ────────────────────────────────────── */

export interface SommaFrente {
  n: string;
  title: string;
  short: string;
  detail: string;
}

export const SOMMA_FRENTES: readonly SommaFrente[] = [
  {
    n: "01",
    title: "Direito de parceria e associação",
    short: "Associação institucional, exclusividade de categoria e acesso à comunidade ativa.",
    detail:
      "Uso da plataforma Somma como ambiente oficial da campanha, associação institucional, exclusividade de categoria durante o período contratado e acesso à comunidade ativa.",
  },
  {
    n: "02",
    title: "Estratégia e conceito da campanha",
    short: "Conceito Social Run, Ultra Balance Challenge e a jornada dos 21 dias.",
    detail:
      "Desenvolvimento do conceito Michelob Ultra Social Run, Ultra Balance Challenge, jornada dos 21 dias, mecânicas de engajamento, crews, desafios e experiência final.",
  },
  {
    n: "03",
    title: "Tecnologia",
    short: "Plataforma digital dos 21 dias, do cadastro ao dashboard.",
    detail:
      "Landing page, cadastro, autenticação, perfis, missões, pontuação, rankings, QR Codes, cards compartilháveis, dashboard e integração com a experiência presencial.",
  },
  {
    n: "04",
    title: "Comunidade e CRM",
    short: "Mobilização da base, formação das crews e relacionamento nos 21 dias.",
    detail:
      "Mobilização da base Somma, comunicação com os participantes, formação das crews, relacionamento, atendimento e acompanhamento durante os 21 dias.",
  },
  {
    n: "05",
    title: "Programa de insiders e embaixadores",
    short: "Seleção, briefing, entregáveis e acompanhamento dos embaixadores.",
    detail:
      "Seleção, cadastro, briefing, definição de entregáveis, acompanhamento e mensuração da participação dos insiders e embaixadores.",
  },
  {
    n: "06",
    title: "Planejamento e operação esportiva",
    short: "Percursos, pelotões, professores, pacers e desafios de pace.",
    detail:
      "Definição dos percursos, pelotões, professores, pacers, revezamento, competições, desafios de pace, aquecimento e dinâmica esportiva.",
  },
  {
    n: "07",
    title: "Conteúdo e distribuição",
    short: "Roteiro, captação, cobertura e distribuição nos canais do Somma.",
    detail:
      "Planejamento editorial, roteiros, captação, cobertura, conteúdos para redes sociais, depoimentos, bastidores, recap e distribuição nos canais do Somma.",
  },
  {
    n: "08",
    title: "Dados e mensuração",
    short: "Indicadores, presença, pesquisa pós-evento e relatório final.",
    detail:
      "Indicadores da campanha, cadastros, participantes ativos, missões, rankings, check-ins, presença, pesquisa pós-evento e relatório final.",
  },
  {
    n: "09",
    title: "Coordenação geral da campanha",
    short: "Gestão do cronograma e integração de todas as frentes.",
    detail:
      "Gestão do cronograma, integração entre marca, agência, fornecedores, comunidade, operação esportiva, conteúdo e tecnologia.",
  },
] as const;

export interface SommaResumo {
  frente: string;
  entrega: string;
}

export const SOMMA_RESUMO: readonly SommaResumo[] = [
  { frente: "Parceria", entrega: "Associação, exclusividade e acesso à comunidade" },
  { frente: "Estratégia", entrega: "Conceito, planejamento e jornada" },
  { frente: "Tecnologia", entrega: "Plataforma digital dos 21 dias" },
  { frente: "Comunidade", entrega: "Mobilização, CRM e atendimento" },
  { frente: "Embaixadores", entrega: "Seleção, briefing e acompanhamento" },
  { frente: "Operação esportiva", entrega: "Corrida, crews, professores e competições" },
  { frente: "Conteúdo", entrega: "Produção e distribuição" },
  { frente: "Dados", entrega: "Dashboard, pesquisa e relatório" },
  { frente: "Coordenação", entrega: "Gestão integrada do projeto" },
] as const;

export const SOMMA_FRASE_FINAL =
  "O Somma não está vendendo apenas divulgação. Está entregando uma plataforma completa de campanha, comunidade e experiência esportiva.";

/* ── 3. Obrigações da Michelob ─────────────────────────────────────────── */

export type Responsabilidade = "Michelob" | "Michelob ou parceiros aprovados";

export type CategoriaId =
  | "financeiro"
  | "infraestrutura"
  | "programacao"
  | "operacao"
  | "experiencia"
  | "marketing"
  | "juridico";

export interface CategoriaDef {
  id: CategoriaId;
  /** Rótulo curto, para os botões de filtro. */
  chip: string;
  /** Rótulo completo, para agrupamento e leitura. */
  label: string;
}

export const CATEGORIAS: readonly CategoriaDef[] = [
  { id: "financeiro", chip: "Financeiro", label: "Financeiro e institucional" },
  { id: "infraestrutura", chip: "Infraestrutura", label: "Espaço e infraestrutura" },
  { id: "programacao", chip: "Programação", label: "Programação e entretenimento" },
  { id: "operacao", chip: "Operação", label: "Segurança e operação" },
  { id: "experiencia", chip: "Experiência", label: "Experiência e ativações" },
  { id: "marketing", chip: "Marketing", label: "Marketing e comunicação" },
  { id: "juridico", chip: "Jurídico", label: "Jurídico e acesso" },
] as const;

export interface MichelobResponsibility {
  frente: string;
  obrigacao: string;
  responsabilidade: Responsabilidade;
  categoria: CategoriaId;
}

export const MICHELOB_RESPONSIBILITIES: readonly MichelobResponsibility[] = [
  {
    frente: "Fee do Somma",
    obrigacao:
      "Pagar os serviços de estratégia, tecnologia, comunidade, operação esportiva, conteúdo e mensuração.",
    responsabilidade: "Michelob",
    categoria: "financeiro",
  },
  {
    frente: "Espaço do evento",
    obrigacao: "Contratar o local e garantir disponibilidade para montagem, evento e desmontagem.",
    responsabilidade: "Michelob",
    categoria: "infraestrutura",
  },
  {
    frente: "Licenças e autorizações",
    obrigacao:
      "Providenciar alvarás, autorizações públicas, seguros e direitos de execução musical.",
    responsabilidade: "Michelob",
    categoria: "juridico",
  },
  {
    frente: "Estrutura física",
    obrigacao:
      "Contratar palco, tendas, banheiros, grades, geradores, mobiliário, camarins e áreas operacionais.",
    responsabilidade: "Michelob",
    categoria: "infraestrutura",
  },
  {
    frente: "Cenografia",
    obrigacao: "Produzir pórticos, painéis, sinalização, ambientação e comunicação visual.",
    responsabilidade: "Michelob",
    categoria: "infraestrutura",
  },
  {
    frente: "Som, luz e audiovisual",
    obrigacao:
      "Contratar equipamentos, painéis de LED, iluminação, técnicos e infraestrutura elétrica.",
    responsabilidade: "Michelob",
    categoria: "infraestrutura",
  },
  {
    frente: "Bandas, artistas e DJs",
    obrigacao: "Aprovar e contratar atrações de pagode, eletrônico, funk e demais programações.",
    responsabilidade: "Michelob",
    categoria: "programacao",
  },
  {
    frente: "Rider dos artistas",
    obrigacao:
      "Custear transporte, hospedagem, alimentação, camarim, equipamentos e exigências contratuais.",
    responsabilidade: "Michelob",
    categoria: "programacao",
  },
  {
    frente: "Segurança",
    obrigacao: "Contratar segurança patrimonial, controle de público, revista e isolamento das áreas.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Brigadistas e atendimento médico",
    obrigacao: "Contratar brigadistas, ambulância, equipe médica e posto de atendimento.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Limpeza",
    obrigacao: "Contratar equipe de limpeza, coletores e descarte de resíduos.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Máquina de fotos",
    obrigacao:
      "Contratar, personalizar e operar a máquina Somma x Michelob, incluindo impressão e equipe técnica.",
    responsabilidade: "Michelob",
    categoria: "experiencia",
  },
  {
    frente: "Brindes",
    obrigacao: "Produzir camisetas, bonés, copos, abridores, kits e demais produtos personalizados.",
    responsabilidade: "Michelob",
    categoria: "experiencia",
  },
  {
    frente: "Premiações",
    obrigacao: "Custear Garmin, tênis, viagens, inscrições em corridas e demais recompensas.",
    responsabilidade: "Michelob",
    categoria: "experiencia",
  },
  {
    frente: "Alimentação",
    obrigacao: "Contratar café da manhã, fornecedores, utensílios e estrutura gastronômica.",
    responsabilidade: "Michelob ou parceiros aprovados",
    categoria: "operacao",
  },
  {
    frente: "Hidratação",
    obrigacao:
      "Fornecer água, gelo, copos, bebidas não alcoólicas, refrigeração e pontos de hidratação.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Produto Michelob Ultra",
    obrigacao:
      "Fornecer bebidas, estoque, transporte, armazenamento, refrigeração e materiais de serviço.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Operação do bar",
    obrigacao: "Contratar equipe, controlar estoque, validar maioridade e garantir consumo responsável.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Recovery e wellness",
    obrigacao: "Contratar fisioterapia, massagem, mobilidade, banho de gelo e outras experiências.",
    responsabilidade: "Michelob ou parceiros aprovados",
    categoria: "experiencia",
  },
  {
    frente: "Ativações de marca",
    obrigacao:
      "Produzir jogos, experiências tecnológicas, personalização de produtos e estações interativas.",
    responsabilidade: "Michelob",
    categoria: "experiencia",
  },
  {
    frente: "Estrutura da corrida",
    obrigacao:
      "Custear cones, grades, pórtico, sinalização, cronometragem, chips e números de peito.",
    responsabilidade: "Michelob",
    categoria: "infraestrutura",
  },
  {
    frente: "Mídia paga",
    obrigacao: "Disponibilizar verba para Meta Ads, Google Ads e demais canais.",
    responsabilidade: "Michelob",
    categoria: "marketing",
  },
  {
    frente: "Influenciadores contratados",
    obrigacao: "Aprovar perfis, entregáveis, cachês e direitos de uso de imagem e conteúdo.",
    responsabilidade: "Michelob",
    categoria: "marketing",
  },
  {
    frente: "Identidade visual",
    obrigacao: "Fornecer logos oficiais, manual de marca e regras de aplicação.",
    responsabilidade: "Michelob",
    categoria: "marketing",
  },
  {
    frente: "Aprovações",
    obrigacao:
      "Aprovar conteúdos, brindes, cenografia, artistas, fornecedores e programação dentro dos prazos.",
    responsabilidade: "Michelob",
    categoria: "juridico",
  },
  {
    frente: "Validação jurídica",
    obrigacao: "Validar regulamentos, premiações, uso de imagem, LGPD e consumo responsável.",
    responsabilidade: "Michelob",
    categoria: "juridico",
  },
  {
    frente: "Ingressos",
    obrigacao: "Aprovar preços, lotes, gratuidades, capacidade e critérios de acesso.",
    responsabilidade: "Michelob",
    categoria: "juridico",
  },
  {
    frente: "Credenciamento",
    obrigacao: "Disponibilizar pulseiras, leitores, catracas, impressão e equipe adicional.",
    responsabilidade: "Michelob",
    categoria: "operacao",
  },
  {
    frente: "Produção física",
    obrigacao:
      "Contratar fornecedores ou nomear uma produtora responsável pela montagem, operação e desmontagem.",
    responsabilidade: "Michelob",
    categoria: "infraestrutura",
  },
  {
    frente: "Contingência",
    obrigacao: "Manter reserva financeira para clima, alterações de estrutura, licenças e imprevistos.",
    responsabilidade: "Michelob",
    categoria: "financeiro",
  },
];

/* ── 4. Condições comerciais ───────────────────────────────────────────── */

export interface Parcela {
  pct: string;
  quando: string;
  valor: string;
}

export const PAGAMENTO: readonly Parcela[] = [
  { pct: "40%", quando: "Na assinatura e início do projeto", valor: "R$ 96.000,00" },
  { pct: "40%", quando: "No lançamento do Ultra Balance Challenge", valor: "R$ 96.000,00" },
  { pct: "20%", quando: "Após o evento e entrega do relatório final", valor: "R$ 48.000,00" },
] as const;

/** Itens fora do fee do Somma, custeados pela Michelob ou agência. */
export const NAO_INCLUSO: readonly string[] = [
  "Espaço",
  "Licenças",
  "Palco",
  "Som",
  "Iluminação",
  "Cenografia",
  "Bandas",
  "Artistas",
  "DJs",
  "Segurança",
  "Brigadistas",
  "Ambulância",
  "Máquina de fotos",
  "Brindes",
  "Premiações",
  "Alimentação",
  "Hidratação",
  "Produto Michelob",
  "Operação do bar",
  "Recovery",
  "Estrutura da corrida",
  "Influenciadores",
  "Mídia paga",
  "Credenciamento",
  "Fornecedores",
  "Contingência da produção física",
];

export const NAO_INCLUSO_NOTA =
  "Esses itens serão contratados e custeados diretamente pela Michelob Ultra ou por sua agência responsável.";

export const FORNECEDORES = {
  intro:
    "O fee apresentado contempla a coordenação estratégica e a integração das entregas com a campanha.",
  condicao:
    "Caso o Somma seja solicitado a contratar, pagar, negociar ou gerenciar diretamente fornecedores da produção física, deverá ser apresentado orçamento adicional.",
  opcoes: [
    "Gestão de produção por fee adicional fixo.",
    "Percentual de 10% a 15% sobre os custos de terceiros administrados pelo Somma.",
  ],
  nota: "Esse percentual não é incluído automaticamente no investimento de R$ 240.000,00.",
} as const;

export const CLAUSULA_RESPONSABILIDADE = [
  "Todos os custos relacionados ao espaço, estrutura física, produção, cenografia, atrações, artistas, DJs, segurança, brigadistas, atendimento médico, alimentação, hidratação, bebidas, ativações, máquina de fotos, brindes, premiações, mídia, influenciadores, licenças, credenciamento e fornecedores serão de responsabilidade financeira e contratual exclusiva da Michelob Ultra ou de sua agência responsável.",
  "O Somma participará do planejamento e da integração dessas entregas com a campanha, mas não financiará ou assumirá contratos de terceiros sem contratação adicional e aprovação formal.",
] as const;

export const CONDICOES_META = {
  validadeLabel: "Validade comercial sugerida",
  validade: "15 dias após o envio.",
  cronograma:
    "O início do projeto está condicionado à assinatura do contrato, pagamento da primeira parcela e aprovação do escopo.",
  juridica:
    "A proposta final estará sujeita à formalização contratual, definição do cronograma, validação do escopo e aprovação jurídica das partes.",
  consumo:
    "Consumo responsável. Ações de experimentação e áreas de bebidas alcoólicas destinadas exclusivamente ao público maior de 18 anos.",
} as const;

/* ── 5. CTA final da seção ─────────────────────────────────────────────── */

export const FINANCE_CTA = {
  titulo: "Prontos para transformar 21 dias de movimento em uma grande experiência de marca.",
  valorLabel: "Investimento Somma",
  valor: "R$ 240.000,00",
  selo: "Impostos inclusos",
  primario: "Avançar com a proposta",
  secundario: "Revisar responsabilidades",
} as const;
