"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { FORM_OBJETIVOS, FORM_FAIXAS } from "../_data/presentationSections";
import { OPPORTUNITY_FILTERS } from "../_types/commercial";

interface FormState {
  nome: string;
  empresa: string;
  cargo: string;
  email: string;
  telefone: string;
  segmento: string;
  objetivo: string;
  faixa: string;
  interesses: string[];
  mensagem: string;
}

const EMPTY: FormState = {
  nome: "",
  empresa: "",
  cargo: "",
  email: "",
  telefone: "",
  segmento: "",
  objetivo: "",
  faixa: "",
  interesses: [],
  mensagem: "",
};

const inputCls =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-[var(--somma-surface-2)] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--somma-primary)]";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-white/45";

export default function ProposalForm() {
  const [data, setData] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const toggleInteresse = (cat: string) =>
    setData((d) => ({
      ...d,
      interesses: d.interesses.includes(cat)
        ? d.interesses.filter((x) => x !== cat)
        : [...d.interesses, cat],
    }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!data.nome.trim()) e.nome = "Informe seu nome.";
    if (!data.empresa.trim()) e.empresa = "Informe a empresa.";
    if (!data.email.trim()) e.email = "Informe um e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "E-mail inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    // Primeira versão: apenas valida e prepara o objeto (sem envio/integração).
    // O objeto abaixo fica pronto para integração futura (CRM, e-mail, etc.).
    const _proposta = { ...data };
    void _proposta;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[var(--somma-primary)]/40 bg-[var(--somma-highlight)] p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--somma-primary)]" />
        <h3 className="mt-4 text-2xl font-black text-white">Recebemos suas informações</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Obrigado, {data.nome.split(" ")[0] || "tudo certo"}! Suas informações foram registradas. Nosso time comercial
          usará esses dados para preparar uma proposta personalizada e entrar em contato.
        </p>
        <button
          onClick={() => {
            setData(EMPTY);
            setSent(false);
          }}
          className="mt-6 text-sm font-semibold text-[var(--somma-primary)] hover:underline"
        >
          Enviar outra solicitação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
      <Field label="Nome" error={errors.nome} className="sm:col-span-1">
        <input className={inputCls} value={data.nome} onChange={(e) => set("nome", e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Empresa" error={errors.empresa}>
        <input className={inputCls} value={data.empresa} onChange={(e) => set("empresa", e.target.value)} autoComplete="organization" />
      </Field>
      <Field label="Cargo">
        <input className={inputCls} value={data.cargo} onChange={(e) => set("cargo", e.target.value)} autoComplete="organization-title" />
      </Field>
      <Field label="E-mail" error={errors.email}>
        <input type="email" className={inputCls} value={data.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" inputMode="email" />
      </Field>
      <Field label="Telefone">
        <input type="tel" className={inputCls} value={data.telefone} onChange={(e) => set("telefone", e.target.value)} autoComplete="tel" inputMode="tel" />
      </Field>
      <Field label="Segmento da empresa">
        <input className={inputCls} value={data.segmento} onChange={(e) => set("segmento", e.target.value)} />
      </Field>

      <Field label="Objetivo principal">
        <select className={inputCls} value={data.objetivo} onChange={(e) => set("objetivo", e.target.value)}>
          <option value="">Selecione…</option>
          {FORM_OBJETIVOS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Faixa de investimento">
        <select className={inputCls} value={data.faixa} onChange={(e) => set("faixa", e.target.value)}>
          <option value="">Selecione…</option>
          {FORM_FAIXAS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <span className={labelCls}>Oportunidades de interesse</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {OPPORTUNITY_FILTERS.map((cat) => {
            const on = data.interesses.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleInteresse(cat)}
                aria-pressed={on}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  on
                    ? "border-[var(--somma-primary)] bg-[var(--somma-primary)] text-white"
                    : "border-white/20 text-white/60 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Mensagem" className="sm:col-span-2">
        <textarea rows={4} className={inputCls} value={data.mensagem} onChange={(e) => set("mensagem", e.target.value)} placeholder="Conte um pouco sobre a sua marca e o que você busca." />
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--somma-primary)] px-6 py-4 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 sm:w-auto"
        >
          Solicitar proposta personalizada
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-xs text-white/40">
          Seus dados são usados apenas para o contato comercial. Sem garantia de vendas ou conversão.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-[var(--somma-primary)]">{error}</span>}
    </label>
  );
}
