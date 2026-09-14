"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { QUESTIONS, QUESTION_BY_ID, SURVEY_VERSION, type AnswerKey, type Draft } from "@/lib/assessoria-nps/survey";
import {
  erroNaPergunta,
  isScreenKey,
  limparTexto,
  prepararRespostas,
  secaoDaTela,
  secoesVisiveis,
  sequenciaDeTelas,
  type ScreenKey,
} from "@/lib/assessoria-nps/logic";
import { capitalizarNome, erroNoNome } from "@/lib/assessoria-nps/nome";
import {
  lerEstado,
  limparEstado,
  marcarEnviado,
  novoIdDeEnvio,
  salvarRascunho,
  type EstadoSalvo,
} from "@/lib/assessoria-nps/storage";
import { capturarOrigem, faixaDeDuracao, track, type Origem } from "@/lib/assessoria-nps/analytics";
import { enviarRespostas } from "./survey-api";
import type { ConviteInicial } from "./types";

/**
 * Estado da pesquisa: navegação, respostas, rascunho local, histórico do
 * navegador e envio.
 *
 * Toda transição é pura, no reducer. Validar e escolher a próxima tela lá
 * dentro é o que permite o avanço automático (um setTimeout depois do toque)
 * sem ler resposta velha de closure. Efeitos colaterais (localStorage,
 * history, fetch, analytics) reagem ao estado nos `useEffect` abaixo.
 */

/** Refresh dentro desta janela volta direto para a pergunta. Depois, passa pela abertura. */
const RETOMADA_DIRETA_MS = 30 * 60 * 1000;

export type Fase = "intro" | "fluxo" | "enviado" | "ja-respondeu";

export interface MensagemTela {
  campo: string;
  texto: string;
  tipo: "erro" | "incentivo";
}

type ModoNav = "push" | "replace" | "nenhum";

export interface SurveyState {
  hidratado: boolean;
  fase: Fase;
  submissionId: string;
  startedAt: number | null;
  firstName: string;
  lastName: string;
  prefill: { firstName: string; lastName: string } | null;
  usarConvite: boolean;
  answers: Draft;
  tela: ScreenKey;
  direcao: 1 | -1;
  mensagem: MensagemTela | null;
  envio: "ocioso" | "solicitado" | "enviando" | "falhou";
  envioErro: string | null;
  temRascunho: boolean;
  nomeEnviado: string | null;
  nav: { seq: number; modo: ModoNav };
}

type Acao =
  | { type: "hidratar"; salvo: EstadoSalvo | null }
  | { type: "comecar" }
  | { type: "recomecar" }
  | { type: "nome"; parte: "firstName" | "lastName"; valor: string }
  | { type: "responder"; campo: AnswerKey; valor: unknown }
  | { type: "avancar" }
  | { type: "voltar" }
  | { type: "historico"; chave: string }
  | { type: "corrigir"; campo: string | null; texto: string }
  | { type: "envioIniciado" }
  | { type: "envioFalhou"; texto: string }
  | { type: "enviado" }
  | { type: "jaRespondeu" }
  | { type: "outraPessoa" };

// ─── Apoio ──────────────────────────────────────────────────────────────────
type Contexto = Pick<SurveyState, "answers" | "firstName" | "lastName">;

function nav(s: SurveyState, modo: ModoNav): SurveyState["nav"] {
  return { seq: s.nav.seq + 1, modo };
}

function erroDaTela(tela: ScreenKey, s: Contexto): MensagemTela | null {
  if (tela === "identity") {
    const nome = erroNoNome(s.firstName, "first_name");
    if (nome) return { campo: "first_name", texto: nome, tipo: "erro" };
    const sobrenome = erroNoNome(s.lastName, "last_name");
    if (sobrenome) return { campo: "last_name", texto: sobrenome, tipo: "erro" };
    return null;
  }
  const q = QUESTION_BY_ID.get(tela);
  const erro = q ? erroNaPergunta(q, s.answers) : null;
  return erro ? { campo: erro.field, texto: erro.message, tipo: "erro" } : null;
}

