/**
 * DESAFIO DAS ESTEIRAS — EVOLVE + SOMMA CLUB
 * Configuração central do evento. Toda string, regra, endereço, capacidade e
 * estado da experiência vive aqui: a LP, as rotas de API e o admin leem deste
 * arquivo. Para mudar o evento não é preciso caçar texto espalhado no projeto.
 *
 * Campos marcados com `// PENDENTE` dependem de definição da organização.
 * Enquanto forem `null`, a interface simplesmente não exibe a informação —
 * nada é inventado.
 */

export const EVENT_SLUG = "desafio-das-esteiras-2026";
export const EVENT_PATH = "/desafios-das-esteiras-evolve";
export const SITE_URL = "https://sommaclub.com.br";

/** Estados possíveis do evento. Controlam o que a LP exibe e se a API aceita inscrição. */
export type EventStatus =
  | "em_breve" // página no ar, inscrições ainda não abertas
  | "inscricoes_abertas"
  | "inscricoes_encerradas" // fechamos antes do evento
  | "acontecendo"
  | "encerrado";

export type UnitStatus = "aberta" | "encerrada";

/* ═══════════════════════════════════════════════════════════════════════════
   REGRA OFICIAL DA COMPETIÇÃO
   ───────────────────────────────────────────────────────────────────────────
   A inscrição para competir é ABERTA: não existe teto de competidores, nem
   por categoria, nem por unidade, nem no total. Quem quiser correr, corre.

   A esteira continua sendo o limite físico do momento, não da inscrição:
   são 4 esteiras por unidade, então uma bateria leva 4 pessoas por vez. O
   número de baterias deixa de ser fixo e passa a sair da conta do dia — a
   organização monta quantas forem necessárias para caber quem apareceu.

       inscritos na categoria ÷ 4 esteiras = baterias necessárias

   Por isso a bateria não é mais promessa de página: ela é grade de operação,
   distribuída depois da inscrição e mostrada no ticket e no admin.
   ═══════════════════════════════════════════════════════════════════════════ */
export const COMPETICAO = {
  esteirasPorBateria: 4,
  /**
   * Sem teto de inscrição. Está explícito como constante (em vez de
   * simplesmente ausente) para que quem ler o código saiba que é decisão, e
   * para o dia em que a organização quiser fechar um número: basta trocar
   * aqui e reativar a trava do banco.
   */
  vagasLimitadas: false,
} as const;

/** Quantas baterias a categoria precisa para caber `inscritos` competidores. */
export function bateriasNecessarias(inscritos: number): number {
  if (inscritos <= 0) return 0;
  return Math.ceil(inscritos / COMPETICAO.esteirasPorBateria);
}

/**
 * Bateria é um inteiro positivo, sem lista fixa: a grade cresce com a
 * procura. O banco valida o mesmo intervalo.
 */
export const BATERIA_MAX = 60;
export type Bateria = number;

export function bateriaValida(n: unknown): n is Bateria {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= BATERIA_MAX;
}

export interface EventUnit {
  id: string;
  slug: string;
  nome: string;
  /** Nome curto para uso em tipografia gigante / ticket. */
  curto: string;
  cidade: string;
  uf: string;
  endereco: string;
  /** Fonte: CMS oficial academiaevolve.com.br/unidades (coordenadas do próprio site). */
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  /**
   * Ficha pública do Google Maps quando a organização enviou a listagem.
   * Sem fonte, a LP não inventa nota nem horário de funcionamento da academia.
   */
  google?: {
    nome: string;
    rating: number;
    avaliacoes: number;
    categoria: string;
  };
  /** PENDENTE — capacidade total (competidores + espectadores) por unidade.
   *  Com `null` a LP não mostra barra de lotação nem bloqueia inscrição. */
  capacidade: number | null;
  /**
   * Esteiras que a unidade disponibiliza para a competição. É esse número que
   * define o tamanho da bateria — quatro esteiras, quatro pessoas por vez.
   */
  esteiras: number;
  status: UnitStatus;
  /** Vicente Pires concentra a equipe SOMMA Club presencialmente. */
  sommaBase: boolean;
  /** Prefixo do código do ticket: DST-VP-XXXXXX */
  ticketPrefix: string;
}

