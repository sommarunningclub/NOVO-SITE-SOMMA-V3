/**
 * BORA com SOMMA (sommaclub.com.br/boracomsomma): o corre de 14/11/2026 que
 * anuncia oficialmente a BORA Assessoria como assessoria oficial do SOMMA Club.
 *
 * O evento de verdade mora na tabela `eventos` (slug `boracomsomma`), criado e
 * controlado pela gestão: data, horário, local, pelotões e status do check-in
 * vêm de lá, e as inscrições caem em `checkins`, como em qualquer encontro.
 * O que está aqui é o fallback da página enquanto o evento não existe no banco
 * e o conteúdo fixo da BORA.
 *
 * Conteúdo da BORA: o mesmo da BORA Experience (/ppt-somma-bora), que segue o
 * briefing oficial de 20/10/2026. O que lá estava "a confirmar" não entra aqui.
 * Sem travessão na copy.
 */

export const SLUG = "boracomsomma";
export const PAGINA_RASTREIO = "boracomsomma";
export const URL_LP = "https://sommaclub.com.br/boracomsomma";

/** Usado só enquanto a gestão não cria o evento no banco. */
export const EVENTO_PADRAO = {
  titulo: "SOMMA Club ft. BORA Assessoria",
  data: "2026-11-14",
  horario: "07:00",
  local: "Parque da Cidade, Estacionamento 10",
  cidade: "Brasília, DF",
  pelotoes: ["4km", "6km", "8km"],
};

/**
 * Ponto de encontro: Estacionamento 10 do Parque da Cidade. Não há pino oficial
 * do estacionamento, então o link é uma busca no Google Maps pelo nome, que cai
 * no lugar certo. Se a gestão preencher `local_url` no evento, vale o dela.
 */
const BUSCA_MAPA = "Estacionamento 10, Parque da Cidade Sarah Kubitschek, Brasília - DF";
/** Coordenada do Estacionamento 10 devolvida pela Places API (cravada para o mapa não depender de geocodificação). */
export const GEO = { lat: -15.8026153, lng: -47.9049729 } as const;

export const MAPA = {
  url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSCA_MAPA)}`,
  embed: `https://www.google.com/maps?q=${encodeURIComponent(BUSCA_MAPA)}&z=16&output=embed`,
};

export const PELOTOES: Record<string, { rotulo: string; descricao: string }> = {
  "4km": { rotulo: "Ritmo iniciante", descricao: "Alterna corrida e caminhada" },
  "6km": { rotulo: "Ritmo moderado", descricao: "Pace aproximado de 6'30\"" },
  "8km": { rotulo: "Ritmo avançado", descricao: "Pace aproximado de 5'30\"" },
};

export const YANN = {
  nome: "Yann Rodrigues",
  instagram: "https://www.instagram.com/yannrodrigues/",
  arroba: "@yannrodrigues",
  foto: "/boracomsomma/fotos/yann-rodrigues.jpg",
  fatos: [
    { valor: "2h43", rotulo: "na maratona" },
    { valor: "611 mil", rotulo: "seguidores" },
    { valor: "BORA", rotulo: "fundador" },
  ],
  bio: "Maratonista, compositor nas horas vagas, fundador da BORA Assessoria e embaixador adidas e Netshoes.",
};

export const PROGRAMACAO = [
  {
    titulo: "Corre SOMMA",
    texto: "Os pelotões de sempre, 4, 6 e 8 km, com a energia de um sábado de encontro geral.",
  },
  {
    titulo: "Anúncio oficial",
    texto: "A BORA passa a ser, oficialmente, a assessoria do SOMMA Club. Um novo ciclo começa ali, no parque.",
  },
  {
    titulo: "Yann Rodrigues no corre",
    texto: "O fundador da BORA corre com a gente, do aquecimento até a última foto.",
  },
  {
    titulo: "O desafio mais irado",
    texto: "Os desafios do Yann rodam o Brasil. No dia 14 ele traz um para o Parque da Cidade. Quem topa?",
  },
];

export const BENEFICIOS = [
  "Planilhas individualizadas",
  "Acompanhamento personalizado",
  "Feedbacks e ajustes",
  "Aplicativo exclusivo",
  "Comunidade nacional",
  "Pontos de apoio",
  "Treinos para diferentes níveis",
  "Suporte contínuo",
  "Metodologia de evolução",
];

export const METODO = [
  { titulo: "Planilha individual", texto: "Montada para o seu momento, seu objetivo e sua rotina." },
  { titulo: "Treino", texto: "Você executa, no ponto presencial ou onde estiver." },
  { titulo: "Feedback semanal", texto: "O professor lê como foi e responde." },
  { titulo: "Ajuste", texto: "A planilha muda com você, semana a semana." },
  { titulo: "Reuniões periódicas", texto: "Conversa de rota: objetivo, prova alvo e próximos ciclos." },
];

