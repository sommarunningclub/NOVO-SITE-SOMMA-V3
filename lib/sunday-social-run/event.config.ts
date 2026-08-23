/**
 * SUNDAY SOCIAL RUN — SOMMA Club × Santa Monica Gastrobar, powered by Hype On Club
 *
 * Fonte única de conteúdo da experiência. Toda string, número, horário e estado
 * da landing page vive aqui: nenhum componente inventa dado.
 *
 * Regra do projeto: o que ainda não foi definido pela organização fica `null`.
 * Com `null` a interface exibe o estado "em definição" em vez de improvisar —
 * data, distância, rota, parceiros e link de venda seguem essa regra.
 */

export const EVENT_SLUG = "sunday-social-run";
export const EVENT_PATH = "/sunday-social-run";
export const SITE_URL = "https://sommaclub.com.br";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTES CONFIGURÁVEIS (item 18 do briefing)
   Editar aqui muda a página inteira — nada é escrito à mão nos componentes.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Membros do SOMMA Club. Número já publicado na home do clube. */
export const COMMUNITY_SIZE = 5000;

/** Vagas da experiência. Não há segunda onda. */
export const EVENT_CAPACITY = 100;

/** Ingresso promocional, em reais. */
export const TICKET_PRICE = 50;

/**
 * Data oficial. `null` enquanto a organização não fecha o domingo.
 * Formato quando definida: "2026-09-14T07:00:00-03:00".
 * Com data preenchida a página passa a exibir o dia cheio e o JSON-LD ganha
 * `startDate` — sem ela, comunicamos apenas "domingo pela manhã".
 */
export const EVENT_DATE: string | null = null;

/** Hora de abertura dos portões. Esta já está definida. */
export const EVENT_TIME = "07:00";

/**
 * Os pelotões da social run, em km. São três distâncias saindo juntas do Santa
 * Monica: ninguém escolhe entre correr e ficar de fora.
 */
export const ROUTE_DISTANCES = [5, 6, 8] as const;

/** Rótulo curto para hero, ficha e percurso. */
export const distanciasLabel = ROUTE_DISTANCES.join(" · ") + " km";

/**
 * Venda exclusiva pela Hype On Club.
 *
 * Vem de `NEXT_PUBLIC_HYPE_TICKET_URL` para o link entrar sem deploy de código.
 * Enquanto estiver vazio, os CTAs levam para a seção do ingresso e a página
 * assume o estado "link em breve" — jamais uma URL inventada.
 */
export const HYPE_TICKET_URL = (process.env.NEXT_PUBLIC_HYPE_TICKET_URL ?? "").trim();
export const TICKET_URL = HYPE_TICKET_URL;

/**
 * O app da Hype On nas lojas. Links oficiais — é por aqui que a pessoa entra na
 * plataforma onde a vaga é vendida e onde a experiência social acontece.
 */
export const HYPE_APP = {
  ios: "https://apps.apple.com/br/app/hype-on-club/id6476780583",
  android: "https://play.google.com/store/apps/details?id=com.hypeonclub.hype_on_mobile",
} as const;

/** Âncora usada quando ainda não há link externo. */
export const TICKET_ANCHOR = "#spot";

/** True quando a venda já está no ar. */
export const vendaAberta = (): boolean => HYPE_TICKET_URL.length > 0;

/** Destino de qualquer CTA de compra da página. */
export const ticketHref = (): string => (vendaAberta() ? HYPE_TICKET_URL : TICKET_ANCHOR);

/* ═══════════════════════════════════════════════════════════════════════════
   IDENTIDADE DO EVENTO
   ═══════════════════════════════════════════════════════════════════════════ */

