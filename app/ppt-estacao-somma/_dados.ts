/* ══════════════════════════════════════════════════════════════════════════
   Conteúdo da apresentação Estação SOMMA (SOMMA Club + Evolve).

   Nenhum número de membros, alunos, faturamento, frequência, investimento ou
   projeção: o material é conceitual e de decisão. O que não está documentado
   no projeto não entra como fato.
   ══════════════════════════════════════════════════════════════════════════ */

/** Fotografias reais do acervo SOMMA e dos encontros SOMMA x Evolve já no site. */
export const FOTOS = {
  parqueAereo: "/somma/EXQTSMM-284.jpg",
  parqueGrupo: "/somma/hero-background.jpg",
  parqueGrupo2: "/somma/IMG_0888_JPG.jpg",
  corrida: "/somma/PDCSK21FEV-1794.jpg",
  corrida2: "/somma/IMG_1479_JPG.jpg",
  pelotao: "/somma/SMSPD-372.jpg",
  energia: "/somma/PDCSK217JAN-2433.jpg",
  comunidade: "/midiakit/comunidade.jpg",
  wellness: "/midiakit/wellness.jpg",
  treino: "/midiakit/treino.jpg",
  capa: "/midiakit/capa.jpg",
  evolveNeon: "/desafio-esteiras-evolve/img/neon-evolve.jpg",
  evolveBootcamp: "/desafio-esteiras-evolve/img/bootcamp.jpg",
  evolveParede: "/desafio-esteiras-evolve/img/comunidade-escada.jpg",
  evolveFuncional: "/desafio-esteiras-evolve/imganes-evolve/SMEVLV-91.jpg",
  evolveEsteira: "/desafio-esteiras-evolve/img/hero-esteira.jpg",
  // Espaço Cerrado hoje e o gramado do entorno (pasta Projeto Estação Somma Club)
  espacoQuiosque: "/estacao-somma/espaco-cerrado-1.jpg",
  espacoEstrutura: "/estacao-somma/espaco-cerrado-2.jpg",
  espacoPlaca: "/estacao-somma/espaco-cerrado-3.jpg",
  espacoLateral: "/estacao-somma/espaco-cerrado-4.jpg",
  entornoGramado: "/estacao-somma/entorno-1.jpg",
  entornoEvento: "/estacao-somma/entorno-2.jpg",
  entornoArvores: "/estacao-somma/entorno-3.jpg",
  // Estudos conceituais da Estação (pasta Projeto Estação Somma Club/render)
  estudoA: "/estacao-somma/render-estudo-a.jpg",
  estudoB: "/estacao-somma/render-estudo-b.jpg",
  // Unidades Evolve (pasta Imagens-Evolve)
  evolveNoroeste: "/estacao-somma/evolve/Evolve-Noroeste-67.webp",
  evolveAsaNorte: "/estacao-somma/evolve/Evolve-Asa-Norte-18.webp",
  evolvePlus: "/estacao-somma/evolve/Evolve-Noroeste-48.webp",
  evolveTorneiras: "/estacao-somma/evolve/Evolve-Noroeste-17.webp",
  evolveVicentePires: "/estacao-somma/evolve/Evolve-Vicente-Pires-18.webp",
  evolveBootcampLogo: "/estacao-somma/evolve/Inauguracao-Nucleo-Bandeirante-27.webp",
} as const;

/* ── 02 · Oportunidade ─────────────────────────────────────────────────── */

export const OPORTUNIDADE = [
  "O Parque da Cidade é um dos principais pontos de esporte, corrida, caminhada e convivência de Brasília.",
  "Milhares de pessoas frequentam o espaço com recorrência.",
  "Existe a oportunidade de criar um ponto permanente de alimentação, encontro e experiência conectado a esse comportamento.",
] as const;

/* ── 02b · O movimento já existe ───────────────────────────────────────── */

/**
 * Casos brasileiros de espaços físicos de marca para corredores. Os vídeos
 * são registros públicos (Instagram) dos próprios espaços; as descrições vêm
 * das fontes listadas.
 */
