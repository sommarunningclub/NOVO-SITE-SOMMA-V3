/**
 * O LONGÃO — fonte única de verdade do evento.
 *
 * Tudo que é "dado do evento" (datas, números da prova, premiação, links,
 * unidades) mora aqui e só aqui: landing, formulário, OG image, JSON-LD,
 * e-mails e admin derivam deste arquivo. Mudou a premiação ou a data da
 * seletiva? Edita-se UMA constante e o site inteiro acompanha.
 */

export const SITE_URL = "https://sommaclub.com.br";
export const EVENT_PATH = "/o-longao";
export const EVENT_URL = `${SITE_URL}${EVENT_PATH}`;

export const EVENTO = {
  nome: "O Longão",
  mote: "O único que dura 24 horas.",
  frase: "Uma esteira. Uma equipe. 24 horas para ir mais longe que todo mundo.",
  convocacao:
    "Crews, assessorias e clubes de corrida do Distrito Federal estão convocados.",
  realizacao: ["Evolve", "Somma Club"],
  masterSponsor: "Star Trac",
  cidade: "Brasília",
  uf: "DF",

  /**
   * Datas — ainda em definição com as unidades. `null` = "em breve" em todo
   * lugar que exibe data (landing, FAQ, JSON-LD usa a janela prevista).
   */
  seletiva: {
    data: null as string | null, // ISO "2026-10-17" quando fechar
    janela: "Outubro de 2026",
    local: "Unidade Evolve (a anunciar)",
  },
  final: {
    data: null as string | null, // ISO do sábado da largada
    janela: "Novembro de 2026",
    largada: "09:00",
    chegada: "09:00",
    local: "Arena Evolve (a anunciar)",
  },
} as const;

/** Números da prova — usados nos cards, no FAQ e na validação do formulário. */
export const FORMATO = {
  titulares: 8,
  reservasMax: 2,
  seletivaMinutos: 120,
  finalHoras: 24,
  esteirasPorEquipe: 1,
  finalistasPorCategoria: 4,
  categorias: ["masculino", "feminino"] as const,
} as const;

export type Categoria = (typeof FORMATO.categorias)[number];

/**
 * Premiação — edite os valores aqui; a seção da landing e o FAQ recalculam
 * o total sozinhos. Valores em reais, por equipe (o rateio é da crew).
 */
/**
 * Premiação por categoria.
 *
 * O 1º lugar leva dinheiro, e o valor é POR CATEGORIA: a crew campeã masculina
 * leva o mesmo que a campeã feminina, sem rateio entre elas. 2º e 3º lugares
 * recebem premiação, mas ela não é revelada: `valor: null` marca isso, e todo
 * lugar que exibe premiação lê `rotuloSurpresa` em vez de um número.
 *
 * Para mudar valores, mexa só aqui: landing, FAQ, regulamento e imagem social
 * derivam desta constante.
 */
export const PREMIACAO = {
  moeda: "R$",
  rotuloSurpresa: "Premiação surpresa",
  porCategoria: [
    { posicao: 1, valor: 20000 as number | null },
    { posicao: 2, valor: null as number | null },
    { posicao: 3, valor: null as number | null },
  ],
} as const;

/** Prêmio em dinheiro de uma categoria. */
export const PREMIACAO_POR_CATEGORIA = PREMIACAO.porCategoria.reduce(
  (soma, p) => soma + (p.valor ?? 0),
  0
);

/** Soma das duas categorias. É o número grande da seção de premiação. */
export const PREMIACAO_TOTAL = PREMIACAO_POR_CATEGORIA * FORMATO.categorias.length;

export function formataReais(valor: number): string {
  return `${PREMIACAO.moeda} ${valor.toLocaleString("pt-BR")}`;
}

/** O que exibir para uma posição: o valor, ou o rótulo de surpresa. */
export function rotuloPremio(valor: number | null): string {
  return valor === null ? PREMIACAO.rotuloSurpresa : formataReais(valor);
}