export const EVENT = {
  nome: "SUNDAY SOCIAL RUN",
  assinatura: "Corre. Conhece. Fica.",
  subExperiencia: "O AFTER",
  cidade: "Brasília",
  uf: "DF",
  diaSemana: "Domingo",
  local: {
    nome: "Santa Monica Gastrobar",
    /** PENDENTE — endereço completo entra quando a casa confirmar a divulgação. */
    endereco: null as string | null,
    cidade: "Brasília",
    uf: "DF",
  },
  /** Santa Monica → Eixão → Santa Monica. O traçado exato ainda não é oficial. */
  percurso: {
    largada: "Santa Monica Gastrobar",
    meio: "Eixão",
    chegada: "Santa Monica Gastrobar",
    distanciasKm: ROUTE_DISTANCES,
    /** O traçado exato ainda não foi homologado — só as distâncias estão fechadas. */
    oficial: false,
  },
} as const;

/**
 * As três marcas, com os arquivos oficiais.
 *
 * `logo` é a versão para fundo claro; `logoClaro`, quando existe, é o arquivo
 * oficial para fundo escuro (só o SOMMA tem os dois). A Hype On veio como SVG
 * em `currentColor` e é renderizada inline por `_components/Logos.tsx`, então
 * acompanha a cor do texto em qualquer luz da página.
 */
export const BRANDS = [
  {
    id: "somma",
    nome: "SOMMA Club",
    papel: "Coloca as pessoas em movimento",
    ato: "RUN",
    logo: "/logo-somma-dark.png",
    logoClaro: "/Logo_Nova_Somma_Branca_Laranja.svg",
    site: "https://sommaclub.com.br",
  },
  {
    id: "hype",
    nome: "Hype On Club",
    papel: "Conecta essas pessoas",
    ato: "CONNECT",
    /** inline em Logos.tsx (currentColor); o arquivo também está em /public */
    logo: "/sunday-social-run/hype-on.svg",
    logoClaro: null as string | null,
    site: null as string | null,
  },
  {
    id: "santa-monica",
    nome: "Santa Monica Gastrobar",
    papel: "Faz elas ficarem",
    ato: "STAY",
    logo: "/sunday-social-run/santa-monica-horizontal.png",
    logoClaro: null as string | null,
    site: null as string | null,
  },
] as const;

