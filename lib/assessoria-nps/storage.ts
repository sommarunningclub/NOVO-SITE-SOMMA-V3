/**
 * Progresso da pesquisa neste aparelho (localStorage).
 *
 * Existe para um refresh acidental não custar a pesquisa inteira. Não é a
 * resposta: a resposta só existe no banco depois do envio.
 *
 * Depois do envio, o rascunho é APAGADO e fica só a marca "enviado" (id do
 * envio e primeiro nome, para a tela de obrigado). Um aparelho compartilhado
 * não guarda as respostas abertas de ninguém por mais tempo que o necessário.
 *
 * Tudo aqui tolera storage bloqueado (aba anônima, in-app browser): falhar em
 * salvar nunca impede ninguém de responder.
 */

import type { Draft } from "./survey";
import type { ScreenKey } from "./logic";

const PREFIXO = "somma:assessoria-nps:";
/** Rascunho mais velho que isso é descartado. */
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

export interface RascunhoSalvo {
  v: 1;
  status: "draft";
  surveyVersion: string;
  submissionId: string;
  /** Epoch ms no relógio do aparelho. */
  startedAt: number;
  firstName: string;
  lastName: string;
  answers: Draft;
  tela: ScreenKey;
  updatedAt: number;
}

export interface EnvioSalvo {
  v: 1;
  status: "submitted";
  surveyVersion: string;
  submissionId: string;
  submittedAt: number;
  firstName: string;
}

export type EstadoSalvo = RascunhoSalvo | EnvioSalvo;

function chave(campanha: string): string {
  return `${PREFIXO}${campanha}`;
}

export function lerEstado(campanha: string, surveyVersion: string): EstadoSalvo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(chave(campanha));
    if (!raw) return null;
    const dado = JSON.parse(raw) as Partial<EstadoSalvo> | null;
    if (!dado || dado.v !== 1 || dado.surveyVersion !== surveyVersion) return null;
    if (typeof dado.submissionId !== "string") return null;

    if (dado.status === "submitted") return dado as EnvioSalvo;
    if (dado.status === "draft") {
      const r = dado as RascunhoSalvo;
      if (typeof r.updatedAt !== "number" || Date.now() - r.updatedAt > VALIDADE_MS) {
        window.localStorage.removeItem(chave(campanha));
        return null;
      }
      if (!r.answers || typeof r.answers !== "object") return null;
      return r;
    }
    return null;
  } catch {
    return null;
  }
}

export function salvarRascunho(campanha: string, rascunho: Omit<RascunhoSalvo, "v" | "status" | "updatedAt">): void {
  gravar(campanha, { ...rascunho, v: 1, status: "draft", updatedAt: Date.now() });
}

export function marcarEnviado(campanha: string, envio: Omit<EnvioSalvo, "v" | "status">): void {
  gravar(campanha, { ...envio, v: 1, status: "submitted" });
}

export function limparEstado(campanha: string): void {
  try {
    window.localStorage.removeItem(chave(campanha));
  } catch {
    /* storage bloqueado */
  }
}

function gravar(campanha: string, estado: EstadoSalvo): void {
  try {
    window.localStorage.setItem(chave(campanha), JSON.stringify(estado));
  } catch {
    /* storage cheio ou bloqueado: a pesquisa segue, só não sobrevive a refresh */
  }
}

/** UUID v4 também em navegador antigo sem `crypto.randomUUID`. */
export function novoIdDeEnvio(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