export const MODALIDADES = [
  { nome: "Corrida", texto: "Do primeiro 5 km à maratona.", icone: "/boracomsomma/marca/icon-corrida-green.png" },
  {
    nome: "Triatlo",
    texto: "Natação, ciclismo e corrida com planejamento integrado.",
    icone: "/boracomsomma/marca/icon-bike-green.png",
  },
  { nome: "Natação", texto: "Disciplina do triatlo, com planilha própria.", icone: "/boracomsomma/marca/icon-nado-green.png" },
];

export const RUNY = {
  recursos: [
    "Treino do dia no app e no relógio",
    "Chat com o seu treinador, no contexto de cada treino",
    "Gráficos e evolução sem sair do app",
  ],
  desafios: ["Desafios Runy todo mês, com prêmios e sorteios", "Desafios exclusivos da assessoria", "Sem custo extra para você"],
  telas: ["/boracomsomma/runy/app-tela-1.png", "/boracomsomma/runy/app-tela-2.png", "/boracomsomma/runy/app-tela-3.png"],
  relogios: [
    { nome: "Garmin", logo: "/boracomsomma/relogios/garmin.png" },
    { nome: "Apple Watch", logo: "/boracomsomma/relogios/apple-watch.png" },
    { nome: "Polar", logo: "/boracomsomma/relogios/polar.png" },
    { nome: "Strava", logo: "/boracomsomma/relogios/strava.png" },
  ],
};

export const PONTOS = [
  {
    nome: "Parque da Cidade",
    horarios: [
      { dia: "Terça e quinta", faixas: ["06h às 08h30", "18h30 às 20h30"] },
      { dia: "Sábado", faixas: ["06h às 10h30"] },
    ],
  },
  {
    nome: "Noroeste",
    horarios: [{ dia: "Terça e quinta", faixas: ["06h30 às 08h", "18h15 às 20h15"] }],
  },
];

export const CIDADES = [
  "Brasília",
  "São Paulo",
  "São José dos Campos",
  "Indaiatuba",
  "Belo Horizonte",
  "Lagoa da Prata",
  "Rio de Janeiro",
  "Santa Catarina",
  "Vitória",
  "Natal",
  "Recife",
  "Miami",
];

export const PARCEIROS = [
  { nome: "adidas", logo: "/boracomsomma/parceiros/adidas.svg", filtro: "branco" },
  { nome: "Netshoes", logo: "/boracomsomma/parceiros/netshoes.png", filtro: "branco" },
  { nome: "DUX", logo: "/boracomsomma/parceiros/dux.png", filtro: "branco" },
  { nome: "Liquidz", logo: "/boracomsomma/parceiros/liquidz.svg", filtro: "nenhum" },
  { nome: "Dobro", logo: "/boracomsomma/parceiros/dobro.png", filtro: "nenhum" },
] as const;

export const FOTOS = [
  { src: "/boracomsomma/fotos/bora-5.jpg", alt: "Turma da BORA reunida depois do treino" },
  { src: "/boracomsomma/fotos/bora-10.jpg", alt: "Atleta BORA comemorando na prova" },
  { src: "/boracomsomma/fotos/bora-1.jpg", alt: "Turma da BORA na praia" },
  { src: "/boracomsomma/fotos/bora-11.jpg", alt: "Pelotão BORA na prova" },
  { src: "/boracomsomma/fotos/bora-4.jpg", alt: "Casa BORA em dia de prova" },
  { src: "/boracomsomma/fotos/bora-2.jpg", alt: "Carro da BORA na areia" },
];

export const VIDEOS = [
  {
    src: "/boracomsomma/videos/bora-hyperboost.mp4",
    poster: "/boracomsomma/videos/bora-hyperboost.jpg",
    titulo: "Treino BORA com a adidas",
  },
  {
    src: "/boracomsomma/videos/bora-miami.mp4",
    poster: "/boracomsomma/videos/bora-miami.jpg",
    titulo: "BORA Miami, treino na pista",
  },
];

export const PERGUNTAS = [
  {
    p: "Preciso ser aluno da BORA para correr?",
    r: "Não. O corre é do SOMMA Club e é aberto a todo mundo. Basta fazer o check-in aqui na página.",
  },
  {
    p: "Quanto custa?",
    r: "Nada. Os encontros do SOMMA Club são gratuitos.",
  },
  {
    p: "Qual distância eu corro?",
    r: "Você escolhe o pelotão no check-in: 4 km (alterna corrida e caminhada), 6 km ou 8 km. Dá para trocar no dia, sem problema.",
  },
  {
    p: "O que muda para quem já treinava na assessoria do SOMMA?",
    r: "Os professores são os mesmos e a rotina de treinos continua. A assessoria agora é a BORA, com estrutura nacional, app próprio e comunidade em várias cidades.",
  },
  {
    p: "Como faço para treinar com a BORA?",
    r: "Deixe nome e WhatsApp no botão \"Falar com um professor\". A conversa abre direto com um professor BORA.",
  },
];
