/**
 * Tipos da apresentação comercial do Somma Club.
 * Toda a informação comercial vem dos arquivos em `_data`, tipada aqui.
 */

/** Categorias usadas no filtro de oportunidades. */
export type OpportunityFilter =
  | "Presencial"
  | "Digital"
  | "Base de dados"
  | "Tecnologia"
  | "Assessoria"
  | "Patrocínio"
  | "Exclusividade";

export const OPPORTUNITY_FILTERS: readonly OpportunityFilter[] = [
  "Presencial",
  "Digital",
  "Base de dados",
  "Tecnologia",
  "Assessoria",
  "Patrocínio",
  "Exclusividade",
];

/** Tipo comercial exibido na tabela geral (rótulo livre). */
export type OpportunityType =
  | "Presencial"
  | "Digital"
  | "Presencial e digital"
  | "Base própria"
  | "Tecnologia"
  | "Recorrente"
  | "Assessoria"
  | "Institucional"
  | "Exclusividade";

/**
 * Atributos comparáveis no comparador de cotas. Escala simples:
 * 0 = não incluído, 1 = parcial/opcional, 2 = incluído/forte.
 */
export interface OpportunityAttributes {
  presencaFisica: 0 | 1 | 2;
  midiaDigital: 0 | 1 | 2;
  comunicacaoBase: 0 | 1 | 2;
  tecnologia: 0 | 1 | 2;
  exclusividade: 0 | 1 | 2;
  personalizacao: 0 | 1 | 2;
  relatorios: 0 | 1 | 2;
}

export interface Opportunity {
  id: string;
  nome: string;
  /** Categorias para o filtro (uma cota pode ter mais de uma). */
  filtros: OpportunityFilter[];
  tipo: OpportunityType;
  /** Valor mínimo em reais, para cálculo do simulador e formatação pt-BR. */
  investimento: number;
  /** Unidade do investimento, ex.: "por mês", "por disparo", "único". */
  unidade: string;
  /** Rótulo pronto, ex.: "A partir de R$ 5.000". */
  investimentoLabel: string;
  duracao: string;
  publicoPotencial?: string;
  descricao: string;
  objetivo: string;
  indicacao: string;
  entregas: string[];
  naoIncluido?: string[];
  observacoes?: string;
  atributos: OpportunityAttributes;
  /** Destaque visual (cotas institucionais/exclusivas). */
  destaque?: boolean;
}

/** Uma métrica de destaque (big number). */
export interface Metric {
  valor: string;
  /** Alvo numérico para a animação de contagem (quando aplicável). */
  count?: number;
  sufixo?: string;
  prefixo?: string;
  label: string;
  kicker?: string;
}

/** Linha da tabela de impacto digital. */
export interface DigitalRow {
  indicador: string;
  resultado: string;
}

/** Capítulo da navegação. */
export interface Chapter {
  id: string;
  label: string;
  /** id do elemento-âncora da primeira seção do capítulo. */
  anchor: string;
}

/** Campos do simulador comercial. */
export interface SimulatorState {
  ativacaoId: string;
  meses: number;
  midiaAdicional: boolean;
  agenda: boolean;
  popupSite: boolean;
  popupCheckin: boolean;
}
