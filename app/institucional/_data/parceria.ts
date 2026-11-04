/**
 * Durações de parceria e a linha do tempo ilustrativa de cada uma.
 * Não são pacotes nem preços: mostram o tipo de presença que cada horizonte
 * permite. O número real de ativações é negociado com cada marca.
 */
export type TipoMarco = "ativacao" | "especial" | "conteudo" | "leitura";

export interface Marco {
  semana: number; // 1 = primeira semana da parceria
  tipo: TipoMarco;
  rotulo: string;
}

export interface Duracao {
  id: "3m" | "6m" | "12m";
  meses: number;
  semanas: number;
  titulo: string;
  subtitulo: string;
  ideal: string;
  marcos: Marco[];
}

export const ROTULO_MARCO: Record<TipoMarco, string> = {
  ativacao: "Ativação em encontro",
  especial: "Evento especial",
  conteudo: "Conteúdo digital",
  leitura: "Leitura de resultados",
};

function conteudoMensal(meses: number): Marco[] {
  return Array.from({ length: meses }, (_, i) => ({
    semana: i * 4.33 + 2,
    tipo: "conteudo" as const,
    rotulo: `Conteúdo · mês ${i + 1}`,
  }));
}

export const DURACOES: Duracao[] = [
  {
    id: "3m",
    meses: 3,
    semanas: 13,
    titulo: "03 meses",
    subtitulo: "Campanha e experimentação",
    ideal: "Para testar um formato, lançar um produto ou viver uma campanha com começo, meio e fim.",
    marcos: [
      { semana: 1, tipo: "ativacao", rotulo: "Estreia da marca num encontro de sábado" },
      { semana: 5, tipo: "ativacao", rotulo: "Segunda ativação" },
      { semana: 9, tipo: "especial", rotulo: "Ação especial da campanha" },
      { semana: 13, tipo: "leitura", rotulo: "Leitura final da campanha" },
      ...conteudoMensal(3),
    ],
  },
  {
    id: "6m",
    meses: 6,
    semanas: 26,
    titulo: "06 meses",
    subtitulo: "Presença e relacionamento recorrente",
    ideal: "Para a comunidade reconhecer a marca como parte da rotina, não como visita.",
    marcos: [
      { semana: 1, tipo: "ativacao", rotulo: "Estreia" },
      { semana: 5, tipo: "ativacao", rotulo: "Ativação mensal" },
      { semana: 9, tipo: "ativacao", rotulo: "Ativação mensal" },
      { semana: 13, tipo: "leitura", rotulo: "Leitura do trimestre" },
      { semana: 14, tipo: "especial", rotulo: "Evento especial" },
      { semana: 18, tipo: "ativacao", rotulo: "Ativação mensal" },
      { semana: 22, tipo: "ativacao", rotulo: "Ativação mensal" },
      { semana: 26, tipo: "leitura", rotulo: "Leitura do semestre" },
      ...conteudoMensal(6),
    ],
  },
  {
    id: "12m",
    meses: 12,
    semanas: 52,
    titulo: "12 meses",
    subtitulo: "Associação estratégica e continuidade",
    ideal: "Para associar a marca à comunidade de forma duradoura, com produto, eventos e calendário próprios.",
    marcos: [
      ...[1, 5, 9, 18, 22, 31, 35, 44, 48].map((s) => ({ semana: s, tipo: "ativacao" as const, rotulo: "Ativação em encontro" })),
      { semana: 14, tipo: "especial", rotulo: "Evento especial" },
      { semana: 40, tipo: "especial", rotulo: "Evento especial" },
      { semana: 27, tipo: "especial", rotulo: "Collab de produto" },
      ...[13, 26, 39, 52].map((s) => ({ semana: s, tipo: "leitura" as const, rotulo: "Leitura trimestral" })),
      ...conteudoMensal(12),
    ],
  },
];

export const NOTA_LINHA_DO_TEMPO =
  "Cada parceria é construída de acordo com os objetivos, o calendário e as contrapartidas definidas com a marca.";

export const NOTA_SABADOS =
  "Nem todo encontro de sábado tem ativação de marca. O número de ativações é parte da negociação.";

/** O que molda uma parceria (slide 15). */
export const FATORES_PARCERIA = [
  "Objetivos da marca",
  "Público que se quer alcançar",
  "Duração",
  "Conteúdo esperado",
  "Formatos de ativação",
  "Produção e estrutura",
  "Exclusividade",
  "Restrições de categoria",
  "Direitos de uso de marca",
  "Relatórios e leituras",
];

export const PROCESSO = [
  { passo: "01", titulo: "Conversa", texto: "Entender o objetivo, o momento da marca e o que ela quer que as pessoas sintam." },
  { passo: "02", titulo: "Desenho", texto: "Formatos, calendário, contrapartidas e indicadores, numa proposta sob medida." },
  { passo: "03", titulo: "Execução", texto: "A comunidade, a produção e a tecnologia da SOMMA colocando a ideia na rua." },
  { passo: "04", titulo: "Leitura", texto: "Números agregados a cada etapa, para ajustar a rota e decidir o próximo passo." },
];