const ORDEM = new Map<ScreenKey, number>([
  ["identity", -1],
  ...QUESTIONS.map((q, i): [ScreenKey, number] => [q.id, i]),
]);

/**
 * A tela pedida, ou a primeira pendente antes dela. Impede que o "avançar" do
 * navegador pule pergunta obrigatória, e resolve a tela que sumiu porque uma
 * resposta anterior mudou.
 */
function telaAlcancavel(alvo: ScreenKey, s: Contexto): ScreenKey {
  const limite = ORDEM.get(alvo) ?? -1;
  let ultima: ScreenKey = "identity";
  for (const t of sequenciaDeTelas(s.answers)) {
    if ((ORDEM.get(t) ?? -1) > limite) break;
    if (t === alvo) return t;
    if (erroDaTela(t, s)) return t;
    ultima = t;
  }
  return ultima;
}

/** Campo devolvido pelo servidor → a tela onde ele é respondido. */
const TELA_DO_CAMPO: Record<string, ScreenKey> = {
  first_name: "identity",
  last_name: "identity",
  whatsapp_content_other: "whatsapp_content_preferences",
  preferred_weekday_other: "preferred_weekday_combination",
  available_periods: "preferred_period",
};

function telaDoCampo(campo: string | null): ScreenKey | null {
  if (!campo) return null;
  if (TELA_DO_CAMPO[campo]) return TELA_DO_CAMPO[campo];
  return isScreenKey(campo) ? campo : null;
}

function estadoInicial(convite: ConviteInicial | null): SurveyState {
  return {
    hidratado: false,
    fase: convite?.jaRespondeu ? "ja-respondeu" : "intro",
    submissionId: "",
    startedAt: null,
    firstName: convite?.firstName ?? "",
    lastName: convite?.lastName ?? "",
    prefill: convite ? { firstName: convite.firstName, lastName: convite.lastName } : null,
    usarConvite: Boolean(convite),
    answers: {},
    tela: "identity",
    direcao: 1,
    mensagem: null,
    envio: "ocioso",
    envioErro: null,
    temRascunho: false,
    nomeEnviado: convite?.jaRespondeu ? convite.firstName : null,
    nav: { seq: 0, modo: "nenhum" },
  };
}

