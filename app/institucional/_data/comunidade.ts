import bruto from "./comunidade.snapshot.json";
import type { MetaMetrica } from "./metricas";
import { fmtData } from "../_lib/formato";

/**
 * Retrato agregado da comunidade, gerado por
 * `node scripts/institucional/gerar-snapshot.mjs` a partir do Supabase.
 * O arquivo JSON não tem CPF, nome, e-mail nem telefone: só contagens.
 */

export type Janela = "30d" | "90d" | "180d" | "tudo";
export type FiltroSexo = "todos" | "F" | "M";
export type FiltroFormato = "todos" | "sabado" | "especial";

export interface Resumo {
  eventos: number;
  participacoes: number;
  pessoas: number;
  mediaPorEvento: number;
  estreantes: number;
  recorrentes: number;
  umaVez: number;
  taxaRecorrencia: number | null;
  mediaEventosPorPessoa: number;
  frequencia: { rotulo: string; pessoas: number }[];
  sexo: { F: number | null; M: number | null; naoInformado: number | null };
  idade: { faixas: { faixa: string; pessoas: number | null }[]; semDado: number };
}

export interface EventoAgregado {
  id: string;
  titulo: string;
  data: string;
  categoria: "sabado" | "especial";
  participacoes: number;
  estreantes: number;
  recorrentes: number;
  porSexo: Record<"F" | "M", { participacoes: number; estreantes: number }>;
  voltaramDepois: number | null;
  eventosDepois: number;
}

export interface Retencao {
  dias: number;
  elegiveis: number;
  taxa: number | null;
}

export interface Coorte {
  mes: string;
  pessoas: number;
  celulas: (number | null)[];
}

export interface PontoTendencia {
  mes: string;
  participacoes: number;
  pessoas: number;
  estreantes: number;
}

export interface Snapshot {
  fonte: "real" | "demonstrativo";
  geradoEm: string;
  historico: { inicio: string; corte: string };
  base: {
    cadastros: number;
    pessoasNaBase: number;
    pessoasComParticipacao: number;
    participantesForaDoCadastro: number;
  };
  sabados: { eventos: number; mediana: number; p25: number; p75: number; maximo: number };
  qualidade: {
    registrosBrutos: number;
    semEventoRealizado: number;
    semCpfValido: number;
    transferidos: number;
    duplicados: number;
    validos: number;
  };
  privacidade: { minimoCelula: number; minimoElegiveis: number };
  eventos: EventoAgregado[];
  resumos: Record<string, Resumo>;
  porSexo: Record<FiltroSexo, { retencao: Retencao[]; coortes: Coorte[]; tendencia: PontoTendencia[] }>;
}

export const COMUNIDADE = bruto as unknown as Snapshot;

export function resumo(j: Janela, s: FiltroSexo, f: FiltroFormato): Resumo {
  return COMUNIDADE.resumos[`${j}|${s}|${f}`];
}

export const TOTAL = resumo("tudo", "todos", "todos");

export const META_COMUNIDADE: MetaMetrica = {
  fonte: "Sistema de check-in e cadastro da SOMMA",
  periodo: `${fmtData(COMUNIDADE.historico.inicio)} a ${fmtData(COMUNIDADE.historico.corte)}`,
  atualizadoEm: COMUNIDADE.geradoEm.slice(0, 10),
  status: COMUNIDADE.fonte === "real" ? "dados-internos" : "demonstrativo",
  definicao:
    "Confirmação de presença feita pelo site ou app de check-in, uma por pessoa (CPF) por evento. Não equivale a público auditado na porta.",
};

/** Eventos de parceiros, procurados pelo título (para os cases). */
export function eventosQueContem(trecho: RegExp): EventoAgregado[] {
  return COMUNIDADE.eventos.filter((e) => trecho.test(e.titulo));
}
