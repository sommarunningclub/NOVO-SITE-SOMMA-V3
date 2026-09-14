/**
 * Regras do NPS da Assessoria: o que aparece, o que é obrigatório, o que é
 * gravado. Funções puras sobre `survey.ts`, chamadas pela tela (a cada passo)
 * e pelo servidor (no envio). Não existe uma segunda implementação.
 */

import {
  PERIODS,
  QUESTIONS,
  QUESTION_BY_ID,
  SECTIONS,
  periodosEfetivos,
  temInteresseNaSemana,
  type AnswerKey,
  type Answers,
  type Draft,
  type Question,
  type Section,
  type SectionId,
} from "./survey";

// ─── Visibilidade ───────────────────────────────────────────────────────────
export function perguntaVisivel(q: Question, a: Draft): boolean {
  return q.showWhen ? q.showWhen(a) : true;
}

export function perguntasVisiveis(a: Draft): Question[] {
  return QUESTIONS.filter((q) => perguntaVisivel(q, a));
}

/** Identificação sempre; as demais só quando têm pergunta visível. */
export function secoesVisiveis(a: Draft): Section[] {
  const comPergunta = new Set<SectionId>(perguntasVisiveis(a).map((q) => q.section));
  return SECTIONS.filter((s) => s.id === "identificacao" || comPergunta.has(s.id));
}

// ─── Telas ──────────────────────────────────────────────────────────────────
export type ScreenKey = "identity" | AnswerKey;

export function sequenciaDeTelas(a: Draft): ScreenKey[] {
  return ["identity", ...perguntasVisiveis(a).map((q) => q.id)];
}

export function secaoDaTela(tela: ScreenKey): SectionId {
  if (tela === "identity") return "identificacao";
  return QUESTION_BY_ID.get(tela)?.section ?? "geral";
}

export function isScreenKey(v: unknown): v is ScreenKey {
  return v === "identity" || (typeof v === "string" && QUESTION_BY_ID.has(v as AnswerKey));
}

export interface Progresso {
  secao: Section;
  /** 1-based, entre as seções visíveis. */
  secaoIndice: number;
  secoesTotal: number;
  /** 0 a 1, pelas telas visíveis. */
  fracao: number;
}

export function progressoDaTela(tela: ScreenKey, a: Draft): Progresso {
  const secoes = secoesVisiveis(a);
  const telas = sequenciaDeTelas(a);
  const idSecao = secaoDaTela(tela);
  const idx = Math.max(0, secoes.findIndex((s) => s.id === idSecao));
  const pos = Math.max(0, telas.indexOf(tela));
  return {
    secao: secoes[idx] ?? SECTIONS[0],
    secaoIndice: idx + 1,
    secoesTotal: secoes.length,
    fracao: telas.length > 1 ? pos / telas.length : 0,
  };
}

// ─── Validação ──────────────────────────────────────────────────────────────
export interface ErroPergunta {
  field: AnswerKey;
  message: string;
}

const MSG_ESCOLHA = "Escolha uma opção para continuar.";

