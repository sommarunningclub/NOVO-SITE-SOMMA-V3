"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { QUESTION_BY_ID } from "@/lib/assessoria-nps/survey";
import { progressoDaTela, secoesVisiveis, sequenciaDeTelas } from "@/lib/assessoria-nps/logic";
import { useSurvey } from "./useSurvey";
import { FORM_ID, type ConviteInicial } from "./types";
import { SurveyShell } from "./ui/SurveyShell";
import { SectionRail } from "./ui/SectionRail";
import { ProgressIndicator } from "./ui/ProgressIndicator";
import { SurveyNavigation } from "./ui/SurveyNavigation";
import { IntroScreen } from "./screens/IntroScreen";
import { IdentityScreen } from "./screens/IdentityScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { StatusScreen } from "./screens/StatusScreen";

/** Tempo para a pessoa ver a própria escolha marcada antes de a tela trocar. */
const PAUSA_AVANCO_MS = 300;

function variantes(reduzir: boolean): Variants {
  return {
    entra: (d: number) => (reduzir ? { opacity: 0 } : { opacity: 0, y: 22 * d }),
    centro: {
      opacity: 1,
      y: 0,
      transition: { duration: reduzir ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] },
    },
    sai: (d: number) =>
      reduzir
        ? { opacity: 0, transition: { duration: 0.08 } }
        : { opacity: 0, y: -14 * d, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } },
  };
}

interface SurveyFlowProps {
  campanha: string;
  convite: ConviteInicial | null;
}

/** Orquestra telas, progresso e navegação. O estado mora em `useSurvey`. */
export function SurveyFlow({ campanha, convite }: SurveyFlowProps) {
  const survey = useSurvey({ campanha, convite });
  const { state, avancar } = survey;
  const reduzir = useReducedMotion() ?? false;
  const relogio = useRef<number | undefined>(undefined);

  const avancarAposEscolha = useCallback(() => {
    window.clearTimeout(relogio.current);
    relogio.current = window.setTimeout(avancar, reduzir ? 120 : PAUSA_AVANCO_MS);
  }, [avancar, reduzir]);

  // Trocou de tela antes do avanço automático (Voltar, Continuar): cancela.
  useEffect(() => () => window.clearTimeout(relogio.current), [state.tela, state.fase]);

  const emFluxo = state.fase === "fluxo";
  const pergunta = emFluxo && state.tela !== "identity" ? QUESTION_BY_ID.get(state.tela) : undefined;
  const progresso = progressoDaTela(state.tela, state.answers);
  const telas = sequenciaDeTelas(state.answers);
  const ultima = emFluxo && telas[telas.length - 1] === state.tela;
  const enviando = state.envio === "solicitado" || state.envio === "enviando";
  // Primeira renderização e hidratação não roubam o foco; navegação sim.
  const focar = state.nav.seq > 1;

  const rotulo = ultima
    ? state.envio === "falhou"
      ? "Tentar enviar de novo"
      : "Enviar respostas"
    : state.mensagem?.tipo === "incentivo"
      ? "Pular esta pergunta"
      : "Continuar";

  return (
    <SurveyShell
      rail={<SectionRail secoes={secoesVisiveis(state.answers)} atual={emFluxo ? progresso.secao.id : null} />}
      header={
        emFluxo ? (
          <ProgressIndicator
            titulo={progresso.secao.title}
            indice={progresso.secaoIndice}
            total={progresso.secoesTotal}
            fracao={progresso.fracao}
          />
        ) : null
      }
      footer={
        emFluxo ? (
          <SurveyNavigation
            onVoltar={survey.voltar}
            rotulo={rotulo}
            form={FORM_ID}
            carregando={enviando}
            destaque={ultima}
          />
        ) : null
      }
    >
      <AnimatePresence mode="wait" initial={false} custom={state.direcao}>
        <motion.div
          key={emFluxo ? state.tela : state.fase}
          custom={state.direcao}
          variants={variantes(reduzir)}
          initial="entra"
          animate="centro"
          exit="sai"
          className="flex flex-1 flex-col"
        >
          {state.fase === "intro" && (
            <IntroScreen
              nome={state.usarConvite ? (state.prefill?.firstName ?? null) : null}
              temRascunho={state.temRascunho}
              onComecar={survey.comecar}
              onRecomecar={survey.recomecar}
            />
          )}

          {emFluxo && state.tela === "identity" && (
            <IdentityScreen
              firstName={state.firstName}
              lastName={state.lastName}
              preenchido={state.usarConvite && state.prefill != null}
              mensagem={state.mensagem}
              focarTitulo={focar}
              onNome={survey.setNome}
              onEnviar={avancar}
            />
          )}

          {pergunta && (
            <QuestionScreen
              pergunta={pergunta}
              answers={state.answers}
              mensagem={state.mensagem}
              erroEnvio={ultima && state.envio === "falhou" ? state.envioErro : null}
              focarTitulo={focar}
              onResponder={survey.responder}
              onEscolhaConcluida={avancarAposEscolha}
              onEnviar={avancar}
            />
          )}

          {(state.fase === "enviado" || state.fase === "ja-respondeu") && (
            <StatusScreen
              variante={state.fase}
              nome={state.nomeEnviado}
              focar={focar}
              onOutraPessoa={survey.outraPessoa}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </SurveyShell>
  );
}
