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
  | "ultimas_vagas" // forçado manualmente (o cálculo por capacidade é automático)
  | "esgotado" // todas as unidades sem vaga
  | "inscricoes_encerradas" // fechamos antes do evento
  | "acontecendo"
  | "encerrado";

export type UnitStatus = "aberta" | "ultimas_vagas" | "esgotada" | "encerrada";

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
  /** PENDENTE — capacidade total (competidores + espectadores) por unidade.
   *  Com `null` a LP não mostra barra de lotação nem bloqueia inscrição. */
  capacidade: number | null;
  /**
   * Vagas de COMPETIDOR na unidade — as esteiras são finitas.
   *
   * PENDENTE: preencher com o número real de cada unidade. Enquanto for `null`,
   * a página comunica que as vagas são limitadas (é verdade: há um teto físico
   * de esteiras) mas não bloqueia ninguém, porque não temos o número para
   * aplicar. Assim que preenchido, a inscrição como competidor passa a ser
   * recusada automaticamente quando a unidade lotar, e quem chegar depois
   * consegue se inscrever como espectador.
   */
  vagasCompetidores: number | null;
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
      "Rua 3, Chácara 82, Lote 01, Loja 01 — Setor Habitacional Vicente Pires, Brasília/DF",
    latitude: -15.8129,
    longitude: -48.0188,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Vicente%20Pires%20Rua%203%20Ch%C3%A1cara%2082%20Setor%20Habitacional%20Vicente%20Pires%20Bras%C3%ADlia%20DF",
    capacidade: null,
    vagasCompetidores: null, // PENDENTE — informar o número de esteiras da unidade
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
    endereco: "Rua Marginal A, Quadra 18, Lote 03, Loja 301, 1º andar — Luziânia/GO",
    latitude: -16.2529,
    longitude: -47.9479,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Luzi%C3%A2nia%20Rua%20Marginal%20A%20Quadra%2018%20Luzi%C3%A2nia%20GO",
    capacidade: null,
    vagasCompetidores: null, // PENDENTE — informar o número de esteiras da unidade
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
      "Alameda Shopping — St. B Sul, CSB 2, Lotes 1 a 4, Piso Moda 12A e Sobreloja, Taguatinga Sul, Brasília/DF",
    latitude: -15.835,
    longitude: -48.0592,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Alameda%20Shopping%20Taguatinga%20Sul%20Bras%C3%ADlia%20DF",
    capacidade: null,
    vagasCompetidores: null, // PENDENTE — informar o número de esteiras da unidade
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
      "Quadra 302, Conjunto 9 — Edifício Arena Urbano, Samambaia Sul, Brasília/DF",
    latitude: -15.8785,
    longitude: -48.0898,
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Evolve%20Samambaia%20Quadra%20302%20Conjunto%209%20Edif%C3%ADcio%20Arena%20Urbano%20Samambaia%20Bras%C3%ADlia%20DF",
    capacidade: null,
    vagasCompetidores: null, // PENDENTE — informar o número de esteiras da unidade
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
  /** PENDENTE — a organização ainda não confirmou se o evento é gratuito.
   *  Com `null`, a LP não afirma nada sobre preço e o FAQ usa a resposta neutra. */
  gratuito: null as boolean | null,
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

/* ── Vagas de competidor ─────────────────────────────────────────────────── */

export type VagasStatus = "aberta" | "ultimas" | "esgotada" | "indefinida";

/**
 * Situação das vagas de competidor de uma unidade.
 *
 * `indefinida` significa "há um limite, mas ainda não sabemos qual" — a página
 * continua comunicando que as vagas são limitadas (as esteiras são finitas),
 * sem inventar um número nem barrar ninguém.
 */
export function vagasCompetidorStatus(unit: EventUnit, competidores: number): VagasStatus {
  if (unit.vagasCompetidores === null) return "indefinida";
  const restantes = unit.vagasCompetidores - competidores;
  if (restantes <= 0) return "esgotada";
  if (restantes <= Math.max(5, Math.round(unit.vagasCompetidores * 0.15))) return "ultimas";
  return "aberta";
}

export function vagasRestantes(unit: EventUnit, competidores: number): number | null {
  if (unit.vagasCompetidores === null) return null;
  return Math.max(0, unit.vagasCompetidores - competidores);
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
  { id: "18-24", nome: "18–24", min: 18, max: 24 },
  { id: "25-34", nome: "25–34", min: 25, max: 34 },
  { id: "35-44", nome: "35–44", min: 35, max: 44 },
  { id: "45-54", nome: "45–54", min: 45, max: 54 },
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
      "Entro no Desafio das Esteiras e apareço na grade de competidores. Vagas limitadas — o número de esteiras de cada unidade é finito.",
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

export const COPY = {
  headline: ["DESAFIO", "DAS ESTEIRAS"],
  sub: "4 UNIDADES. 1 DESAFIO.",
  kicker: "VOCÊ CONTRA A ESTEIRA. SUA UNIDADE CONTRA TODAS.",
  ctaPrimario: "GARANTIR MEU TICKET",
  ctaSecundario: "ESCOLHER UNIDADE",
  ctaSomma: "CORRER COM O SOMMA",
  vagasAviso: "Vagas limitadas para competir em cada unidade",
  vagasDetalhe:
    "As esteiras de cada unidade são contadas: quem quer competir precisa garantir a vaga antes de esgotar. Para assistir, a entrada segue liberada.",
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
  "CENTENAS DE PESSOAS",
  "CORRENDO JUNTAS.",
  "MÚSICA. ENERGIA.",
  "DESAFIO. BRINDES.",
  "ATIVAÇÕES.",
  "COMUNIDADE.",
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
    r: "Não. O Desafio foi desenhado para acolher diferentes níveis — de quem está começando a quem treina todo dia.",
  },
  {
    p: "As vagas para competir são limitadas?",
    r: "Sim. O número de esteiras de cada unidade é finito, então as vagas de competidor são limitadas e acabam por ordem de inscrição. Para assistir e participar das ativações, a entrada continua aberta.",
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
  return status === "inscricoes_abertas" || status === "ultimas_vagas";
}

/** Estado de uma unidade considerando capacidade configurada + inscritos reais. */
export function unitStatusFor(unit: EventUnit, inscritos: number): UnitStatus {
  if (unit.status !== "aberta") return unit.status;
  if (unit.capacidade === null) return "aberta";
  const restantes = unit.capacidade - inscritos;
  if (restantes <= 0) return "esgotada";
  if (restantes <= Math.max(10, Math.round(unit.capacidade * 0.1))) return "ultimas_vagas";
  return "aberta";
}

export const EVENT_LABELS: Record<EventStatus, string> = {
  em_breve: "INSCRIÇÕES EM BREVE",
  inscricoes_abertas: "INSCRIÇÕES ABERTAS",
  ultimas_vagas: "ÚLTIMAS VAGAS",
  esgotado: "ESGOTADO",
  inscricoes_encerradas: "INSCRIÇÕES ENCERRADAS",
  acontecendo: "ACONTECENDO AGORA",
  encerrado: "EVENTO ENCERRADO",
};

export const UNIT_LABELS: Record<UnitStatus, string> = {
  aberta: "VAGAS ABERTAS",
  ultimas_vagas: "ÚLTIMAS VAGAS",
  esgotada: "ESGOTADA",
  encerrada: "ENCERRADA",
};
