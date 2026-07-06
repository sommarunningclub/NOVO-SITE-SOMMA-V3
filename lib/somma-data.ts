// Fonte única de conteúdo da home do SOMMA Club.
// Dados reais extraídos do site atual + spec aprovado. Não inventar estatísticas aqui.

export const SOMMA = {
  nome: "SOMMA Club",
  slogan: "Se é pra correr, que seja com vibe boa.",
  tagline: "O MAIOR RUNNING CLUB DO DISTRITO FEDERAL",
  cnpj: "61.315.987/0001-28",
  endereco: "Parque da Cidade Sarah Kubitschek, Estacionamento 10, Brasília DF",
  encontro: {
    dia: "Todo sábado",
    diaSemana: 6, // 0=domingo ... 6=sábado
    hora: "7h",
    horaNum: 7,
    local: "Parque da Cidade Sarah Kubitschek",
    ponto: "Estacionamento 10",
    cidade: "Brasília",
  },
  // Coordenadas do ponto de encontro do SOMMA (Estacionamento 10, Parque da Cidade)
  geo: { lat: -15.801729922209846, lng: -47.904086721297524 },
  links: {
    inscricao: "#inscricao",
    proximoTreino: "#local",
    assessoria: "https://assessoria.sommaclub.com.br/",
    strava:
      "https://www.strava.com/clubs/1608501?share_sig=D8C84ECD1759146345&_branch_match_id=1315308772546708809&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXLy4pSixL1EcsKNDLzczL1jcxdsmPCgmrNA5Psq8rSk1LLSrKzEuPTyrKLy9OLbJ1zijKz00FAFnkwLM9AAAA",
    instagram: "https://instagram.com/somma.club",
    tiktok: "https://www.tiktok.com/@somma.club",
    whatsapp: "https://wa.me/5561995372477",
    whatsappAssessoria:
      "https://wa.me/5561995372477?text=" +
      encodeURIComponent(
        "Olá, vim do site da Assessoria Somma Club e quero saber mais informações."
      ),
    loja: "https://loja.sommaclub.com.br/",
    checkin: "https://sommaclub.com.br/check-in",
    focoRadical: "https://jvfs.focoradical.com.br/",
  },
  focoRadical: {
    cupom: "SOMMA",
    logo: "/cropped-foco-radical-png-1-1920x677.png",
  },
  analytics: {
    gtm: "GTM-W98N7DC4",
    ga4: "G-135FT69CK4",
  },
} as const;

export const TRUST_ITEMS = [
  { value: "5.000+", label: "Membros" },
  { value: "100%", label: "Gratuito" },
  { value: "Sábado 7h", label: "Todo fim de semana" },
  { value: "Parque da Cidade", label: "Estacionamento 10" },
] as const;

export const PACES = [
  {
    titulo: "Iniciante",
    descricao: "Caminhada com corrida leve.",
    distancia: "4 km",
    pace: "No seu ritmo",
  },
  {
    titulo: "Confortável",
    descricao: "Corrida leve e constante.",
    distancia: "4 km · 6 km · 8 km",
    pace: "Cerca de 6min30/km",
  },
  {
    titulo: "Mais rápido",
    descricao: "Para quem quer um treino mais intenso.",
    distancia: "4 km · 6 km · 8 km",
    pace: "Cerca de 5min30/km",
  },
] as const;

// Pilares da Assessoria (cards de feature com imagem).
// `image`: caminho em /public. Deixe "" para exibir o placeholder editável.
export const ADVISORY_PILLARS = [
  {
    grupo: "Comunidade",
    descricao:
      "Presença VIP nas provas Somma, estrutura em eventos, encontros mensais exclusivos e experiências.",
    image: "", // ex.: "/assessoria-comunidade.jpg"
  },
  {
    grupo: "Parcerias",
    descricao:
      "Descontos em Estamina Recovery, Dopahmina, Tex Barbearia e Academia Evolve.",
    image: "", // ex.: "/assessoria-parcerias.jpg"
  },
  {
    grupo: "Exclusivos",
    descricao:
      "Treino personalizado via app, integração com Strava/GPS, acompanhamento de métricas e camiseta oficial.",
    image: "", // ex.: "/assessoria-exclusivos.jpg"
  },
  {
    grupo: "Grupo VIP no WhatsApp",
    descricao:
      "Grupo exclusivo de membros com sorteios, brindes das marcas parceiras e espaço VIP nas provas.",
    image: "",
  },
] as const;