/**
 * A máquina oficial da prova.
 *
 * Tudo que a landing afirma sobre o equipamento sai daqui: hero, seção da
 * Star Trac, seletiva, arena, FAQ e regulamento. Os números são os da ficha
 * técnica da Star Trac para a FreeRunner 10TRx; o display é a opção Apex LED,
 * que foi a escolhida para o evento.
 */
export const ESTEIRA = {
  marca: "Star Trac",
  modelo: "FreeRunner 10TRx",
  display: "Apex LED Display",
  nomeCompleto: "Star Trac FreeRunner 10TRx",
  imagens: {
    /** Ângulo 3/4 com o console Apex LED: a foto principal. */
    principal: "/o-longao/esteira/freerunner-10trx-led.webp",
    frente: "/o-longao/esteira/freerunner-10trx-frente.webp",
    lateralEsq: "/o-longao/esteira/freerunner-10trx-lateral-esq.webp",
    lateralDir: "/o-longao/esteira/freerunner-10trx-lateral-dir.webp",
    /** Close do console Apex LED. */
    console: "/o-longao/esteira/apex-led-console.webp",
  },
  /** Máquina montada, fundo preto (vira transparente por blend). 7 s, 4 MB. */
  video: "/o-longao/esteira/freerunner-cinematic.mp4",
  /** Vista explodida em estúdio cinza: deck, HexDeck e motor separados. 7 s, 5 MB. */
  videoRaioX: "/o-longao/esteira/freerunner-raio-x.mp4",
  /** Primeiro frame do raio-x: segura o painel enquanto os 5 MB não chegam. */
  posterRaioX: "/o-longao/esteira/freerunner-raio-x-poster.jpg",
  specs: [
    { rotulo: "Velocidade", valor: "0,5 a 24 km/h" },
    { rotulo: "Inclinação", valor: "0 a 20%" },
    { rotulo: "Motor", valor: "CA de 5 HP" },
    { rotulo: "Área de corrida", valor: "152 × 55 cm" },
    { rotulo: "Peso máximo do atleta", valor: "227 kg" },
    { rotulo: "Deck", valor: "HexDeck de alumínio" },
    { rotulo: "Altura do deck", valor: "28 cm" },
    { rotulo: "Peso da máquina", valor: "234 kg" },
  ],
} as const;

/** Timeline das 24 horas — a espinha da seção "Como são as 24 horas". */
export const TIMELINE_24H = [
  { hora: "09:00", titulo: "Largada", texto: "Oito esteiras aceleram juntas. O relógio começa a descontar." },
  { hora: "12:00", titulo: "Primeiras estratégias", texto: "Cada crew mostra o plano: turnos curtos e rápidos, ou longos e estáveis." },
  { hora: "18:00", titulo: "A prova começa a mudar", texto: "O ritmo da tarde cobra. Quem gastou demais começa a pagar." },
  { hora: "00:00", titulo: "Metade do Longão", texto: "Doze horas na conta. O leaderboard aperta e a arquibancada muda de cara." },
  { hora: "03:00", titulo: "A madrugada cobra", texto: "Não existe pace confortável às 4h17 da manhã. É aqui que a prova se decide." },
  { hora: "06:00", titulo: "Começa o ataque final", texto: "O sol volta. Quem dosou o sono ataca; quem não dosou, segura." },
  { hora: "09:00", titulo: "Fim", texto: "24 horas. A esteira para. A distância no painel é a única verdade." },
] as const;

/** Contatos e links institucionais reaproveitados no rodapé. */
export const LINKS = {
  instagram: "https://www.instagram.com/sommaclub.cc/",
  whatsapp: "https://wa.me/5561986000862",
  email: "contato@sommaclub.com.br",
  regulamento: `${EVENT_PATH}/regulamento`,
  inscricao: `${EVENT_PATH}/inscricao`,
} as const;
