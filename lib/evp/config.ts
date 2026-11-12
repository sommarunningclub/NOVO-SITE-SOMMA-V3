/**
 * Meeting Técnico | Maratona Monumental de Brasília 2026.
 * Pode ser importado no cliente: aqui não há segredo.
 *
 * DADOS DA PROVA: tudo o que está em `DISTANCIAS` e `PROVA` saiu do regulamento
 * oficial 2026 (v6, PDF publicado pela organização) e da página de percursos.
 * Não acrescentar altimetria, ponto de retorno ou trecho crítico que não esteja
 * lá. O Meeting é da SOMMA e da BORA; a prova é de outra organização.
 */

export const SLUG = "maratonamonumental2026";
export const CAMINHO = "/maratonamonumental2026";
export const SITE = "https://sommaclub.com.br";
export const URL_LP = `${SITE}${CAMINHO}`;

export const NOME_EVENTO = "Meeting Técnico | Maratona Monumental de Brasília 2026";
export const NOME_CURTO = "Meeting Técnico";
export const PREFIXO_CODIGO = "MT";
/** Prefixo do conteúdo do QR Code. O resto é um identificador aleatório. */
export const PREFIXO_QR = "SOMMA-EVP:";

export const PROVA = {
  nome: "Maratona Monumental de Brasília 2026",
  site: "https://maratonamonumentalbsb.com.br",
  percursos: "https://maratonamonumentalbsb.com.br/percursos/",
  regulamento:
    "https://maratonamonumentalbsb.com.br/wp-content/uploads/2026/07/v6-REGULAMENTO-MARATONA-MONUMENTAL-2026.pdf",
  inscricao: "https://www.ticketsports.com.br/e/maratona-monumental-de-brasilia-2026-74828",
  largada: "Esplanada dos Ministérios, Área Central, Brasília/DF, ao lado dos blocos A e B",
  chegada: "Esplanada dos Ministérios, Área Central, Brasília/DF",
  /** Centro da Esplanada: referência de região, não o ponto exato do pórtico. */
  regiao: { lat: -15.7989, lng: -47.8642 },
  kit: {
    local: "Pátio Brasil Shopping",
    endereco: "SCS Quadra 7, Bloco A, Asa Sul, Brasília/DF",
    janelas: ["19 e 20/11, das 9h às 19h", "21/11, das 9h às 14h"],
  },
} as const;

export const DISTANCIAS_BASE = ["5k", "10k", "21k", "42k"] as const;
export type DistanciaBase = (typeof DISTANCIAS_BASE)[number];

/** Combinações do Desafio Monumental previstas no regulamento. */
export const DESAFIOS = ["5k+21k", "10k+21k", "5k+42k", "10k+42k"] as const;
/** Quem não vai correr a Monumental e só quer participar do encontro. */
export const SEM_PROVA = "nao_corre" as const;
export const DISTANCIAS_INSCRICAO = [...DISTANCIAS_BASE, ...DESAFIOS, SEM_PROVA] as const;
export type DistanciaInscricao = (typeof DISTANCIAS_INSCRICAO)[number];

export const ROTULO_DISTANCIA: Record<DistanciaInscricao, string> = {
  "5k": "5 km",
  "10k": "10 km",
  "21k": "21 km",
  "42k": "42 km",
  "5k+21k": "Desafio Monumental · 5 km + 21 km",
  "10k+21k": "Desafio Monumental · 10 km + 21 km",
  "5k+42k": "Desafio Monumental · 5 km + 42 km",
  "10k+42k": "Desafio Monumental · 10 km + 42 km",
  nao_corre: "Não vai correr, só participar",
};

export const ROTULO_CURTO: Record<DistanciaInscricao, string> = {
  "5k": "5 km",
  "10k": "10 km",
  "21k": "21 km",
  "42k": "42 km",
  "5k+21k": "5 + 21 km",
  "10k+21k": "10 + 21 km",
  "5k+42k": "5 + 42 km",
  "10k+42k": "10 + 42 km",
  nao_corre: "Não corre",
};

/** Distância que o mapa e o seletor destacam para cada opção do formulário. */
export function distanciaPrincipal(d: DistanciaInscricao): DistanciaBase {
  if (d === SEM_PROVA) return "21k";
  if (d.includes("42k")) return "42k";
  if (d.includes("21k")) return "21k";
  return d as DistanciaBase;
}

