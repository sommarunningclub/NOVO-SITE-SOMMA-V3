"use client";

import { alternar, useSom } from "@/lib/dexcomplica-love-run/som";

/**
 * O equalizador ao lado de RUN também liga e pausa o som. É um atalho de
 * toque: o controle acessível por teclado e leitor de tela é o player do
 * cabeçalho, por isso este fica fora da árvore de acessibilidade.
 */
export default function PlayerEqualizador() {
  const estado = useSom();
  return (
    <span className="lr-eq lr-capa__eq" data-som data-estado={estado} aria-hidden="true" onClick={() => alternar()}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${i * -0.17}s` }} />
      ))}
    </span>
  );
}