export const CASOS = [
  {
    id: "marun",
    nome: "Casa Marun by New Balance",
    onde: "Lagoa Rodrigo de Freitas · Rio de Janeiro",
    texto:
      "Hub de seis dias na Maratona do Rio 2026: recovery, aulas, social club, loja e NB Coffee, num quiosque do Parque dos Patins.",
    fonte: "Live Marketing · Webrun, jun. 2026",
    logos: [
      { src: "/estacao-somma/logos/marun-branco.png", alt: "Marun Running Club", h: "h-4 md:h-5" },
      { src: "/estacao-somma/logos/new-balance.svg", alt: "New Balance", h: "h-7 md:h-8" },
    ],
    videos: [{ src: "/estacao-somma/videos/marun.mp4", poster: "/estacao-somma/videos/marun.jpg" }],
  },
  {
    id: "smartfit",
    nome: "Quiosque Smart Fit",
    onde: "Orla de Copacabana · Rio de Janeiro",
    texto:
      "Quiosque 24 da Avenida Atlântica, aberto 24 horas, com entrada livre: não precisa ser aluno para usar. Lanches, pratos, drinks e ponto de encontro na orla.",
    fonte: "smartfit.com.br/quiosque-smart-fit",
    logos: [{ src: "/estacao-somma/logos/smart-fit-branco.svg", alt: "Smart Fit", h: "h-7 md:h-8" }],
    videos: [{ src: "/estacao-somma/videos/smartfit.mp4", poster: "/estacao-somma/videos/smartfit.jpg" }],
  },
  {
    id: "simple",
    nome: "The Simple Run Club",
    onde: "Lagoa · Rio de Janeiro",
    texto:
      "QG do clube de corrida da The Simple Gym: vestiário, lockers, sauna e banheira de gelo, mais área de convivência. Em 2026 fechou a primeira parceria da On com uma assessoria no Brasil.",
    fonte: "Diário do Rio · Exame, 2026",
    logos: [{ src: "/estacao-somma/logos/the-simple-run-club.svg", alt: "The Simple Run Club", h: "h-10 md:h-12" }],
    videos: [
      { src: "/estacao-somma/videos/simple-tour.mp4", poster: "/estacao-somma/videos/simple-tour.jpg" },
      { src: "/estacao-somma/videos/simple-estrutura.mp4", poster: "/estacao-somma/videos/simple-estrutura.jpg" },
    ],
  },
] as const;

/* ── 02c · O que os dados dizem ────────────────────────────────────────── */

/** Só números com fonte pública. Cada item diz de onde veio. */
export const DADOS = [
  {
    numero: "+59%",
    titulo: "Participação em run clubs no mundo em 2024",
    texto: "Correr em grupo virou a atividade social que mais cresce na plataforma.",
    fonte: "Strava · Year in Sport 2024 (135 milhões de pessoas, 190 países)",
  },
  {
    numero: "58%",
    titulo: "Fizeram novos amigos em grupos de treino",
    texto: "E atividades em grupos de 10 ou mais duram em média 40% mais do que sozinho.",
    fonte: "Strava · Year in Sport 2024 (pesquisa global, 5 mil pessoas)",
  },
  {
    numero: "15 mi",
    titulo: "Corredores no Brasil em 2025",
    texto: "2 milhões a mais em 12 meses. Jovens de 18 a 24 anos passaram de 12% para 20% do total e caiu 8 pontos a parcela de quem corre sozinho.",
    fonte: "Olympikus e Box1824, nov. 2025 (1.179 entrevistados)",
  },
  {
    numero: "+85%",
    titulo: "Provas de rua no Brasil em um ano",
    texto: "De 2.827 eventos em 2024 para 5.241 em 2025. Mercado de cerca de R$ 1,1 bilhão.",
    fonte: "ABRACEO e CBAt · 4º Summit, jan. 2026",
  },
  {
    numero: "70 mil",
    titulo: "Inscritos na Maratona do Rio 2026",
    texto: "Mais de 40 marcas em ação. A New Balance respondeu com uma casa de seis dias para a comunidade.",
    fonte: "Live Marketing, jun. 2026",
  },
  {
    numero: "1 mi+",
    titulo: "Clubes ativos no Strava",
    texto: "A Geração Z é 75% mais propensa que a Geração X a citar uma prova ou evento como principal motivação.",
    fonte: "Strava · Year in Sport 2025",
  },
] as const;

/* ── 04 · Premissa ─────────────────────────────────────────────────────── */

export const SATELITES = ["SOMMA Club", "Evolve", "Recovery", "Lockers", "Aulas", "Comunidade", "Eventos"] as const;