export type PontoApoio = { km: number; tipos: ("agua" | "esponja" | "isotonico" | "alimentacao" | "banheiro" | "medico")[] };
export type PontoCorte = { km: number; limite: string; regra: string };

export type Distancia = {
  id: DistanciaBase;
  numero: string;
  unidade: string;
  titulo: string;
  oficial: string;
  metros: number;
  data: string;
  dia: string;
  largada: string;
  ondas: { nome: string; hora: string }[];
  limite: string;
  idadeMinima: string;
  cortes: PontoCorte[];
  apoio: PontoApoio[];
  /** O que o Meeting aborda para quem corre esta distância. */
  assuntos: string[];
  /** Logística da prova, do regulamento. */
  logistica: string[];
  mapaOficial: string;
};

function juntarApoio(grupos: Partial<Record<PontoApoio["tipos"][number], number[]>>): PontoApoio[] {
  const porKm = new Map<number, PontoApoio["tipos"]>();
  for (const [tipo, kms] of Object.entries(grupos) as [PontoApoio["tipos"][number], number[]][]) {
    for (const km of kms) porKm.set(km, [...(porKm.get(km) ?? []), tipo]);
  }
  return [...porKm.entries()].sort((a, b) => a[0] - b[0]).map(([km, tipos]) => ({ km, tipos }));
}

const ONDAS_SABADO = [
  { nome: "PCD", hora: "17h00" },
  { nome: "Elite, Vip/Black e Geral", hora: "17h03" },
];

