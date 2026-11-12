"use client";

import type { ReactNode } from "react";
import { entradasDaSecao, useEscopo } from "../_motion";

/**
 * Casca de seção: marcador numerado, âncora e as entradas padrão de scroll
 * (data-linha, data-sobe, data-parallax). Sem animação, o conteúdo já está
 * visível: o GSAP só acrescenta o movimento.
 */
export function Secao({
  id,
  marco,
  rotulo,
  children,
  className = "",
}: {
  id: string;
  marco: string;
  rotulo: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useEscopo<HTMLElement>(({ raiz, modesto }) => entradasDaSecao(raiz, modesto));
  return (
    <section ref={ref} id={id} aria-labelledby={`${id}-titulo`} className={`mt-secao scroll-mt-16 ${className}`}>
      <div className="mt-container">
        <p className="mt-marco mb-7" data-sobe>
          <b>{marco}</b> {rotulo}
        </p>
        {children}
      </div>
    </section>
  );
}

/** Título de seção em linhas mascaradas. Cada item do array é uma linha. */
export function Titulo({ id, linhas, className = "" }: { id: string; linhas: string[]; className?: string }) {
  return (
    <h2 id={`${id}-titulo`} className={`mt-titulo ${className}`}>
      {linhas.map((l) => (
        <span key={l} className="mt-mascara">
          <span data-linha>{l}</span>
        </span>
      ))}
    </h2>
  );
}