/** Os três atos da experiência. Estruturam a narrativa e a cor da página. */
export const ATOS = [
  {
    id: "run",
    titulo: "CORRE",
    linha: "6 km no Eixão, no seu ritmo.",
    texto: "Três pelotões saem juntos do Santa Monica, dão a volta pelo Eixão e voltam para o mesmo lugar.",
    marca: "SOMMA Club",
  },
  {
    id: "connect",
    titulo: "CONHECE",
    linha: "Gente nova, sem esforço.",
    texto: "O app da Hype On mostra quem vai estar lá e quebra o gelo antes da largada.",
    marca: "Hype On Club",
  },
  {
    id: "stay",
    titulo: "FICA",
    linha: "O after vai até meio-dia.",
    texto: "DJ, brunch, drink e mesa cheia no Santa Monica. Ninguém tem pressa de ir embora.",
    marca: "Santa Monica",
  },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════
   A MANHÃ
   `ato` colore o item na timeline; `destaque` marca os momentos que a página
   trata como cena própria.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Ato = "run" | "connect" | "stay";

export interface MomentoDaManha {
  hora: string;
  titulo: string;
  detalhe: string;
  ato: Ato;
  destaque?: boolean;
}

export const TIMELINE: readonly MomentoDaManha[] = [
  { hora: "07:00", titulo: "PORTÕES ABREM", detalhe: "Check-in, café e música no Santa Monica. Chegue com folga.", ato: "run", destaque: true },
  { hora: "07:30", titulo: "AQUECIMENTO", detalhe: "Todo mundo junto. É aqui que a primeira conversa acontece.", ato: "run" },
  { hora: "07:40", titulo: "FOTO OFICIAL", detalhe: "Cem pessoas em um quadro só.", ato: "run" },
  { hora: "07:45", titulo: "LARGADA", detalhe: "Os três pelotões saem juntos: 5, 6 e 8 km.", ato: "run", destaque: true },
  { hora: "08:40", titulo: "CHEGADA", detalhe: "De volta ao Santa Monica. A corrida acaba, a manhã não.", ato: "run" },
  { hora: "08:50", titulo: "BRINDE DE CHEGADA", detalhe: "Seu drink de boas-vindas está incluso na vaga.", ato: "stay" },
  { hora: "09:00", titulo: "COMEÇA O AFTER", detalhe: "DJ, brunch e as ativações das marcas. O evento dentro do evento.", ato: "stay", destaque: true },
  { hora: "09:30", titulo: "TROCA DE STRAVA", detalhe: "Telefone depois. Strava primeiro.", ato: "connect", destaque: true },
  { hora: "10:00", titulo: "DEU MATCH", detalhe: "Quem correu no seu ritmo provavelmente combina com você.", ato: "connect", destaque: true },
  { hora: "10:30", titulo: "SORTEIOS", detalhe: "As marcas presentes distribuem brindes e experiências.", ato: "stay" },
  { hora: "11:30", titulo: "ÚLTIMA MÚSICA", detalhe: "Última rodada, última foto.", ato: "stay" },
  { hora: "12:00", titulo: "ATÉ A PRÓXIMA", detalhe: "Encerramento oficial.", ato: "stay" },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════
   O QUE A VAGA ENTREGA
   `condicional: true` = depende de patrocínio e por isso não é comunicado como
   benefício garantido (a camiseta é o caso). Basta virar `false` quando fechar.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Beneficio {
  id: string;
  titulo: string;
  detalhe: string;
  ato: Ato;
  condicional?: boolean;
  ativo: boolean;
}

export const BENEFICIOS: readonly Beneficio[] = [
  { id: "run", titulo: "Social Run", detalhe: "Pelotões de 5, 6 e 8 km conduzidos pelo SOMMA Club, do Santa Monica ao Eixão.", ato: "run", ativo: true },
  { id: "eixao", titulo: "Eixão", detalhe: "O asfalto mais icônico de Brasília em uma manhã de domingo.", ato: "run", ativo: true },
  { id: "after", titulo: "After Pace", detalhe: "Acesso completo à morning party no Santa Monica.", ato: "stay", ativo: true },
  { id: "dj", titulo: "DJ", detalhe: "Set ao vivo do fim da corrida até o encerramento.", ato: "stay", ativo: true },
  { id: "drink", titulo: "Welcome drink", detalhe: "O brinde de chegada, incluso no ingresso.", ato: "stay", ativo: true },
  { id: "brands", titulo: "Ativações", detalhe: "Experiências das marcas presentes durante toda a manhã.", ato: "stay", ativo: true },
  { id: "sorteios", titulo: "Sorteios", detalhe: "Partner drops às 10h30.", ato: "stay", ativo: true },
  { id: "hype", titulo: "Experiência Hype On", detalhe: "Perfil, ingresso digital, presença confirmada e os Moments do evento.", ato: "connect", ativo: true },
  { id: "conexoes", titulo: "Conexões", detalhe: "Pace Match, Strava Exchange e conversa com quem vai estar lá.", ato: "connect", ativo: true },
  { id: "conteudo", titulo: "Conteúdo exclusivo", detalhe: "As imagens e os Moments da manhã, só para quem esteve dentro.", ato: "connect", ativo: true },
  { id: "camiseta", titulo: "Camiseta oficial", detalhe: "Em negociação com patrocinador.", ato: "run", condicional: true, ativo: false },
];

/** O que a Hype On entrega dentro da experiência. Só recursos que existem. */
export const HYPE_FEATURES = [
  { id: "ingresso", titulo: "Ingresso digital", detalhe: "A compra e a entrada acontecem no app." },
  { id: "perfil", titulo: "Perfil", detalhe: "Foto, bio e interesses de quem vai estar lá." },
  { id: "presenca", titulo: "Presença confirmada", detalhe: "Você vê quem já garantiu a vaga antes de domingo." },
  { id: "conexao", titulo: "Conexões", detalhe: "Encontre pessoas do evento e comece a conversa." },
  { id: "mensagens", titulo: "Mensagens", detalhe: "Fale com participantes sem precisar do telefone de ninguém." },
  { id: "moments", titulo: "Moments", detalhe: "O conteúdo do evento acontecendo em tempo real." },
] as const;

/**
 * Perfis usados nas cenas de Pace Match e da grade de confirmados.
 * São ILUSTRATIVOS: representam a linguagem do produto, não pessoas reais nem
 * inscrições existentes. A interface deixa isso explícito.
 */
export const PERFIS_DEMO = [
  { nome: "Marina", pace: "5:20", distancia: "10K", tag: "Brasília" },
  { nome: "Lucas", pace: "5:18", distancia: "21K", tag: "Asa Norte" },
  { nome: "Bia", pace: "6:05", distancia: "5K", tag: "Sudoeste" },
  { nome: "Théo", pace: "4:48", distancia: "21K", tag: "Lago Sul" },
  { nome: "Rafa", pace: "5:44", distancia: "10K", tag: "Eixão" },
  { nome: "Duda", pace: "6:20", distancia: "5K", tag: "Noroeste" },
  { nome: "Iago", pace: "5:02", distancia: "Meia", tag: "Brasília" },
  { nome: "Nina", pace: "5:35", distancia: "10K", tag: "Asa Sul" },
] as const;

/**
 * Os pelotões. A divisão é por distância, não por ritmo: os três saem juntos do
 * Santa Monica e voltam para o mesmo brunch. Ninguém fica para trás por ser
 * mais lento, e ninguém precisa segurar o passo por ser mais rápido.
 */
export const PELOTOES = [
  { km: 5, rotulo: "DE BOA", texto: "Dá para conversar o caminho inteiro. Serve para quem está começando." },
  { km: 6, rotulo: "NO RITMO", texto: "Constante do começo ao fim, sem sufoco e sem passeio." },
  { km: 8, rotulo: "PRA ESTICAR", texto: "Para quem quer um pouco mais antes do primeiro drink." },
] as const;

/**
 * Categorias de patrocínio. Placeholders honestos: a página mostra a categoria
 * e o estado, e só exibe marca quando `marca` deixar de ser `null`.
 */
export const PARTNER_SLOTS = [
  { id: "performance", categoria: "Performance", marca: null as string | null },
  { id: "hydration", categoria: "Hydration", marca: null as string | null },
  { id: "recovery", categoria: "Recovery", marca: null as string | null },
  { id: "drinks", categoria: "Drinks", marca: null as string | null },
  { id: "nutrition", categoria: "Nutrition", marca: null as string | null },
  { id: "lifestyle", categoria: "Lifestyle", marca: null as string | null },
  { id: "fashion", categoria: "Fashion", marca: null as string | null },
  { id: "tech", categoria: "Tech", marca: null as string | null },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════
   COPY
   Português e inglês misturados de propósito: inglês nos títulos e nos códigos
   da experiência, português onde a mensagem precisa chegar sem tradução.
   ═══════════════════════════════════════════════════════════════════════════ */

export const COPY = {
  hero: {
    kicker: "SOMMA Club × Santa Monica Gastrobar",
    powered: "com o app da Hype On Club",
    headline: ["SUNDAY", "SOCIAL RUN"],
    assinatura: "Corre. Conhece. Fica.",
    frase: "Domingo de manhã: 6 km no Eixão e um after que vai até meio-dia. Você vem pela corrida e fica pelas pessoas.",
    scroll: "VOCÊ NUNCA SABE QUEM VAI ENCONTRAR NO MEIO DO CAMINHO",
    de: "Santa Monica · 07:45",
    para: "After · 09:00",
  },
  cem: {
    titulo: ["SÓ", "100 VAGAS"],
    linha: "Cem pessoas, uma corrida, um monte de gente nova.",
    texto: "Não tem segunda leva nem lista extra. Quando as 100 acabarem, acabou.",
  },
  hype: {
    titulo: ["A CORRIDA COMEÇA", "ANTES DA LARGADA"],
    linha: "Dá para saber quem vai estar lá antes de domingo.",
    texto:
      "A vaga é comprada no app da Hype On. É lá também que você monta seu perfil, vê quem confirmou, puxa papo e acompanha o que rolou no evento.",
  },
  paceMatch: {
    titulo: "MESMO PACE",
    headline: "Quem corre no seu ritmo costuma ter mais coisa em comum.",
    texto:
      "No app dá para ver quem confirmou presença, achar gente com interesses parecidos e começar a conversa antes de sair de casa.",
    fecho: "Trocar Strava virou o novo trocar telefone.",
    pelotoes: "Três pelotões saem juntos. Você escolhe a distância, não o grupo em que se encaixa.",
  },
  strava: {
    titulo: "TROCA DE STRAVA",
    headline: "Telefone depois. Strava primeiro.",
    texto: "Dois celulares, dois perfis e uma corrida em comum. O resto é com vocês.",
    fecho: "Conectado.",
  },
  jornada: {
    titulo: ["DOMINGO,", "7 DA MANHÃ"],
    linha: "Cinco horas de programação, minuto a minuto.",
  },
  finish: {
    titulo: ["ACABOU?", "QUE NADA."],
    linha: "A corrida termina às 8h40. A manhã, não.",
  },
  after: {
    titulo: "O AFTER",
    headline: ["A CORRIDA ACABA.", "A MANHÃ NÃO."],
    texto:
      "Das 9h às 11h30: DJ, brunch, drink, ativações das marcas e gente em pé conversando. Califórnia em Brasília, num domingo de manhã.",
  },
  ticket: {
    titulo: "100 VAGAS",
    linha: "É só isso.",
    texto: "Venda exclusiva pelo app da Hype On Club.",
    semLink: "As vendas abrem em breve, só pelo app da Hype On. Avisamos primeiro no @somma.club.",
  },
  final: {
    headline: "QUEM VOCÊ VAI ENCONTRAR?",
    sub: "100 vagas. Domingo de manhã. Brasília.",
    fecho: "Corre. Conhece. Fica.",
  },
  cta: {
    principal: "GARANTIR MINHA VAGA",
    curto: "GARANTIR",
    header: "GARANTIR VAGA",
    secundario: "VER COMO FUNCIONA",
  },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   COMO FUNCIONA
   Quatro passos, em ordem, do jeito que a pessoa vai viver. Serve para quem
   nunca foi a um evento assim entender tudo em quinze segundos.
   ═══════════════════════════════════════════════════════════════════════════ */

export const COMO_FUNCIONA = [
  {
    passo: "01",
    titulo: "Baixe o app da Hype On",
    texto: "É por lá que a vaga é vendida e que a experiência começa. Leva um minuto.",
  },
  {
    passo: "02",
    titulo: "Garanta sua vaga",
    texto: "São 100, por R$ 50. O ingresso fica salvo no app — não precisa imprimir nada.",
  },
  {
    passo: "03",
    titulo: "Veja quem vai",
    texto: "Monte seu perfil, veja quem confirmou presença e já puxe papo antes de domingo.",
  },
  {
    passo: "04",
    titulo: "Apareça domingo, 7h",
    texto: "Chegue no Santa Monica, escolha seu pelotão e corra. Depois é só ficar para o after.",
  },
] as const;

/** Rótulos derivados — usados em hero, header, sticky e OG. */
export const dataLabel = (): string => {
  if (!EVENT_DATE) return `${EVENT.diaSemana} · ${EVENT_TIME}`;
  const d = new Date(EVENT_DATE);
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(d);
  return `${fmt} · ${EVENT_TIME}`;
};

export const precoLabel = `R$ ${TICKET_PRICE}`;
export const spotsLabel = `${EVENT_CAPACITY} vagas`;