export const DISTANCIAS: Record<DistanciaBase, Distancia> = {
  "5k": {
    id: "5k",
    numero: "5",
    unidade: "KM",
    titulo: "Cinco quilômetros",
    oficial: "5 km",
    metros: 5000,
    data: "21/11/2026",
    dia: "Sábado",
    largada: "17h",
    ondas: ONDAS_SABADO,
    limite: "1h00",
    idadeMinima: "14 anos completos até 31/12/2026",
    cortes: [],
    apoio: [],
    assuntos: [
      "Como montar o sábado para largar bem às 17h: refeições, hidratação e descanso ao longo do dia.",
      "Aquecimento e posicionamento em uma largada única, com todo o pelotão geral saindo junto.",
      "Ritmo para uma prova curta: como não gastar tudo no primeiro quilômetro.",
      "Para quem estreia: o que esperar da arena, do funil de largada e da chegada.",
    ],
    logistica: [
      "Largada e chegada na Esplanada dos Ministérios.",
      "Largada no sábado, 21/11: PCD às 17h00, demais atletas às 17h03.",
      "Tempo limite de 1h00 a partir da largada.",
    ],
    mapaOficial: "https://maratonamonumentalbsb.com.br/wp-content/uploads/2026/11/MAPA-Percurso05km-2026.pdf",
  },
  "10k": {
    id: "10k",
    numero: "10",
    unidade: "KM",
    titulo: "Dez quilômetros",
    oficial: "10 km",
    metros: 10000,
    data: "21/11/2026",
    dia: "Sábado",
    largada: "17h",
    ondas: ONDAS_SABADO,
    limite: "1h30",
    idadeMinima: "16 anos completos até 31/12/2026",
    cortes: [],
    apoio: [],
    assuntos: [
      "Divisão dos 10 km em blocos: onde segurar, onde sustentar e quando soltar.",
      "Prova de fim de tarde: como chegar hidratado e alimentado na hora certa.",
      "Largada única com 5 km e 10 km no mesmo horário: como se posicionar.",
      "Erros de ritmo mais comuns na distância e como evitar cada um.",
    ],
    logistica: [
      "Largada e chegada na Esplanada dos Ministérios.",
      "Largada no sábado, 21/11: PCD às 17h00, demais atletas às 17h03.",
      "Tempo limite de 1h30 a partir da largada.",
    ],
    mapaOficial: "https://maratonamonumentalbsb.com.br/wp-content/uploads/2026/11/MAPA-Percurso10km-2026.pdf",
  },
  "21k": {
    id: "21k",
    numero: "21",
    unidade: "KM",
    titulo: "Meia maratona",
    oficial: "21,097 km",
    metros: 21097,
    data: "22/11/2026",
    dia: "Domingo",
    largada: "6h",
    ondas: [
      { nome: "PCD", hora: "6h00" },
      { nome: "Elite e Vip/Black", hora: "6h03" },
      { nome: "Verde", hora: "6h05" },
      { nome: "Amarelo", hora: "6h08" },
      { nome: "Azul", hora: "6h10" },
      { nome: "Branco", hora: "6h13" },
      { nome: "Preto", hora: "6h15" },
      { nome: "Vermelho", hora: "6h18" },
      { nome: "Roxo", hora: "6h20" },
    ],
    limite: "3h15",
    idadeMinima: "18 anos completos até 31/12/2026",
    cortes: [
      {
        km: 14,
        limite: "2h20",
        regra: "Passagem até 2h20 de tempo bruto, contados a partir da largada do Pelotão Roxo.",
      },
    ],
    apoio: juntarApoio({
      agua: [2.6, 5.5, 8, 10, 12.5, 14.9, 17.2, 19],
      esponja: [8, 14.9, 19],
      isotonico: [14.9],
      alimentacao: [14.9],
      banheiro: [2.6, 8, 14.9, 19],
    }),
    assuntos: [
      "Estratégia de ritmo para os 21 km e como o seu pelotão de largada entra nessa conta.",
      "O ponto de corte do km 14: o que ele significa e como planejar com folga.",
      "Plano de hidratação usando os 8 postos de água do percurso, com isotônico e alimentação no km 14,9.",
      "Para quem estreia na meia: o que costuma mudar depois do km 15 e como se preparar para isso.",
    ],
    logistica: [
      "Largada e chegada na Esplanada dos Ministérios.",
      "Largadas no domingo, 22/11, a partir das 6h00, em pelotões por pace.",
      "Tempo limite de 3h15 a partir da largada.",
      "Água em 8 pontos; esponjas nos km 8, 14,9 e 19; isotônico e alimentação no km 14,9.",
    ],
    mapaOficial: "https://maratonamonumentalbsb.com.br/wp-content/uploads/2026/11/MAPA-Percurso21km-2026.pdf",
  },
  "42k": {
    id: "42k",
    numero: "42",
    unidade: "KM",
    titulo: "Maratona",
    oficial: "42,195 km",
    metros: 42195,
    data: "22/11/2026",
    dia: "Domingo",
    largada: "5h",
    ondas: [
      { nome: "PCD", hora: "5h00" },
      { nome: "Elite e Vip/Black", hora: "5h03" },
      { nome: "Verde", hora: "5h05" },
      { nome: "Amarelo", hora: "5h08" },
      { nome: "Azul", hora: "5h10" },
      { nome: "Branco", hora: "5h13" },
      { nome: "Vermelho", hora: "5h15" },
      { nome: "Preto", hora: "5h18" },
      { nome: "Roxo", hora: "5h20" },
    ],
    limite: "6h30",
    idadeMinima: "20 anos completos até 31/12/2026",
    cortes: [
      {
        km: 14,
        limite: "2h20",
        regra: "Corte 1: passagem até 2h20 de tempo bruto, contados a partir da largada do Pelotão Roxo.",
      },
      {
        km: 25.3,
        limite: "4h00",
        regra: "Corte 2: passagem até 4h00 de tempo bruto, contados a partir da largada do Pelotão Roxo.",
      },
    ],
    apoio: juntarApoio({
      agua: [2.6, 5.5, 8, 10, 12.5, 14.9, 17.5, 20, 22.6, 25.3, 28, 30.6, 33.1, 35.3, 37.7, 39.5],
      esponja: [8, 14.9, 20, 25.3, 30.6, 35.3, 39.5],
      isotonico: [14.9, 25.3, 35.6],
      alimentacao: [14.9, 25.3, 35.3],
      banheiro: [2.6, 8, 14.9, 20, 25.3, 30.6, 35.3, 39.5],
      medico: [14.9, 25.3],
    }),
    assuntos: [
      "Como dividir os 42 km em etapas e chegar inteiro à segunda metade.",
      "Os dois pontos de corte, no km 14 e no km 25,3, e o ritmo mínimo que cada um pede.",
      "Plano de hidratação e alimentação com os 16 postos de água e os pontos de isotônico e comida.",
      "Largada às 5h: sono, café da manhã, deslocamento e aquecimento ainda de madrugada.",
      "Para quem estreia na maratona: o que planejar para os quilômetros finais.",
    ],
    logistica: [
      "Largada e chegada na Esplanada dos Ministérios.",
      "Largadas no domingo, 22/11, a partir das 5h00, em pelotões por pace.",
      "Tempo limite de 6h30 a partir da largada. A cronometragem encerra às 12h.",
      "Água em 16 pontos; isotônico nos km 14,9, 25,3 e 35,6; alimentação nos km 14,9, 25,3 e 35,3.",
      "Posto médico móvel nos km 14,9 e 25,3.",
    ],
    mapaOficial: "https://maratonamonumentalbsb.com.br/wp-content/uploads/2026/11/MAPA-Percurso42km-2026.pdf",
  },
};