export const UNITS: readonly EventUnit[] = [
  {
    id: "vicente-pires",
    slug: "vicente-pires",
    nome: "Evolve Vicente Pires",
    curto: "Vicente Pires",
    cidade: "Brasília",
    uf: "DF",
    endereco:
      "Rua 3, Chácara 82, Lote 01, Loja 01, Setor Habitacional Vicente Pires, Brasília/DF",
    latitude: -15.8129,
    longitude: -48.0188,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Vicente%20Pires%20Rua%203%20Ch%C3%A1cara%2082%20Setor%20Habitacional%20Vicente%20Pires%20Bras%C3%ADlia%20DF",
    google: {
      nome: "Academia Evolve - Vicente Pires",
      rating: 4.4,
      avaliacoes: 301,
      categoria: "Academia no Distrito Federal",
    },
    capacidade: null,
    esteiras: COMPETICAO.esteirasPorBateria,
    status: "aberta",
    sommaBase: true,
    ticketPrefix: "VP",
  },
  {
    id: "luziania",
    slug: "luziania",
    nome: "Evolve Luziânia",
    curto: "Luziânia",
    cidade: "Luziânia",
    uf: "GO",
    endereco: "Rua Marginal A, Quadra 18, Lote 03, Loja 301, 1º andar, Luziânia/GO",
    latitude: -16.2529,
    longitude: -47.9479,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Luzi%C3%A2nia%20Rua%20Marginal%20A%20Quadra%2018%20Luzi%C3%A2nia%20GO",
    capacidade: null,
    esteiras: COMPETICAO.esteirasPorBateria,
    status: "aberta",
    sommaBase: false,
    ticketPrefix: "LZ",
  },
  {
    id: "alameda",
    slug: "alameda",
    nome: "Evolve Alameda",
    curto: "Alameda",
    cidade: "Taguatinga",
    uf: "DF",
    endereco:
      "Alameda Shopping, St. B Sul, CSB 2, Lotes 1 a 4, Piso Moda 12A e Sobreloja, Taguatinga Sul, Brasília/DF",
    latitude: -15.835,
    longitude: -48.0592,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Alameda%20Shopping%20Taguatinga%20Sul%20Bras%C3%ADlia%20DF",
    capacidade: null,
    esteiras: COMPETICAO.esteirasPorBateria,
    status: "aberta",
    sommaBase: false,
    ticketPrefix: "AL",
  },
  {
    id: "samambaia",
    slug: "samambaia",
    nome: "Evolve Samambaia",
    curto: "Samambaia",
    cidade: "Brasília",
    uf: "DF",
    endereco:
      "Quadra 302, Conjunto 9, Edifício Arena Urbano, Samambaia Sul, Brasília/DF",
    latitude: -15.8785,
    longitude: -48.0898,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Samambaia%20Quadra%20302%20Conjunto%209%20Edif%C3%ADcio%20Arena%20Urbano%20Samambaia%20Bras%C3%ADlia%20DF",
    capacidade: null,
    esteiras: COMPETICAO.esteirasPorBateria,
    status: "aberta",
    sommaBase: false,
    ticketPrefix: "SB",
  },
] as const;

export type UnitId = (typeof UNITS)[number]["id"];
export const UNIT_IDS = UNITS.map((u) => u.id);

export function getUnit(id: string | null | undefined): EventUnit | null {
  if (!id) return null;
  return UNITS.find((u) => u.id === id || u.slug === id) ?? null;
}

export const EVENT = {
  nome: "Desafio das Esteiras",
  realizacao: "Evolve + SOMMA Club",
  /**
   * `eventos.slug` no sistema de gestão. É por aqui que a inscrição descobre o
   * `evento_id` — nunca por UUID no código. Ver lib/desafio-esteiras/gestao.ts
   * e scripts/desafio-esteiras-integracao-gestao.sql.
   */
  gestaoSlug: "desafio-das-esteiras-2026",
  /** 19 de agosto de 2026, 19h — horário de Brasília (UTC-3). */
  inicioISO: "2026-08-19T19:00:00-03:00",
  fimISO: "2026-08-19T22:00:00-03:00",
  dataLabel: "19.08",
  dataExtenso: "19 de agosto de 2026",
  dataCurta: "19 AGO 2026",
  horaLabel: "19H",
  horaExtenso: "19h",
  status: "inscricoes_abertas" as EventStatus,
  /** Confirmado pela organização: participação gratuita, mediante inscrição. */
  gratuito: true as boolean | null,
  /** PENDENTE — regra de elegibilidade (aluno Evolve x público geral). */
  exigeSerAlunoEvolve: null as boolean | null,
} as const;