// Planos da Assessoria — tabela de 3 colunas com check/X.
export type AdvisoryFeature = { name: string; included: boolean };
export type AdvisoryPlanCard = {
  id: string;
  name: string;
  price: number; // por mês
  total: number; // valor total do plano
  period?: string;
  description: string;
  note?: string;
  parcelas?: string; // texto exibido na visão "Por mês"
  isRecommended?: boolean;
  buttonText: string;
  href: string;
  features: AdvisoryFeature[];
};

// Benefícios em comum a todos os planos (sempre inclusos).
const COMMON: AdvisoryFeature[] = [
  { name: "Sem taxa de matrícula", included: true },
  { name: "Treino personalizado via app", included: true },
  { name: "Integração com Strava/GPS", included: true },
  { name: "Acompanhamento de métricas", included: true },
  { name: "Encontros mensais exclusivos", included: true },
  { name: "Descontos com marcas parceiras", included: true },
];

// Marcas parceiras exibidas no card de planos.
// `logo`: caminho em /public. Deixe "" para mostrar o espaço/placeholder editável.
export const ADVISORY_PARTNERS: { nome: string; logo: string }[] = [
  { nome: "Estamina Recovery", logo: "/estamina_logo.jpg" },
  { nome: "Dopahmina", logo: "/dopahmina.png" },
  { nome: "Tex Barbearia", logo: "/693405059_18120852760711033_4791155118619121360_n.jpg" },
  { nome: "Academia Evolve", logo: "/Logo_Cubo_Evolve.png" },
];

export const ADVISORY_PLANS: AdvisoryPlanCard[] = [
  {
    id: "mensal",
    name: "Mensal",
    price: 220,
    total: 220,
    description: "Flexível, sem fidelidade.",
    note: "Cancele quando quiser",
    parcelas: "Sem fidelidade",
    buttonText: "Quero o Mensal",
    href: "/checkout/mensal",
    features: [...COMMON, { name: "Kit grátis (ecobag + camiseta)", included: false }],
  },
  {
    id: "semestral",
    name: "Semestral",
    price: 200,
    total: 1200,
    description: "O equilíbrio ideal entre preço e compromisso.",
    note: "R$ 1.200 em 6x sem juros · economia de R$ 120",
    parcelas: "6x sem juros",
    isRecommended: true,
    buttonText: "Quero o Semestral",
    href: "/checkout/semestral",
    features: [...COMMON, { name: "Kit grátis (ecobag + camiseta)", included: true }],
  },
  {
    id: "anual",
    name: "Anual",
    price: 180,
    total: 2160,
    description: "O melhor custo-benefício do Somma.",
    note: "R$ 2.160 em 12x sem juros · economia de R$ 480",
    parcelas: "12x sem juros",
    buttonText: "Quero o Anual",
    href: "/checkout/anual",
    features: [...COMMON, { name: "Kit grátis (ecobag + camiseta)", included: true }],
  },
];

// ─── Conteúdo da LP /assessoria ──────────────────────────────────────────────

// Cards de benefício (8) — chave `icon` mapeada no componente.
export const ADVISORY_BENEFITS = [
  {
    icon: "treino",
    titulo: "Treino personalizado",
    descricao: "Planilhas criadas de acordo com seu nível, sua rotina, seus objetivos e sua evolução.",
  },
  {
    icon: "acompanhamento",
    titulo: "Acompanhamento próximo",
    descricao: "Você escolhe seu professor e tem contato direto com ele desde o primeiro momento da assinatura.",
  },
  {
    icon: "professores",
    titulo: "Professores especialistas",
    descricao: "Treinadores experientes, humanos, animados e com bom senso para ajustar sua evolução sem exageros.",
  },
  {
    icon: "niveis",
    titulo: "Para todos os níveis",
    descricao: "Da primeira corrida aos treinos mais intensos, a assessoria se adapta ao seu momento.",
  },
  {
    icon: "comunidade",
    titulo: "Comunidade acolhedora",
    descricao: "Você não treina sozinho. Faz parte de um grupo que incentiva, acolhe e puxa você para frente.",
  },
  {
    icon: "domingo",
    titulo: "Treinos aos domingos",
    descricao: "Todos os domingos a assessoria realiza treinos completos, presenciais e conduzidos pelos professores.",
  },
  {
    icon: "seguranca",
    titulo: "Evolução com segurança",
    descricao: "O foco é correr melhor, com mais consciência, constância e menor risco de lesão.",
  },
  {
    icon: "energia",
    titulo: "A energia do Somma Club",
    descricao: "A força da comunidade Somma, agora com uma camada a mais de acompanhamento e performance.",
  },
] as const;