export const ROTULO_APOIO: Record<PontoApoio["tipos"][number], string> = {
  agua: "Água",
  esponja: "Esponja",
  isotonico: "Isotônico",
  alimentacao: "Alimentação",
  banheiro: "Banheiro",
  medico: "Posto médico",
};

/** Pelotões por pace da meia e da maratona (regulamento). */
export const PELOTOES_PACE = [
  { nome: "Verde", pace: "abaixo de 4:00 min/km" },
  { nome: "Amarelo", pace: "4:00 a 4:30 min/km" },
  { nome: "Azul", pace: "4:30 a 5:00 min/km" },
  { nome: "Branco", pace: "5:00 a 5:30 min/km" },
  { nome: "Vermelho", pace: "5:30 a 6:00 min/km" },
  { nome: "Preto", pace: "6:00 a 6:30 min/km" },
  { nome: "Roxo", pace: "acima de 6:30 min/km" },
] as const;

export const TOPICOS = [
  {
    n: "01",
    titulo: "O percurso",
    curto: "O trajeto da sua distância e os pontos que pedem atenção.",
    texto: "Entenda o trajeto da sua distância, suas principais características e os pontos que exigem atenção.",
    detalhe: "Cada distância tem o seu mapa oficial. A gente abre os quatro e mostra onde olhar.",
  },
  {
    n: "02",
    titulo: "As pegadinhas",
    curto: "Os erros de estratégia que mais comprometem uma prova.",
    texto: "Descubra situações que podem comprometer o planejamento de prova, incluindo erros frequentes de estratégia.",
    detalhe: "Largar acima do ritmo, pular posto de água, errar o horário de chegada: tudo isso tem como evitar.",
  },
  {
    n: "03",
    titulo: "Estratégia de ritmo",
    curto: "Como distribuir o esforço do início ao fim.",
    texto: "Aprenda a distribuir o esforço e administrar os diferentes momentos da corrida.",
    detalhe: "Meia e maratona largam em pelotões por pace. O seu pelotão faz parte do plano.",
  },
  {
    n: "04",
    titulo: "Hidratação e alimentação",
    curto: "O plano de abastecimento para a sua distância.",
    texto: "Entenda como pensar sua estratégia de abastecimento de acordo com a distância e o planejamento individual.",
    detalhe: "Na maratona são 16 postos de água. Saber em quais quilômetros eles estão muda o plano.",
  },
  {
    n: "05",
    titulo: "Logística do grande dia",
    curto: "Largadas, pelotões, kit, horários e chegada ao local.",
    texto: "Largadas, pelotões, retirada de kits, horários, chegada ao local e organização pessoal.",
    detalhe: "Retirada de kit de 19 a 21/11. Largadas no sábado à tarde e no domingo de madrugada.",
  },
  {
    n: "06",
    titulo: "Perguntas e respostas",
    curto: "Suas dúvidas, direto com os treinadores.",
    texto: "Um momento para esclarecer dúvidas diretamente com os treinadores.",
    detalhe: "Traga a sua dúvida. O encontro termina com o microfone aberto.",
  },
] as const;

/** Imagens padrão. O painel pode trocar a da hero. */
export const IMAGENS = {
  hero: "/midiakit/eixao2.jpg",
  comunidade: "/somma/hero-background.jpg",
  logoSomma: "/Logo_Nova_Somma_Branca_Laranja.svg",
  logoBora: "/bora/logo-white.png",
} as const;

export const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function rotuloValor(centavos: number | null | undefined): string | null {
  if (centavos === null || centavos === undefined) return null;
  return centavos === 0 ? "Gratuito" : MOEDA.format(centavos / 100);
}
