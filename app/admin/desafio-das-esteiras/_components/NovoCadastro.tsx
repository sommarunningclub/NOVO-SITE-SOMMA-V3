"use client";

import { useState } from "react";
import {
  CATEGORIAS,
  PARTICIPACAO_LABELS,
  UNITS,
  type Participacao,
} from "@/lib/desafio-esteiras/event.config";
import { formatCPF } from "@/lib/cpf";
import { nomeDigitando } from "@/lib/desafio-esteiras/nome";
import { formatBirthDate, formatPhone } from "@/lib/desafio-esteiras/schema";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";

/** Cadastro manual pelo painel — mesmo contrato da LP, sem aceite de termos. */
export function NovoCadastro({
  session,
  onFechar,
  onCriado,
}: {
  session: OperatorSession;
  onFechar: () => void;
  onCriado: (aviso: string) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [cpf, setCpf] = useState("");
  const [nasc, setNasc] = useState("");
  const [tel, setTel] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(true);
  const unidadeTravada = session.role === "operador" ? session.unitId : null;

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    setErro(null);
    setSalvando(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: String(f.get("full_name") ?? ""),
          email: String(f.get("email") ?? ""),
          phone: tel,
          cpf,
          birth_date: nasc,
          unit_id: String(f.get("unit_id") ?? unidadeTravada ?? ""),
          sexo: String(f.get("sexo") ?? ""),
          participacao: String(f.get("participacao") ?? ""),
          enviar_email: enviarEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error ?? "Não foi possível cadastrar.");
      onCriado(
        `Cadastro criado · ${data.ticket_code}${enviarEmail ? " · e-mail enviado" : ""}.`,
      );
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(8,8,10,0.9)] p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novo-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="dst-panel w-full max-w-[520px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="dst-label text-[color:var(--somma)]">Painel</p>
            <h2 id="novo-titulo" className="dst-display mt-1 text-[1.5rem]">
              NOVO CADASTRO
            </h2>
          </div>
          <button type="button" onClick={onFechar} className="dst-label underline underline-offset-4">
            fechar
          </button>
        </div>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.6)]">
          Gera o ticket na hora. O evento é gratuito — a pessoa pode levar alguém, mas cada CPF é
          uma inscrição.
        </p>

        <form onSubmit={salvar} className="mt-6">
          <fieldset>
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Unidade</legend>
            <div className="grid grid-cols-2 gap-2">
              {UNITS.map((u) => (
                <label
                  key={u.id}
                  className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)] has-[:disabled]:opacity-40"
                >
                  <input
                    type="radio"
                    name="unit_id"
                    value={u.id}
                    defaultChecked={unidadeTravada ? u.id === unidadeTravada : u.id === UNITS[0].id}
                    disabled={Boolean(unidadeTravada) && u.id !== unidadeTravada}
                    className="sr-only"
                  />
                  <span className="dst-display text-[0.9rem]">{u.curto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Participação</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PARTICIPACAO_LABELS) as Participacao[]).map((p) => (
                <label
                  key={p}
                  className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                >
                  <input
                    type="radio"
                    name="participacao"
                    value={p}
                    defaultChecked={p === "competidor"}
                    className="sr-only"
                  />
                  <span className="dst-display text-[0.9rem]">{PARTICIPACAO_LABELS[p].titulo}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Categoria</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((c) => (
                <label
                  key={c.id}
                  className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                >
                  <input type="radio" name="sexo" value={c.id} required className="sr-only" />
                  <span className="dst-display text-[0.9rem]">{c.curto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="dst-field-wrap mt-6">
            <input
              id="nv-nome"
              name="full_name"
              required
              placeholder=" "
              className="dst-field"
              autoComplete="name"
              autoCapitalize="characters"
              spellCheck={false}
              onInput={(e) => {
                e.currentTarget.value = nomeDigitando(e.currentTarget.value);
              }}
            />
            <label htmlFor="nv-nome" className="dst-field-label">
              Nome e sobrenome
            </label>
          </div>
          <div className="dst-field-wrap mt-4">
            <input
              id="nv-cpf"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
              placeholder=" "
              className="dst-field"
              required
            />
            <label htmlFor="nv-cpf" className="dst-field-label">
              CPF
            </label>
          </div>
          <div className="dst-field-wrap mt-4">
            <input
              id="nv-nasc"
              value={nasc}
              onChange={(e) => setNasc(formatBirthDate(e.target.value))}
              inputMode="numeric"
              maxLength={10}
              placeholder=" "
              className="dst-field"
              required
            />
            <label htmlFor="nv-nasc" className="dst-field-label">
              Nascimento (dd/mm/aaaa)
            </label>
          </div>
          <div className="dst-field-wrap mt-4">
            <input id="nv-email" name="email" type="email" required placeholder=" " className="dst-field" autoComplete="email" />
            <label htmlFor="nv-email" className="dst-field-label">
              E-mail
            </label>
          </div>
          <div className="dst-field-wrap mt-4">
            <input
              id="nv-tel"
              value={tel}
              onChange={(e) => setTel(formatPhone(e.target.value))}
              inputMode="tel"
              placeholder=" "
              className="dst-field"
              required
            />
            <label htmlFor="nv-tel" className="dst-field-label">
              Telefone
            </label>
          </div>

          <label className="mt-6 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={enviarEmail}
              onChange={(e) => setEnviarEmail(e.target.checked)}
              className="h-5 w-5 accent-[color:var(--somma)]"
            />
            <span className="text-[0.9rem] text-[color:rgba(242,240,236,0.7)]">
              Enviar o e-mail do ticket agora
            </span>
          </label>

          {erro && (
            <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">
              {erro}
            </p>
          )}

          <div className="mt-7 flex gap-3">
            <button type="submit" disabled={salvando} className="dst-btn flex-1 disabled:opacity-60">
              {salvando ? "Cadastrando…" : "Cadastrar"}
            </button>
            <button type="button" onClick={onFechar} className="dst-btn dst-btn--ghost">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