function ehInteiro(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

function vazio(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Remove caractere de controle (menos quebra de linha) e espaço nas pontas. */
export function limparTexto(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const limpo = v
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return limpo === "" ? null : limpo;
}

function tamanhoTexto(v: unknown): number {
  return limparTexto(v)?.length ?? 0;
}

function valoresDe(q: { options: readonly { value: string }[] }): Set<string> {
  return new Set(q.options.map((o) => o.value));
}

/** O follow-up (campo "Outro", "Quais períodos?") está aberto? */
export function followUpAtivo(q: Question, a: Draft): boolean {
  if ((q.kind !== "single" && q.kind !== "multi") || !q.followUp) return false;
  const v = a[q.id];
  if (q.kind === "multi") return Array.isArray(v) && (v as string[]).includes(q.followUp.when);
  return v === q.followUp.when;
}

/**
 * Erro da pergunta, ou `null`. Não olha visibilidade: quem chama decide se a
 * pergunta está em jogo. Valor desconhecido é erro mesmo em pergunta opcional.
 */
export function erroNaPergunta(q: Question, a: Draft): ErroPergunta | null {
  const v = a[q.id];
  const erro = (message: string): ErroPergunta => ({ field: q.id, message });

  switch (q.kind) {
    case "scale": {
      if (vazio(v)) return q.required ? erro("Escolha uma nota de 0 a 10 para continuar.") : null;
      return ehInteiro(v, 0, 10) ? null : erro("Escolha uma nota de 0 a 10.");
    }
    case "rating": {
      if (vazio(v)) return q.required ? erro(MSG_ESCOLHA) : null;
      return ehInteiro(v, 1, 5) ? null : erro(MSG_ESCOLHA);
    }
    case "single": {
      if (vazio(v)) return q.required ? erro(MSG_ESCOLHA) : null;
      if (typeof v !== "string" || !valoresDe(q).has(v)) return erro(MSG_ESCOLHA);
      break;
    }
    case "multi": {
      const lista = Array.isArray(v) ? (v as unknown[]) : [];
      if (v != null && !Array.isArray(v)) return erro("Marque pelo menos uma opção.");
      const validos = valoresDe(q);
      if (lista.some((x) => typeof x !== "string" || !validos.has(x))) return erro("Marque pelo menos uma opção.");
      if (q.required && new Set(lista).size < q.min) return erro("Marque pelo menos uma opção para continuar.");
      break;
    }
    case "text": {
      if (v != null && typeof v !== "string") return erro("Resposta inválida.");
      if (tamanhoTexto(v) > q.maxLength) return erro(`Sua resposta passou de ${q.maxLength} caracteres.`);
      return null;
    }
  }

  // Follow-up de single/multi.
  if (q.followUp && followUpAtivo(q, a)) {
    const f = q.followUp;
    const fv = a[f.field];
    if (f.kind === "text") {
      if (fv != null && typeof fv !== "string") return { field: f.field, message: "Resposta inválida." };
      if (tamanhoTexto(fv) > f.maxLength)
        return { field: f.field, message: `Sua resposta passou de ${f.maxLength} caracteres.` };
    } else {
      const lista = Array.isArray(fv) ? (fv as unknown[]) : [];
      const validos = new Set<string>(f.options.map((o) => o.value));
      if (lista.some((x) => typeof x !== "string" || !validos.has(x)) || new Set(lista).size < f.min)
        return { field: f.field, message: `Marque pelo menos ${f.min} períodos.` };
    }
  }
  return null;
}

// ─── O que é gravado ────────────────────────────────────────────────────────
export type ResultadoPreparo = { ok: true; respostas: Answers } | { ok: false; erro: ErroPergunta };

/**
 * Valida todas as perguntas visíveis e monta a linha final.
 *
 * - pergunta escondida vira NULL, mesmo que o rascunho guarde um valor antigo
 *   (a pessoa marcou "Manhã", respondeu o horário e depois trocou para "Tarde");
 * - follow-up fechado vira NULL;
 * - texto vazio vira NULL;
 * - `available_periods` sai resolvido a partir de `preferred_period`.
 */
export function prepararRespostas(a: Draft): ResultadoPreparo {
  const r: Record<string, unknown> = {
    whatsapp_content_other: null,
    preferred_weekday_other: null,
    available_periods: null,
  };
  for (const q of QUESTIONS) r[q.id] = null;

  for (const q of QUESTIONS) {
    if (!perguntaVisivel(q, a)) continue;
    const erro = erroNaPergunta(q, a);
    if (erro) return { ok: false, erro };

    const v = a[q.id];
    if (q.kind === "text") {
      r[q.id] = limparTexto(v);
    } else if (q.kind === "multi") {
      const marcados = new Set((v as string[] | null | undefined) ?? []);
      // Ordem da tela, sem repetição: o mesmo conjunto grava sempre igual.
      r[q.id] = q.options.map((o) => o.value).filter((x) => marcados.has(x));
    } else {
      r[q.id] = v ?? null;
    }

    if ((q.kind === "single" || q.kind === "multi") && q.followUp?.kind === "text" && followUpAtivo(q, a)) {
      r[q.followUp.field] = limparTexto(a[q.followUp.field]);
    }
  }

  if (temInteresseNaSemana(a) && a.preferred_period != null) {
    const periodos = periodosEfetivos(a);
    r.available_periods = PERIODS.filter((p) => periodos.includes(p));
  }

  return { ok: true, respostas: r as unknown as Answers };
}

// ─── NPS ────────────────────────────────────────────────────────────────────
export type NpsCategory = "promoter" | "passive" | "detractor";

/** 0 a 6 detrator, 7 e 8 neutro, 9 e 10 promotor. */
export function categoriaNps(nota: number): NpsCategory {
  if (nota >= 9) return "promoter";
  if (nota >= 7) return "passive";
  return "detractor";
}

/** NPS de um conjunto: % promotores − % detratores, de −100 a 100. */
export function calcularNps(notas: readonly number[]) {
  const total = notas.length;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  for (const n of notas) {
    const c = categoriaNps(n);
    if (c === "promoter") promoters++;
    else if (c === "passive") passives++;
    else detractors++;
  }
  const nps = total === 0 ? null : Math.round(((promoters - detractors) / total) * 1000) / 10;
  return { total, promoters, passives, detractors, nps };
}
