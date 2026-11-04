"use client";

import { Painel } from "./Painel";

/** Painel em página própria (/institucional/painel), com volta para o slide 14. */
export function PainelPagina() {
  return (
    <Painel
      rotuloVoltar="Ver a apresentação"
      aoVoltar={() => {
        window.location.href = "/institucional#14";
      }}
    />
  );
}
