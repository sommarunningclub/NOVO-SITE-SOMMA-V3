"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/**
 * Primitivas de campo do formulário.
 *
 * Todas usam o par `.lgo-field` + `.lgo-field-label` do evento.css: o rótulo
 * flutua quando o campo tem conteúdo ou foco. O `placeholder=" "` não é
 * enfeite, é o que faz `:not(:placeholder-shown)` funcionar como detector de
 * "campo preenchido" sem uma linha de JS.
 */

export function Campo({
  label,
  erro,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; erro?: string }) {
  return (
    <div>
      <div className="lgo-field-wrap">
        <input
          id={id}
          className="lgo-field"
          placeholder=" "
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          {...props}
        />
        <label htmlFor={id} className="lgo-field-label">
          {label}
        </label>
      </div>
      {erro ? (
        <p id={`${id}-erro`} className="lgo-mono mt-1.5 text-xs text-[color:var(--somma)]">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export function Selecao({
  label,
  erro,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; erro?: string; children: ReactNode }) {
  return (
    <div>
      <div className="lgo-field-wrap">
        <select
          id={id}
          className="lgo-field"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          {...props}
        >
          {children}
        </select>
        <label htmlFor={id} className="lgo-field-label">
          {label}
        </label>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:rgba(242,240,236,0.45)]"
        >
          ▾
        </span>
      </div>
      {erro ? (
        <p id={`${id}-erro`} className="lgo-mono mt-1.5 text-xs text-[color:var(--somma)]">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/** Checkbox dos aceites: alvo grande, texto clicável, erro logo abaixo. */
export function Aceite({
  id,
  checked,
  onChange,
  erro,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-2">
        <input
          id={id}
          type="checkbox"
          className="lgo-check"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={erro ? true : undefined}
        />
        <span className="text-sm leading-relaxed text-[color:rgba(242,240,236,0.8)]">{children}</span>
      </label>
      {erro ? <p className="lgo-mono ml-[34px] text-xs text-[color:var(--somma)]">{erro}</p> : null}
    </div>
  );
}

/** Cabeçalho de bloco dentro de uma etapa. */
export function BlocoTitulo({ kicker, titulo }: { kicker: string; titulo: string }) {
  return (
    <div className="mb-6">
      <p className="lgo-label text-[color:var(--sinal)]">{kicker}</p>
      <h2 className="lgo-display lgo-display-condensed mt-2 text-[clamp(1.6rem,6vw,2.6rem)]">
        {titulo}
      </h2>
    </div>
  );
}