/* ── 06 · Nova casa ────────────────────────────────────────────────────── */

export const HOJE = ["Ponto de encontro", "Treino", "Dispersão"] as const;

export const COM_A_ESTACAO = [
  "Chegada",
  "Café",
  "Lockers",
  "Encontro",
  "Treino",
  "Retorno",
  "Recovery",
  "Café da manhã",
  "Convivência",
] as const;

/* ── 06b · O que o SOMMA quer ──────────────────────────────────────────── */

/** Em tópicos, sem rodeio: o que o clube busca na Estação. */
export const SOMMA_QUER = [
  {
    titulo: "Migrar o point da comunidade",
    texto: "Sair do Estacionamento 10 e levar o ponto de encontro oficial para onde hoje é o Espaço Cerrado.",
    itens: [] as readonly string[],
  },
  {
    titulo: "Fazer do Espaço Cerrado a base do clube",
    texto: "Usar a estrutura existente como casa operacional do SOMMA.",
    itens: [
      "Guardar itens e equipamentos do clube",
      "Reunir o time e os alunos da assessoria",
      "Fazer eventos e ativações com as marcas parceiras",
      "Tornar o espaço um dos principais pontos dos corredores",
    ] as readonly string[],
  },
] as const;

/* ── 07 · Papel da Evolve ──────────────────────────────────────────────── */

export const EVOLVE_POSSIBILIDADES = [
  "Evolve Performance",
  "Área funcional outdoor",
  "Mobilidade",
  "Preparação física",
  "Aulas agendadas",
  "Experiências",
  "Recovery",
  "Lockers",
  "Benefícios para alunos",
] as const;

/* ── 08 · Academia Evolve ──────────────────────────────────────────────── */

/** O que a Evolve monta na Estação: academia outdoor, prática, com ponto de venda. */
export const ACADEMIA_EVOLVE = [
  { titulo: "Academia outdoor", texto: "Barras, kettlebells, funcional e força, integrados à arquitetura do Parque." },
  { titulo: "Espaço de alongamento", texto: "Área aberta para mobilidade, pré e pós treino, com orientação." },
  { titulo: "Maquinário prático", texto: "Poucos equipamentos, bem escolhidos, que funcionam ao ar livre e pedem pouca manutenção." },
  { titulo: "Esteira de teste e aquecimento", texto: "Para o corredor testar o tênis, aquecer antes do long run ou fazer um tiro curto." },
  { titulo: "Treino em pequenos grupos", texto: "Aulas orientadas da grade Evolve, com vaga reservada pelo app." },
  { titulo: "Ponto de venda Evolve", texto: "Quem se interessa fecha o plano ali mesmo: a Estação vira porta de entrada da rede." },
] as const;

/* ── 09 · Recovery ─────────────────────────────────────────────────────── */

export const RECOVERY = [
  "Banheira de gelo",
  "Compression boots",
  "Massage guns",
  "Mobilidade",
  "Alongamento",
  "Área de descanso",
] as const;

/** Modelo proposto: o Evolve+ banca o recovery e ganha exclusividade com ele. */
export const RECOVERY_MODELO = [
  { quem: "Evolve+", regra: "Até 3 vouchers por mês de recovery grátis. Depois, compra o crédito com desconto." },
  { quem: "Aluno Evolve", regra: "Compra o crédito com tarifa de aluno." },
  { quem: "Membro SOMMA e visitante", regra: "Crédito avulso pelo valor integral." },
] as const;

/** Referência de mercado para o crédito avulso de recovery, em agosto de 2026. */
export const RECOVERY_REFERENCIA = {
  quem: "The Simple Gym · Pass",
  texto: "Vende crédito avulso de recovery: R$ 67 para membro e R$ 97 para não membro, individual e intransferível.",
  fonte: "thesimplegym.com.br, ago. 2026",
} as const;

/* ── 10 · Lockers ──────────────────────────────────────────────────────── */

export const LOCKERS_NIVEIS = ["Visitante", "SOMMA", "Aluno Evolve", "Evolve+"] as const;

/* ── 10b · Créditos avulsos ────────────────────────────────────────────── */

/**
 * Áreas da Estação que geram receita por uso. As marcadas como sugestão são
 * ideias adicionais para decidir em conjunto.
 */