/** Paleta do evento — espelhada em CSS custom properties no globals do evento. */
export const COLORS = {
  evolve: "#e0261b",
  somma: "#ff2c04",
  ink: "#08080a",
  paper: "#f2f0ec",
  ash: "#d9d6d0",
  white: "#ffffff",
} as const;

/* ── Competição ──────────────────────────────────────────────────────────── */

/**
 * A categoria não é escolhida: ela vem do sexo informado na inscrição.
 * Quem se inscreve como feminino disputa no feminino, e vice-versa.
 */
export type Sexo = "masculino" | "feminino";
export type Participacao = "competidor" | "espectador";

export const CATEGORIAS: { id: Sexo; nome: string; curto: string }[] = [
  { id: "feminino", nome: "Categoria Feminino", curto: "Feminino" },
  { id: "masculino", nome: "Categoria Masculino", curto: "Masculino" },
];

export function categoriaDoSexo(sexo: Sexo | null | undefined): string | null {
  if (!sexo) return null;
  return CATEGORIAS.find((c) => c.id === sexo)?.curto ?? null;
}

/* ── Inscritos para competir ─────────────────────────────────────────────── */

/**
 * Antes existia um estado de vaga (aberta, últimas, esgotada) porque havia um
 * teto. Sem teto, a categoria só tem uma leitura: quantos já entraram. O que
 * a página mostra agora é adesão, não escassez.
 */
export function competidoresTexto(inscritos: number): string {
  if (inscritos === 0) return "SEJA O PRIMEIRO";
  if (inscritos === 1) return "1 COMPETIDOR INSCRITO";
  return `${inscritos} COMPETIDORES INSCRITOS`;
}

/** Como a grade daquela categoria fica com o número atual de inscritos. */
export function gradeTexto(inscritos: number): string {
  const baterias = bateriasNecessarias(inscritos);
  if (baterias === 0) return "Nenhuma bateria formada ainda";
  if (baterias === 1) return "1 bateria formada";
  return `${baterias} baterias formadas`;
}

/** Idade em anos completos na data do evento — é o que vale para a disputa. */
export function idadeNoEvento(nascimento: string | null | undefined): number | null {
  if (!nascimento) return null;
  const nasc = new Date(`${nascimento}T12:00:00Z`);
  if (Number.isNaN(nasc.getTime())) return null;
  const evento = new Date(EVENT.inicioISO);
  let anos = evento.getFullYear() - nasc.getFullYear();
  const m = evento.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && evento.getDate() < nasc.getDate())) anos--;
  return anos >= 0 && anos < 120 ? anos : null;
}

/** Faixas para segmentar o público no painel. Não são categorias da disputa. */
export const FAIXAS_ETARIAS = [
  { id: "ate-17", nome: "até 17", min: 0, max: 17 },
  { id: "18-24", nome: "18 a 24", min: 18, max: 24 },
  { id: "25-34", nome: "25 a 34", min: 25, max: 34 },
  { id: "35-44", nome: "35 a 44", min: 35, max: 44 },
  { id: "45-54", nome: "45 a 54", min: 45, max: 54 },
  { id: "55-mais", nome: "55+", min: 55, max: 200 },
] as const;

export function faixaEtaria(idade: number | null): (typeof FAIXAS_ETARIAS)[number]["id"] | null {
  if (idade === null) return null;
  return FAIXAS_ETARIAS.find((f) => idade >= f.min && idade <= f.max)?.id ?? null;
}

export const PARTICIPACAO_LABELS: Record<Participacao, { titulo: string; texto: string }> = {
  competidor: {
    titulo: "Vou competir",
    texto:
      "Entro no Desafio das Esteiras e apareço na grade de competidores da minha unidade.",
  },
  espectador: {
    titulo: "Só vou assistir",
    texto: "Vou à unidade curtir a experiência, mas não disputo.",
  },
};