export const ADVISORY_JOURNEY = [
  {
    titulo: "Faça sua assinatura",
    descricao:
      "Escolha seu plano, selecione o professor que mais combina com você e entre oficialmente para a Assessoria Somma.",
  },
  {
    titulo: "Contato imediato com o professor",
    descricao:
      "Assim que a assinatura é concluída, você já fala com o professor escolhido e inicia sua jornada.",
  },
  {
    titulo: "Entrevista inicial",
    descricao:
      "O professor faz uma conversa de diagnóstico para entender seu histórico, rotina, experiência e objetivos.",
  },
  {
    titulo: "Formulário do atleta",
    descricao:
      "Você preenche o formulário com informações importantes para um acompanhamento mais assertivo e seguro.",
  },
  {
    titulo: "Entrada no grupo exclusivo",
    descricao:
      "Você entra no grupo exclusivo da Assessoria no WhatsApp, com orientações, avisos, suporte e comunidade.",
  },
  {
    titulo: "Treinos e acompanhamento",
    descricao:
      "Você recebe seus treinos, participa dos encontros de domingo e evolui com suporte, constância e direção.",
  },
] as const;

export const ADVISORY_TESTIMONIALS = [
  {
    nome: "Aluno Assessoria",
    contexto: "Evoluiu da caminhada aos 10km",
    frase:
      "Em poucos meses saí do zero para correr 10km. O acompanhamento fez toda a diferença.",
  },
  {
    nome: "Aluna Assessoria",
    contexto: "Primeira meia-maratona",
    frase:
      "Os treinos personalizados e o suporte dos professores me levaram à minha primeira 21k.",
  },
  {
    nome: "Aluno Assessoria",
    contexto: "Melhorou o pace em 1min/km",
    frase:
      "Tinha estagnado sozinho. Com método e ajustes constantes, melhorei muito meu ritmo.",
  },
] as const;

export const ADVISORY_FAQ = [
  {
    q: "Preciso já correr para entrar na assessoria?",
    a: "Não. Atendemos desde quem está começando do zero até corredores experientes — o plano é montado para o seu nível.",
  },
  {
    q: "Como recebo os treinos?",
    a: "Pelo aplicativo, com integração ao Strava/GPS. Você treina no seu horário e acompanha sua evolução.",
  },
  {
    q: "Preciso treinar junto com a comunidade?",
    a: "Os treinos são flexíveis e individuais. Mas você tem acesso aos encontros, eventos e ao grupo exclusivo de membros.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O plano mensal não tem fidelidade. Os planos semestral e anual oferecem economia e o kit grátis.",
  },
  {
    q: "O que está incluído no kit?",
    a: "Ecobag + camiseta de treino oficial Somma, grátis nos planos semestral e anual.",
  },
] as const;

export const TESTIMONIALS = [
  {
    nome: "Membro Somma",
    contexto: "Membro há 1 ano",
    frase:
      "Comecei sem conhecer ninguém e hoje o Somma virou meu compromisso favorito da semana.",
  },
  {
    nome: "Membro Somma",
    contexto: "Membro há 8 meses",
    frase: "O melhor do Somma é que você chega para correr e sai com amigos.",
  },
  {
    nome: "Membro Somma",
    contexto: "Membro há 6 meses",
    frase:
      "É uma comunidade leve, organizada e com uma energia que dá vontade de voltar todo sábado.",
  },
] as const;

export const FAQ = [
  {
    q: "O Somma Club é gratuito?",
    a: "Sim. Os encontros oficiais do Running Club são gratuitos e abertos ao público.",
  },
  {
    q: "Preciso ser corredor experiente?",
    a: "Não. O Somma recebe iniciantes, intermediários e corredores experientes. Você participa no seu ritmo.",
  },
  {
    q: "Onde acontecem os encontros?",
    a: "Todos os sábados, às 7h, no Parque da Cidade Sarah Kubitschek, Estacionamento 10, em Brasília.",
  },
  {
    q: "Preciso usar uniforme?",
    a: "Não. O uniforme não é obrigatório, mas camisetas e bonés Somma são bem-vindos para fortalecer a identidade da comunidade.",
  },
  {
    q: "Como faço para participar?",
    a: "Preencha o cadastro gratuito no site e apareça no próximo encontro de sábado.",
  },
] as const;

// Fotos reais do Somma — baixadas para /public/somma (sem dependência de hotlink).
const IMG = "/somma";
export const PHOTOS = {
  hero: `${IMG}/hero-background.jpg`,
  about: `${IMG}/SMSPD-372.jpg`,
  gallery: [
    `${IMG}/PDCSK217JAN-2433.jpg`,
    `${IMG}/PDCSK21FEV-1794.jpg`,
    `${IMG}/IMG_0888_JPG.jpg`,
    `${IMG}/EXQTSMM-284.jpg`,
    `${IMG}/SMSPD-372.jpg`,
    `${IMG}/hero-background.jpg`,
  ],
} as const;