export const CREDITOS = [
  {
    titulo: "Recovery",
    texto: "Vouchers mensais para Evolve+, crédito com desconto para aluno e valor integral para o público.",
    sugestao: false,
  },
  {
    titulo: "Lockers",
    texto: "Diária ou mensal. Incluso para Evolve+, condição para aluno e para o SOMMA nos dias de treino.",
    sugestao: false,
  },
  {
    titulo: "Quadra ao lado",
    texto: "Agenda online e pagamento pelo app. Aluno Evolve com condição especial e horários prioritários.",
    sugestao: false,
  },
  {
    titulo: "Ducha e vestiário avulso",
    texto: "Para quem corre antes do trabalho e segue direto do Parque. Incluso nos planos, avulso para o público.",
    sugestao: true,
  },
  {
    titulo: "Aulas especiais e clínicas",
    texto: "Turmas pagas de força para corredores, mobilidade, técnica de corrida e workshops com convidados.",
    sugestao: true,
  },
  {
    titulo: "Eventos e ativações",
    texto: "Locação do espaço para marcas, empresas e aniversários fora do horário de pico, com o café operando.",
    sugestao: true,
  },
  {
    titulo: "Loja",
    texto: "Produtos SOMMA e Evolve, edições com parceiros e itens de conveniência para quem treina.",
    sugestao: true,
  },
] as const;

/* ── 11 · Aulas ────────────────────────────────────────────────────────── */

export const AULAS = [
  "Mobilidade",
  "Funcional",
  "Força para corredores",
  "Core",
  "Alongamento",
  "Recovery",
  "Treinos especiais",
] as const;

/* ── 12 · Camada digital ───────────────────────────────────────────────── */

/** O que a camada digital resolve, em linguagem de uso, não de sistema. */
export const DIGITAL_JORNADA = [
  {
    titulo: "Antes",
    texto: "O aluno vê a agenda da Estação no app, reserva a aula outdoor, o horário de recovery e o check in do corre de sábado.",
  },
  {
    titulo: "Na chegada",
    texto: "Check in por QR Code na Estação. O locker é liberado e o café já reconhece o benefício do plano.",
  },
  {
    titulo: "Depois",
    texto: "Créditos debitados, desconto aplicado no consumo e o treino somado aos desafios e atividades SOMMA.",
  },
] as const;

export const DIGITAL = [
  "Check in do corre de sábado",
  "Agenda de aulas e reserva",
  "Check in por QR Code",
  "Recovery, lockers e quadra",
  "Créditos e vouchers",
  "Benefícios e descontos",
  "Desafios SOMMA",
  "Eventos na Estação",
  "Novidades das unidades Evolve",
  "Pedido e pagamento no café",
] as const;

/* ── 12b · Um sistema, duas marcas ─────────────────────────────────────── */

/** Vantagens de unificar a operação digital da Estação com a Evolve e o SOMMA. */
export const SISTEMA_VANTAGENS = [
  { titulo: "Um cadastro", texto: "Aluno Evolve, membro SOMMA e visitante no mesmo sistema, com o mesmo login." },
  { titulo: "Uma agenda", texto: "Aulas nas unidades, aulas outdoor, treinos SOMMA e recovery no mesmo calendário." },
  { titulo: "Uma carteira", texto: "Créditos, benefícios e descontos do plano valendo na academia e na Estação." },
  { titulo: "Um check in", texto: "QR Code na catraca da unidade e na chegada ao Parque, com a mesma leitura." },
  { titulo: "Uma base de dados", texto: "Frequência, consumo e participação em um só lugar para relacionamento e retenção." },
  { titulo: "Um funil", texto: "Quem chega pelo SOMMA entra no sistema e pode virar aluno Evolve sem atrito." },
] as const;

/* ── 13 · Café ─────────────────────────────────────────────────────────── */

/** O que servir, organizado pelo momento de quem frequenta o Parque. */
export const CAFE_MOMENTOS = [
  {
    momento: "Antes do treino",
    itens: ["Café especial", "Pré treino", "Bebidas funcionais", "Snacks leves"],
  },
  {
    momento: "Depois do treino",
    itens: ["Açaí", "Bowls", "Smoothies", "Pós treino"],
  },
  {
    momento: "Para ficar",
    itens: ["Breakfast", "Brunch", "Sanduíches", "Café coado e espresso"],
  },
] as const;