/** Cor de fundo do avatar quando a pessoa não envia foto — uma por unidade. */
export const UNIT_ACCENT: Record<string, string> = {
  "vicente-pires": "#ff2c04",
  luziania: "#e0261b",
  alameda: "#b81f16",
  samambaia: "#8c1810",
};

/**
 * O selo da unidade onde o time SOMMA estará.
 *
 * "SOMMA BASE" sozinho era ambíguo — dava para ler como nome de produto. Os
 * textos abaixo dizem a coisa: é o ponto oficial, com a equipe presente.
 */
export const SOMMA_BASE = {
  selo: "SOMMA AQUI",
  seloLongo: "BASE OFICIAL DO SOMMA",
  titulo: "Ponto oficial do SOMMA Club",
  explicacao:
    "É nesta unidade que a equipe do SOMMA Club estará presencialmente no dia do evento. Nas outras três, a operação é da Evolve.",
  curto: "Equipe SOMMA presente",
} as const;

export const COPY = {
  headline: ["DESAFIO", "DAS ESTEIRAS"],
  sub: "4 UNIDADES. 1 DESAFIO.",
  kicker: "VOCÊ CONTRA A ESTEIRA. SUA UNIDADE CONTRA TODAS.",
  ctaPrimario: "GARANTIR MEU TICKET",
  ctaSecundario: "ESCOLHER UNIDADE",
  ctaSomma: "CORRER COM O SOMMA",
  vagasAviso: "Evento gratuito. Inscrição aberta para competir em qualquer unidade",
  vagasDetalhe:
    "Inscrição aberta para competir e para assistir. São 4 esteiras por unidade, e a organização monta quantas baterias forem precisas para caber todo mundo.",
} as const;

/**
 * Manifesto. Cada item é uma linha renderizada — o tamanho da fonte é derivado
 * do comprimento da string (ver `.dst-fit`), então frases curtas viram
 * tipografia enorme e as longas encolhem sem transbordar. Quebrar uma frase em
 * duas entradas é uma decisão de ritmo, não de layout.
 */
export const MANIFESTO = [
  "UMA NOITE.",
  "QUATRO UNIDADES.",
  "UM DESAFIO.",
] as const;

export const STEPS = [
  { n: "01", titulo: "Escolha sua unidade", texto: "Vicente Pires, Luziânia, Alameda ou Samambaia." },
  { n: "02", titulo: "Faça sua inscrição", texto: "Três etapas. Menos de um minuto." },
  { n: "03", titulo: "Receba seu ticket", texto: "Código único e QR Code na hora." },
  { n: "04", titulo: "Chegue à Evolve", texto: "Dia 19 de agosto, a partir das 19h." },
  { n: "05", titulo: "Valide seu ticket", texto: "Apresente o QR Code na recepção." },
  { n: "06", titulo: "Entre na experiência", texto: "A academia vira outra coisa nessa noite." },
  { n: "07", titulo: "Corra o Desafio das Esteiras", texto: "Do seu jeito, no seu ritmo." },
  { n: "08", titulo: "Participe das ativações e sorteios", texto: "Brindes Evolve e SOMMA Club." },
] as const;

export interface ExperienceItem {
  id: string;
  titulo: string;
  texto: string;
  /** Blocos âncora do evento — recebem tratamento full-bleed na LP. */
  destaque?: boolean;
}

export const EXPERIENCE: readonly ExperienceItem[] = [
  {
    id: "desafio",
    titulo: "Desafio das Esteiras",
    texto: "Corrida e dinâmica esportiva dentro da academia.",
    destaque: true,
  },
  {
    id: "catraca",
    titulo: "Catraca liberada",
    texto:
      "Participantes confirmados poderão acessar a unidade participante durante a experiência, respeitando as regras operacionais definidas pela organização.",
    destaque: true,
  },
  { id: "ativacoes", titulo: "Ativações", texto: "Experiências especiais acontecendo durante o evento." },
  { id: "brindes-evolve", titulo: "Brindes Evolve", texto: "Distribuição e sorteios de brindes Evolve." },
  { id: "brindes-somma", titulo: "Brindes SOMMA Club", texto: "Sorteios especiais do SOMMA Club." },
  { id: "musica", titulo: "Música", texto: "Ambiente criado para transformar a academia em uma experiência." },
  { id: "comunidade", titulo: "Comunidade", texto: "Pessoas de diferentes níveis correndo juntas." },
  { id: "surpresas", titulo: "Surpresas", texto: "Algumas ativações não precisam ser reveladas antes do evento." },
] as const;