// ─── Reducer ────────────────────────────────────────────────────────────────
function reducer(s: SurveyState, a: Acao): SurveyState {
  const ocupado = s.envio === "solicitado" || s.envio === "enviando";

  switch (a.type) {
    case "hidratar": {
      const base: SurveyState = { ...s, hidratado: true, submissionId: s.submissionId || novoIdDeEnvio() };
      if (s.fase === "ja-respondeu") return { ...base, nav: nav(s, "replace") };

      const salvo = a.salvo;
      if (salvo?.status === "submitted") {
        return {
          ...base,
          fase: "enviado",
          submissionId: salvo.submissionId,
          nomeEnviado: salvo.firstName || null,
          nav: nav(s, "replace"),
        };
      }
      if (salvo?.status === "draft") {
        const ctx: Contexto = {
          answers: salvo.answers,
          firstName: salvo.firstName || s.firstName,
          lastName: salvo.lastName || s.lastName,
        };
        const recente = Date.now() - salvo.updatedAt < RETOMADA_DIRETA_MS;
        return {
          ...base,
          ...ctx,
          fase: recente ? "fluxo" : "intro",
          temRascunho: true,
          submissionId: salvo.submissionId,
          startedAt: salvo.startedAt,
          tela: telaAlcancavel(isScreenKey(salvo.tela) ? salvo.tela : "identity", ctx),
          nav: nav(s, "replace"),
        };
      }
      return { ...base, nav: nav(s, "replace") };
    }

    case "comecar": {
      if (s.fase !== "intro") return s;
      return {
        ...s,
        fase: "fluxo",
        startedAt: s.startedAt ?? Date.now(),
        tela: s.temRascunho ? telaAlcancavel(s.tela, s) : "identity",
        direcao: 1,
        mensagem: null,
        nav: nav(s, "push"),
      };
    }

    case "recomecar": {
      return {
        ...s,
        fase: "fluxo",
        submissionId: novoIdDeEnvio(),
        startedAt: Date.now(),
        firstName: s.usarConvite ? (s.prefill?.firstName ?? "") : "",
        lastName: s.usarConvite ? (s.prefill?.lastName ?? "") : "",
        answers: {},
        tela: "identity",
        direcao: 1,
        mensagem: null,
        envio: "ocioso",
        envioErro: null,
        temRascunho: false,
        nav: nav(s, "push"),
      };
    }

    case "nome":
      return { ...s, [a.parte]: a.valor, mensagem: null };

    case "responder":
      if (ocupado) return s;
      return { ...s, answers: { ...s.answers, [a.campo]: a.valor }, mensagem: null, envioErro: null };

    case "avancar": {
      if (s.fase !== "fluxo" || ocupado) return s;

      const erro = erroDaTela(s.tela, s);
      if (erro) return { ...s, mensagem: erro };

      // Pergunta aberta incentivada: pede uma vez, deixa pular na segunda.
      const q = s.tela === "identity" ? undefined : QUESTION_BY_ID.get(s.tela);
      if (q?.kind === "text" && q.encourage && !limparTexto(s.answers[q.id])) {
        const jaPediu = s.mensagem?.tipo === "incentivo" && s.mensagem.campo === q.id;
        if (!jaPediu) return { ...s, mensagem: { campo: q.id, texto: q.encourage, tipo: "incentivo" } };
      }

      const telas = sequenciaDeTelas(s.answers);
      const proxima = telas[telas.indexOf(s.tela) + 1];
      if (proxima) {
        return { ...s, tela: proxima, direcao: 1, mensagem: null, nav: nav(s, "push") };
      }

      // Última tela: confere tudo antes de pedir o envio.
      const pendente = telaAlcancavel(telas[telas.length - 1], s);
      const erroPendente = erroDaTela(pendente, s);
      if (erroPendente) {
        return { ...s, tela: pendente, direcao: -1, mensagem: erroPendente, nav: nav(s, "push") };
      }
      const preparo = prepararRespostas(s.answers);
      if (!preparo.ok) {
        const tela = telaDoCampo(preparo.erro.field) ?? s.tela;
        return {
          ...s,
          tela,
          direcao: -1,
          mensagem: { campo: preparo.erro.field, texto: preparo.erro.message, tipo: "erro" },
          nav: nav(s, "push"),
        };
      }
      return { ...s, mensagem: null, envio: "solicitado", envioErro: null };
    }

    case "voltar": {
      if (s.fase !== "fluxo" || ocupado) return s;
      const telas = sequenciaDeTelas(s.answers);
      const i = telas.indexOf(s.tela);
      if (i <= 0) {
        return { ...s, fase: "intro", temRascunho: true, direcao: -1, mensagem: null, nav: nav(s, "replace") };
      }
      return { ...s, tela: telas[i - 1], direcao: -1, mensagem: null, envioErro: null, nav: nav(s, "replace") };
    }

    case "historico": {
      if (!s.hidratado || ocupado || s.fase === "enviado" || s.fase === "ja-respondeu") return s;
      if (a.chave === "intro") {
        return {
          ...s,
          fase: "intro",
          temRascunho: s.startedAt != null,
          direcao: -1,
          mensagem: null,
          nav: nav(s, "nenhum"),
        };
      }
      if (!isScreenKey(a.chave)) return s;
      const alvo = telaAlcancavel(a.chave, s);
      const telas = sequenciaDeTelas(s.answers);
      const direcao = s.fase === "fluxo" && telas.indexOf(alvo) < telas.indexOf(s.tela) ? -1 : 1;
      return {
        ...s,
        fase: "fluxo",
        startedAt: s.startedAt ?? Date.now(),
        tela: alvo,
        direcao,
        mensagem: null,
        envioErro: null,
        // Pediu uma tela que ainda não pode abrir: corrige a entrada do histórico.
        nav: nav(s, alvo === a.chave ? "nenhum" : "replace"),
      };
    }

    case "corrigir": {
      const tela = telaDoCampo(a.campo) ?? s.tela;
      return {
        ...s,
        fase: "fluxo",
        tela,
        direcao: -1,
        envio: "ocioso",
        envioErro: null,
        mensagem: { campo: a.campo ?? String(tela), texto: a.texto, tipo: "erro" },
        nav: nav(s, tela === s.tela ? "nenhum" : "push"),
      };
    }

    case "envioIniciado":
      return s.envio === "solicitado" ? { ...s, envio: "enviando" } : s;

    case "envioFalhou":
      return { ...s, envio: "falhou", envioErro: a.texto };

    case "enviado":
      return {
        ...s,
        fase: "enviado",
        envio: "ocioso",
        envioErro: null,
        nomeEnviado: capitalizarNome(s.firstName) || null,
        answers: {},
        temRascunho: false,
        nav: nav(s, "replace"),
      };

    case "jaRespondeu":
      return {
        ...s,
        fase: "ja-respondeu",
        envio: "ocioso",
        envioErro: null,
        nomeEnviado: capitalizarNome(s.firstName) || null,
        answers: {},
        temRascunho: false,
        nav: nav(s, "replace"),
      };

    case "outraPessoa":
      return {
        ...estadoInicial(null),
        hidratado: true,
        submissionId: novoIdDeEnvio(),
        nav: nav(s, "replace"),
      };
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────
interface HistoricoNps {
  nps?: unknown;
  i?: unknown;
}

export function useSurvey({ campanha, convite }: { campanha: string; convite: ConviteInicial | null }) {
  const [state, dispatch] = useReducer(reducer, convite, estadoInicial);
  const origem = useRef<Origem>({});
  const secoesConcluidas = useRef(new Set<string>());
  const telaAnterior = useRef<ScreenKey | null>(null);
  const ultimaNav = useRef(-1);

  // 1. Hidratação: rascunho, origem do acesso, evento de abertura.
  useEffect(() => {
    const salvo = lerEstado(campanha, SURVEY_VERSION);
    origem.current = capturarOrigem();
    dispatch({ type: "hidratar", salvo });
    track("nps_survey_opened", { invited: Boolean(convite), resumed: salvo?.status === "draft" });
  }, [campanha, convite]);

  // 2. Histórico: cada pergunta é uma entrada, então o "voltar" do celular volta
  //    uma pergunta em vez de sair da pesquisa. O Next copia o próprio estado
  //    para dentro do objeto passado ao pushState, então o roteador não se perde.
  useEffect(() => {
    if (!state.hidratado || state.nav.seq === ultimaNav.current) return;
    ultimaNav.current = state.nav.seq;
    if (state.nav.modo === "nenhum") return;

    const chave = state.fase === "fluxo" ? state.tela : state.fase;
    const atual = (window.history.state ?? {}) as HistoricoNps;
    const i = typeof atual.i === "number" ? atual.i : 0;
    if (state.nav.modo === "push") window.history.pushState({ nps: chave, i: i + 1 }, "");
    else window.history.replaceState({ nps: chave, i }, "");
  }, [state.hidratado, state.nav, state.fase, state.tela]);

  useEffect(() => {
    const aoVoltar = (e: PopStateEvent) => {
      const chave = (e.state as HistoricoNps | null)?.nps;
      if (typeof chave === "string") dispatch({ type: "historico", chave });
    };
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  // 3. Topo da página a cada troca de tela (pergunta longa no celular).
  useEffect(() => {
    if (state.hidratado) window.scrollTo({ top: 0 });
  }, [state.hidratado, state.fase, state.tela]);

  // 4. Rascunho local.
  useEffect(() => {
    if (!state.hidratado || state.startedAt == null) return;
    if (state.fase !== "fluxo" && state.fase !== "intro") return;
    salvarRascunho(campanha, {
      surveyVersion: SURVEY_VERSION,
      submissionId: state.submissionId,
      startedAt: state.startedAt,
      firstName: state.firstName,
      lastName: state.lastName,
      answers: state.answers,
      tela: state.tela,
    });
  }, [
    campanha,
    state.hidratado,
    state.fase,
    state.startedAt,
    state.submissionId,
    state.firstName,
    state.lastName,
    state.answers,
    state.tela,
  ]);

  // 5. Seção concluída (só avanço, uma vez por seção).
  useEffect(() => {
    if (state.fase !== "fluxo") {
      telaAnterior.current = null;
      return;
    }
    const antes = telaAnterior.current;
    telaAnterior.current = state.tela;
    if (!antes || state.direcao !== 1) return;

    const secaoAntes = secaoDaTela(antes);
    if (secaoAntes === secaoDaTela(state.tela) || secoesConcluidas.current.has(secaoAntes)) return;
    secoesConcluidas.current.add(secaoAntes);
    const secoes = secoesVisiveis(state.answers);
    track("nps_step_completed", {
      step_id: secaoAntes,
      step_index: secoes.findIndex((x) => x.id === secaoAntes) + 1,
      steps_total: secoes.length,
    });
  }, [state.fase, state.tela, state.direcao, state.answers]);

  // 6. Envio. Um por pedido: o reducer só aceita "solicitado" fora de envio.
  useEffect(() => {
    if (state.envio !== "solicitado") return;
    dispatch({ type: "envioIniciado" });

    const duracao = state.startedAt ? Math.max(0, Date.now() - state.startedAt) : 0;
    const submissionId = state.submissionId;
    const firstName = state.firstName;

    void enviarRespostas({
      campaign: campanha,
      survey_version: SURVEY_VERSION,
      submission_id: submissionId,
      first_name: firstName,
      last_name: state.lastName,
      answers: state.answers,
      elapsed_ms: duracao,
      use_invite: state.usarConvite,
      attribution: origem.current,
    }).then((r) => {
      if (r.tipo === "ok") {
        marcarEnviado(campanha, {
          surveyVersion: SURVEY_VERSION,
          submissionId,
          submittedAt: Date.now(),
          firstName: capitalizarNome(firstName),
        });
        track("nps_step_completed", { step_id: "final" });
        track("nps_survey_submitted", { duration_bucket: faixaDeDuracao(duracao), invited: state.usarConvite });
        dispatch({ type: "enviado" });
        return;
      }
      if (r.tipo === "ja-respondeu") {
        limparEstado(campanha);
        dispatch({ type: "jaRespondeu" });
        return;
      }
      track("nps_survey_error", { error_type: r.motivo });
      if (r.motivo === "validacao") dispatch({ type: "corrigir", campo: r.campo, texto: r.mensagem });
      else dispatch({ type: "envioFalhou", texto: r.mensagem });
    });
  }, [
    campanha,
    state.envio,
    state.startedAt,
    state.submissionId,
    state.firstName,
    state.lastName,
    state.answers,
    state.usarConvite,
  ]);

  // ─── Ações ──────────────────────────────────────────────────────────────
  const comecar = useCallback(() => {
    track("nps_survey_started", { resumed: state.temRascunho, invited: state.usarConvite });
    dispatch({ type: "comecar" });
  }, [state.temRascunho, state.usarConvite]);

  const recomecar = useCallback(() => {
    track("nps_survey_started", { resumed: false, invited: state.usarConvite });
    dispatch({ type: "recomecar" });
  }, [state.usarConvite]);

  const setNome = useCallback((parte: "firstName" | "lastName", valor: string) => {
    dispatch({ type: "nome", parte, valor });
  }, []);

  const responder = useCallback((campo: AnswerKey, valor: unknown) => {
    dispatch({ type: "responder", campo, valor });
  }, []);

  const avancar = useCallback(() => dispatch({ type: "avancar" }), []);

  /** Com entrada nossa no histórico, volta por ele (mantém o "voltar" do celular coerente). */
  const voltar = useCallback(() => {
    const h = window.history.state as HistoricoNps | null;
    if (typeof h?.nps === "string" && typeof h.i === "number" && h.i > 0) window.history.back();
    else dispatch({ type: "voltar" });
  }, []);

  const outraPessoa = useCallback(() => {
    limparEstado(campanha);
    if (convite) void fetch("/api/assessoria/nps/convite", { method: "DELETE" }).catch(() => undefined);
    secoesConcluidas.current.clear();
    dispatch({ type: "outraPessoa" });
  }, [campanha, convite]);

  return { state, comecar, recomecar, setNome, responder, avancar, voltar, outraPessoa };
}