export const CARDAPIO = [
  "Café especial",
  "Breakfast",
  "Açaí",
  "Bowls",
  "Sanduíches",
  "Snacks",
  "Smoothies",
  "Bebidas funcionais",
  "Pré treino",
  "Pós treino",
  "Brunch",
] as const;

export const OPERACAO = [
  { titulo: "Operada diretamente", texto: "A operação de A&B conduzida pelo próprio projeto." },
  { titulo: "Operada em parceria", texto: "Operação dividida com um parceiro de alimentação." },
  { titulo: "Licenciada", texto: "Espaço licenciado para um operador especializado." },
] as const;

/* ── 13a · Parceiro de A&B: Bugu ───────────────────────────────────────── */

/**
 * Bugu Delícias Caseiras, parceiro do SOMMA desde o começo do clube. Dados do
 * site (bugudelicias.com.br), do cardápio publicado e do Instagram
 * (@bugu_delicias), consultados em agosto de 2026.
 */
export const BUGU = {
  nome: "Bugu Delícias Caseiras",
  slogan: "Comida simples e feita com amor",
  onde: "QNJ 32, Taguatinga · Brasília",
  porque: [
    "Parceiro do SOMMA desde o começo do clube",
    "Café colonial por quilo, cafés e confeitaria caseira: o cardápio que a Estação pede",
    "Opera café da manhã e café da tarde, com eventos, reservas e delivery",
    "Estilo de comida e modo de operar casam com o Parque",
  ],
  fatos: [
    { valor: "80 mil", rotulo: "seguidores no Instagram" },
    { valor: "Ter a dom", rotulo: "café colonial, manhã e tarde" },
    { valor: "Por quilo", rotulo: "buffet que escala para o pós treino" },
  ],
  cardapio: ["Café colonial", "Cafés e cappuccinos", "Bolos e tortas", "Panquecas", "Salgados caseiros", "Delivery"],
  fotos: {
    salao: "/estacao-somma/bugu/bugu-salao.jpg",
    ambiente: "/estacao-somma/bugu/bugu-ambiente.jpg",
    mesa: "/estacao-somma/bugu/bugu-mesa.jpg",
    pao: "/estacao-somma/bugu/bugu-pao.jpg",
  },
  logoEscuro: "/estacao-somma/logos/bugu-branco.png",
  logoClaro: "/estacao-somma/logos/bugu-preto.png",
} as const;

/* ── 13b · Marcas no complexo ──────────────────────────────────────────── */

/** Como outras marcas entram na Estação: operação, experiência, naming rights. */
export const MARCAS_FORMATOS = [
  {
    titulo: "Operação do café em parceria",
    texto: "SOMMA e Evolve podem convidar marcas que já operam no DF para operar ou co-assinar o café.",
  },
  {
    titulo: "Pontos de experiência",
    texto: "Espaços de teste de produto dentro do complexo, como um ponto de teste de calçados.",
  },
  {
    titulo: "Naming rights",
    texto: "Áreas da Estação (recovery, lockers, arena funcional, eventos) podem levar a assinatura de uma marca.",
  },
] as const;

/**
 * Marcas com conversa possível. Nenhuma negociação está fechada: entram aqui
 * como possibilidade. Logos: Silver Care (acervo do site), Decathlon, Centauro
 * e Adidas (Wikimedia Commons).
 */
export const MARCAS = [
  {
    nome: "Bugu Delícias Caseiras",
    papel: "Operação do café (parceiro proposto)",
    logos: [{ src: "/estacao-somma/logos/bugu-preto.png", alt: "Bugu Delícias Caseiras", h: "h-11 md:h-12" }],
  },
  {
    nome: "Silver Care",
    papel: "Proteção solar e autocuidado no Parque",
    logos: [{ src: "/estacao-somma/logos/silver-care.webp", alt: "Silver Care", h: "h-9 md:h-11" }],
  },
  {
    nome: "Decathlon ou Centauro",
    papel: "Ponto de teste de calçados",
    logos: [
      { src: "/estacao-somma/logos/decathlon.svg", alt: "Decathlon", h: "h-4 md:h-[1.15rem]" },
      { src: "/estacao-somma/logos/centauro.svg", alt: "Centauro", h: "h-3.5 md:h-4" },
    ],
  },
  {
    nome: "Adidas Centro-Oeste",
    papel: "Marca esportiva do complexo",
    logos: [{ src: "/estacao-somma/logos/adidas.svg", alt: "Adidas", h: "h-10 md:h-12" }],
  },
] as const;