/** FAQ — respostas com `null` significam "ainda não definido pela organização". */
export const FAQ: { p: string; r: string | null }[] = [
  {
    p: "Preciso ser aluno da Evolve?",
    r:
      EVENT.exigeSerAlunoEvolve === null
        ? null // PENDENTE — definir com a Evolve e preencher `EVENT.exigeSerAlunoEvolve`
        : EVENT.exigeSerAlunoEvolve
          ? "Sim. O Desafio das Esteiras é exclusivo para alunos da Evolve."
          : "Não. A inscrição está aberta para alunos Evolve e para quem ainda não treina na rede.",
  },
  {
    p: "A catraca estará liberada?",
    r: "Sim, para participantes elegíveis do evento, conforme a operação definida pela Evolve em cada unidade.",
  },
  {
    p: "Preciso correr profissionalmente?",
    r: "Não. O Desafio foi desenhado para acolher todos os níveis, de quem está começando a quem treina todo dia.",
  },
  {
    p: "Tem limite de vagas para competir?",
    r: `Não. A inscrição para competir está aberta e não tem teto: quem quiser correr, corre. O que é finito são as esteiras, ${COMPETICAO.esteirasPorBateria} por unidade, então a organização monta quantas baterias forem necessárias para caber todo mundo. Para assistir, a entrada também segue liberada.`,
  },
  {
    p: "Como funcionam as baterias?",
    r: `Cada bateria leva ${COMPETICAO.esteirasPorBateria} competidores correndo ao mesmo tempo, uma pessoa por esteira. Quantas baterias vão rolar depende de quanta gente se inscrever: a organização monta a grade depois das inscrições e a sua bateria aparece no ticket.`,
  },
  {
    p: "Posso escolher qualquer unidade?",
    r: "Sim, mediante disponibilidade. Você escolhe a unidade no momento da inscrição.",
  },
  {
    p: "Onde o SOMMA Club estará?",
    r: "Na Evolve Vicente Pires. A equipe do SOMMA Club estará presencialmente nessa unidade.",
  },
  {
    p: "Preciso apresentar meu ticket?",
    r: "Sim. Leve o QR Code do seu ticket (no celular) para validar a entrada na sua unidade.",
  },
  {
    p: "O evento é gratuito?",
    r:
      EVENT.gratuito === null
        ? null // PENDENTE — definir com a organização e preencher `EVENT.gratuito`
        : EVENT.gratuito
          ? "Sim. A participação é gratuita, mediante inscrição e disponibilidade de vagas."
          : "Consulte as condições de participação no momento da inscrição.",
  },
];

export const PARTNERS = {
  evolve: { nome: "Evolve", site: "https://www.academiaevolve.com.br" },
  somma: { nome: "SOMMA Club", site: SITE_URL, instagram: "https://www.instagram.com/sommaclub" },
} as const;

/* ── Estado derivado ─────────────────────────────────────────────────────── */

export function inscricoesAbertas(status: EventStatus = EVENT.status): boolean {
  return status === "inscricoes_abertas";
}

/**
 * Estado de uma unidade.
 *
 * Sem teto de competidores, a unidade só fecha por decisão da organização
 * (`unit.status`), nunca por lotação. O parâmetro de inscritos saiu junto com
 * a conta que ele alimentava.
 */
export function unitStatusFor(unit: EventUnit): UnitStatus {
  return unit.status;
}

export const EVENT_LABELS: Record<EventStatus, string> = {
  em_breve: "INSCRIÇÕES EM BREVE",
  inscricoes_abertas: "INSCRIÇÕES ABERTAS",
  inscricoes_encerradas: "INSCRIÇÕES ENCERRADAS",
  acontecendo: "ACONTECENDO AGORA",
  encerrado: "EVENTO ENCERRADO",
};

export const UNIT_LABELS: Record<UnitStatus, string> = {
  aberta: "INSCRIÇÕES ABERTAS",
  encerrada: "ENCERRADA",
};
