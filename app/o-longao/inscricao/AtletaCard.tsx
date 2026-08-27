"use client";

import { useId, useState } from "react";
import { formatCPF } from "@/lib/cpf";
import { maskPhone } from "@/lib/validation";
import { formatBirthDate, CAMISETAS } from "@/lib/o-longao/schema";
import { nomeDigitando } from "@/lib/o-longao/nome";
import { Campo, Selecao } from "./Campos";
import type { AtletaForm } from "./tipos";

/**
 * Cartão de um atleta.
 *
 * Nove campos por pessoa, oito pessoas por equipe: se todos ficassem abertos,
 * a etapa viraria um paredão de 72 inputs. O cartão nasce fechado mostrando só
 * o resumo, e abre um de cada vez. O primeiro vazio abre sozinho para a pessoa
 * saber por onde começar.
 *
 * As máscaras rodam na digitação (CPF, telefone, nascimento) e o nome sobe de
 * caixa sem comer o espaço do sobrenome: é o mesmo tratamento que o schema
 * aplica na gravação, então o que se vê é o que se grava.
 */
export function AtletaCard({
  atleta,
  indice,
  rotulo,
  erros,
  aberto,
  onToggle,
  onChange,
  onRemover,
}: {
  atleta: AtletaForm;
  indice: number;
  rotulo: string;
  erros: Record<string, string>;
  aberto: boolean;
  onToggle: () => void;
  onChange: (campo: keyof AtletaForm, valor: string) => void;
  onRemover?: () => void;
}) {
  const uid = useId();
  const [tocado, setTocado] = useState(false);

  const numero = String(indice + 1).padStart(2, "0");
  const temErro = Object.keys(erros).length > 0;
  const completo =
    atleta.nome.trim() !== "" &&
    atleta.cpf.trim() !== "" &&
    atleta.nascimento.trim() !== "" &&
    atleta.telefone.trim() !== "" &&
    atleta.email.trim() !== "" &&
    atleta.camiseta.trim() !== "" &&
    atleta.emergencia_nome.trim() !== "" &&
    atleta.emergencia_telefone.trim() !== "";

  const campo = (nome: keyof AtletaForm) => ({
    value: atleta[nome],
    erro: tocado || temErro ? erros[nome] : undefined,
    id: `${uid}-${nome}`,
  });

  return (
    <li className="lgo-panel">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        aria-controls={`${uid}-corpo`}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          aria-hidden
          className={`lgo-num flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-bold ${
            temErro
              ? "border-[color:var(--somma)] text-[color:var(--somma)]"
              : completo
                ? "border-[color:var(--sinal)] text-[color:var(--sinal)]"
                : "border-[color:var(--line)] text-[color:rgba(242,240,236,0.5)]"
          }`}
        >
          {onRemover ? "R" : numero}
        </span>

        <span className="min-w-0 flex-1">
          <span className="lgo-label block text-[color:rgba(242,240,236,0.45)]">{rotulo}</span>
          <span className="mt-0.5 block truncate text-sm text-[color:var(--papel)]">
            {atleta.nome.trim() || "a preencher"}
          </span>
        </span>

        {temErro ? (
          <span className="lgo-mono shrink-0 text-xs text-[color:var(--somma)]">revisar</span>
        ) : completo ? (
          <span aria-hidden className="shrink-0 text-[color:var(--sinal)]">✓</span>
        ) : null}

        <span
          aria-hidden
          className={`shrink-0 text-[color:rgba(242,240,236,0.5)] transition-transform duration-300 ${
            aberto ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      <div id={`${uid}-corpo`} hidden={!aberto}>
        <div
          className="grid gap-4 border-t border-[color:var(--line)] p-4 md:grid-cols-2"
          onBlur={() => setTocado(true)}
        >
          <div className="md:col-span-2">
            <Campo
              {...campo("nome")}
              label="Nome completo"
              autoComplete="off"
              onChange={(e) => onChange("nome", nomeDigitando(e.target.value))}
            />
          </div>
          <Campo
            {...campo("cpf")}
            label="CPF"
            inputMode="numeric"
            autoComplete="off"
            onChange={(e) => onChange("cpf", formatCPF(e.target.value))}
          />
          <Campo
            {...campo("nascimento")}
            label="Nascimento (dd/mm/aaaa)"
            inputMode="numeric"
            autoComplete="off"
            onChange={(e) => onChange("nascimento", formatBirthDate(e.target.value))}
          />
          <Campo
            {...campo("telefone")}
            label="Telefone / WhatsApp"
            inputMode="tel"
            autoComplete="off"
            onChange={(e) => onChange("telefone", maskPhone(e.target.value))}
          />
          <Campo
            {...campo("email")}
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="off"
            onChange={(e) => onChange("email", e.target.value)}
          />
          <Campo
            {...campo("instagram")}
            label="Instagram (opcional)"
            autoComplete="off"
            onChange={(e) => onChange("instagram", e.target.value)}
          />
          <Selecao
            {...campo("camiseta")}
            label="Camiseta"
            onChange={(e) => onChange("camiseta", e.target.value)}
          >
            <option value="">Selecione</option>
            {CAMISETAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Selecao>
          <Campo
            {...campo("emergencia_nome")}
            label="Contato de emergência (nome)"
            autoComplete="off"
            onChange={(e) => onChange("emergencia_nome", nomeDigitando(e.target.value))}
          />
          <Campo
            {...campo("emergencia_telefone")}
            label="Contato de emergência (telefone)"
            inputMode="tel"
            autoComplete="off"
            onChange={(e) => onChange("emergencia_telefone", maskPhone(e.target.value))}
          />

          {onRemover ? (
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={onRemover}
                className="lgo-label min-h-[44px] text-[color:var(--somma)] underline underline-offset-4"
              >
                Remover reserva
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
