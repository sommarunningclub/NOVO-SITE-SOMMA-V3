"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { AlertCircle } from "lucide-react";
import type { AnswerKey, Draft, Question } from "@/lib/assessoria-nps/survey";
import { FORM_ID } from "../types";
import type { MensagemTela } from "../useSurvey";
import { QuestionRenderer } from "../QuestionRenderer";
import { MensagemDaTela } from "../ui/MensagemDaTela";

interface QuestionScreenProps {
  pergunta: Question;
  /** Enunciado já resolvido: cita o professor quando ele é conhecido. */
  titulo: string;
  answers: Draft;
  mensagem: MensagemTela | null;
  erroEnvio: string | null;
  focarTitulo: boolean;
  onResponder: (campo: AnswerKey, valor: unknown) => void;
  onEscolhaConcluida: () => void;
  onEnviar: () => void;
}

/** Enter confirma também em rádio e checkbox; no texto longo, Ctrl/⌘ + Enter. */
function atalhoDeEnvio(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  const alvo = e.target;
  const emOpcao = alvo instanceof HTMLInputElement && (alvo.type === "radio" || alvo.type === "checkbox");
  const emTextoLongo = alvo instanceof HTMLTextAreaElement && (e.metaKey || e.ctrlKey);
  if (emOpcao || emTextoLongo) {
    e.preventDefault();
    e.currentTarget.requestSubmit();
  }
}

export function QuestionScreen({
  pergunta,
  titulo: enunciado,
  answers,
  mensagem,
  erroEnvio,
  focarTitulo,
  onResponder,
  onEscolhaConcluida,
  onEnviar,
}: QuestionScreenProps) {
  const titulo = useRef<HTMLHeadingElement>(null);

  // Foco no enunciado a cada pergunta nova: leitor de tela lê a pergunta, e o
  // Tab seguinte cai na primeira alternativa.
  useEffect(() => {
    if (focarTitulo) titulo.current?.focus({ preventScroll: true });
  }, [focarTitulo]);

  const ids = {
    titulo: `${pergunta.id}-titulo`,
    ajuda: `${pergunta.id}-ajuda`,
    mensagem: `${pergunta.id}-mensagem`,
  };
  const opcional = pergunta.kind === "text" && !pergunta.required && !pergunta.encourage;
  const describedBy =
    [pergunta.helper ? ids.ajuda : null, mensagem ? ids.mensagem : null].filter(Boolean).join(" ") || undefined;

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar();
      }}
      onKeyDown={atalhoDeEnvio}
      className="flex w-full max-w-[760px] flex-1 flex-col pb-8 pt-6 sm:pt-10 md:justify-center lg:pb-10 lg:pt-6"
    >
      {/* A etapa já está no cabeçalho de progresso; aqui só o que ele não diz. */}
      {opcional && (
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">Opcional</p>
      )}
      <h1
        ref={titulo}
        id={ids.titulo}
        tabIndex={-1}
        className="text-balance text-[26px] font-semibold leading-[1.16] tracking-[-0.02em] focus:outline-none sm:text-[34px] lg:text-[42px] lg:leading-[1.1]"
      >
        {enunciado}
      </h1>
      {pergunta.helper && (
        <p id={ids.ajuda} className="mt-3 text-[15px] text-white/60">
          {pergunta.helper}
        </p>
      )}

      <div className="mt-7 sm:mt-10">
        <QuestionRenderer
          pergunta={pergunta}
          answers={answers}
          labelledBy={ids.titulo}
          describedBy={describedBy}
          campoInvalido={mensagem?.tipo === "erro" ? mensagem.campo : null}
          onResponder={onResponder}
          onEscolhaConcluida={onEscolhaConcluida}
        />
      </div>

      <MensagemDaTela id={ids.mensagem} texto={mensagem?.texto ?? null} tipo={mensagem?.tipo ?? "erro"} />

      {erroEnvio && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-2xl bg-[#ff6a4d]/[0.1] px-4 py-3.5 text-[15px] leading-snug text-[#ffb3a3]"
        >
          <AlertCircle className="mt-[3px] h-4 w-4 shrink-0" aria-hidden="true" />
          {erroEnvio}
        </p>
      )}
    </form>
  );
}
