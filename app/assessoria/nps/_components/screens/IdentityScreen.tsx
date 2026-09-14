"use client";

import { useEffect, useRef, type KeyboardEvent, type Ref } from "react";
import { cn } from "@/lib/utils";
import { NOME_MAX, SOBRENOME_MAX } from "@/lib/assessoria-nps/nome";
import { FORM_ID } from "../types";
import type { MensagemTela } from "../useSurvey";
import { campoTexto } from "../ui/styles";

interface IdentityScreenProps {
  firstName: string;
  lastName: string;
  /** Veio de link pessoal: a tela pede confirmação em vez de digitação. */
  preenchido: boolean;
  mensagem: MensagemTela | null;
  focarTitulo: boolean;
  onNome: (parte: "firstName" | "lastName", valor: string) => void;
  onEnviar: () => void;
}

export function IdentityScreen({
  firstName,
  lastName,
  preenchido,
  mensagem,
  focarTitulo,
  onNome,
  onEnviar,
}: IdentityScreenProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const sobrenomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focarTitulo) titulo.current?.focus({ preventScroll: true });
  }, [focarTitulo]);

  // Erro leva o foco direto ao campo que precisa de atenção.
  useEffect(() => {
    if (mensagem?.tipo !== "erro") return;
    (mensagem.campo === "last_name" ? sobrenomeRef : nomeRef).current?.focus();
  }, [mensagem]);

  const erroNome = mensagem?.campo === "first_name" ? mensagem.texto : null;
  const erroSobrenome = mensagem?.campo === "last_name" ? mensagem.texto : null;

  // Enter no nome, com sobrenome vazio, pula para o sobrenome em vez de validar.
  function enterNoNome(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !lastName.trim()) {
      e.preventDefault();
      sobrenomeRef.current?.focus();
    }
  }

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar();
      }}
      className="flex w-full max-w-[760px] flex-1 flex-col pb-8 pt-6 sm:pt-10 md:justify-center lg:pb-10 lg:pt-6"
    >
      <h1
        ref={titulo}
        tabIndex={-1}
        className="text-balance text-[28px] font-semibold leading-[1.14] tracking-[-0.02em] focus:outline-none sm:text-[36px] lg:text-[44px] lg:leading-[1.08]"
      >
        {preenchido ? "Confirme seu nome" : "Para começar, como você se chama?"}
      </h1>
      <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/65 sm:text-[16px]">
        {preenchido
          ? "Preenchemos com o seu cadastro na assessoria. Se algo estiver diferente, é só corrigir."
          : "Suas respostas ficam vinculadas ao seu nome e são lidas apenas pela equipe da Assessoria Somma."}
      </p>

      <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2">
        <Campo
          id="nps-first-name"
          rotulo="Nome"
          valor={firstName}
          erro={erroNome}
          autoComplete="given-name"
          maxLength={NOME_MAX}
          enterKeyHint="next"
          inputRef={nomeRef}
          onKeyDown={enterNoNome}
          onChange={(v) => onNome("firstName", v)}
        />
        <Campo
          id="nps-last-name"
          rotulo="Sobrenome"
          valor={lastName}
          erro={erroSobrenome}
          autoComplete="family-name"
          maxLength={SOBRENOME_MAX}
          enterKeyHint="go"
          inputRef={sobrenomeRef}
          onChange={(v) => onNome("lastName", v)}
        />
      </div>
    </form>
  );
}

interface CampoProps {
  id: string;
  rotulo: string;
  valor: string;
  erro: string | null;
  autoComplete: string;
  maxLength: number;
  enterKeyHint: "next" | "go";
  inputRef: Ref<HTMLInputElement>;
  onChange: (valor: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

function Campo({ id, rotulo, valor, erro, autoComplete, maxLength, enterKeyHint, inputRef, onChange, onKeyDown }: CampoProps) {
  const erroId = `${id}-erro`;
  return (
    <div>
      <label htmlFor={id} className="mb-2.5 block text-[14px] font-medium text-white/80">
        {rotulo}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        required
        aria-required="true"
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? erroId : undefined}
        autoComplete={autoComplete}
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint={enterKeyHint}
        maxLength={maxLength}
        className={cn(campoTexto, "h-14")}
      />
      {erro && (
        <p id={erroId} role="alert" className="mt-2 text-[14px] text-[#ff6a4d]">
          {erro}
        </p>
      )}
    </div>
  );
}