/* ── 14 · Benefícios ───────────────────────────────────────────────────── */

export const BENEFICIOS = [
  "Desconto no café",
  "Desconto no recovery",
  "Créditos mensais",
  "Prioridade em reservas",
  "Aulas outdoor",
  "Eventos",
  "Experiências exclusivas",
  "Vantagens progressivas para Evolve+",
] as const;

/* ── 15 · Evolve+ ──────────────────────────────────────────────────────── */

export const EVOLVE_PLUS = [
  "Recovery com vouchers mensais",
  "Espaço premium da Estação",
  "Breakfast experiences",
  "Aulas exclusivas",
  "Eventos fechados",
  "Long runs especiais",
  "Convidados",
  "Experiências de marcas",
  "Prioridade de reservas",
] as const;

/** Ponte Evolve+ e assessoria SOMMA: a Evolve vende o plano, o SOMMA converte o aluno. */
export const ASSESSORIA_CONDICOES = [
  { quem: "Evolve+", regra: "1º mês da assessoria SOMMA grátis ao fechar o plano. Depois, desconto especial na mensalidade." },
  { quem: "Aluno Evolve", regra: "Condição própria na assessoria, menor que a do Evolve+." },
  { quem: "SOMMA", regra: "Recebe o aluno no 1º mês e trabalha a conversão para a assessoria." },
] as const;

/* ── 16 · SOMMA + Evolve ───────────────────────────────────────────────── */

export const FORCAS_SOMMA = ["Comunidade", "Corrida", "Eventos", "Conteúdo", "Experiência outdoor", "Aquisição"] as const;
export const FORCAS_EVOLVE = ["Academia", "Performance", "Estrutura", "Recovery", "Base de alunos", "Produto premium"] as const;
export const FORCAS_ESTACAO = ["A&B", "Hospitality", "Comunidade", "Conversão", "Permanência", "Relacionamento"] as const;

/* ── 17 · Ciclo de valor ───────────────────────────────────────────────── */

export const CICLO = [
  { a: "Comunidade", b: "gera fluxo" },
  { a: "Fluxo", b: "gera consumo" },
  { a: "Consumo", b: "sustenta o espaço" },
  { a: "Experiência", b: "gera relacionamento" },
  { a: "Relacionamento", b: "gera aquisição e retenção" },
] as const;

/* ── 18 · Receitas e valor ─────────────────────────────────────────────── */

export const RECEITA_DIRETA = [
  "Café",
  "Alimentação",
  "Bebidas",
  "Recovery, quando aplicável",
  "Experiências, quando aplicável",
] as const;

export const VALOR_INDIRETO = [
  "Aquisição de alunos",
  "Upgrade para Evolve+",
  "Retenção",
  "Branding",
  "Conteúdo",
  "Relacionamento",
  "Eventos",
  "Ativações de marcas",
] as const;

/* ── 19 · Por que importa ──────────────────────────────────────────────── */

export const PORQUE = [
  { titulo: "Presença", texto: "A Evolve passa a ocupar o principal território outdoor de Brasília." },
  { titulo: "Aquisição", texto: "Contato recorrente com uma comunidade que já pratica atividade física." },
  { titulo: "Retenção", texto: "Mais benefícios e experiências para os alunos atuais." },
  { titulo: "Marca", texto: "Evolve deixa de existir apenas dentro das suas unidades." },
] as const;

/* ── 21 · Construção a quatro mãos ─────────────────────────────────────── */

export const FRENTES = [
  "Conceito",
  "Arquitetura",
  "Operação",
  "A&B",
  "Experiência Evolve",
  "Recovery",
  "Modelo de benefícios",
  "Tecnologia",
  "Branding",
  "Modelo comercial",
  "Governança",
] as const;

/* ── 22 · Próximos passos ──────────────────────────────────────────────── */

export const PASSOS = [
  "Validação estratégica Evolve",
  "Validação jurídica e regulatória do espaço",
  "Programa arquitetônico",
  "Definição do operador de A&B",
  "Modelo econômico",
  "Definição das experiências Evolve",
  "Projeto preliminar",
  "Orçamento",
  "Modelo de parceria",
  "Implantação",
] as const;
