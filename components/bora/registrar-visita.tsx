"use client";

import { useEffect, useRef } from "react";
import { registrarVisita } from "@/lib/nova-assessoria/rastreio-cliente";

/** Registra uma visita quando a página abre. Não desenha nada. */
export function RegistrarVisita({ pagina }: { pagina: string }) {
  // O StrictMode roda o efeito duas vezes em desenvolvimento.
  const feito = useRef(false);
  useEffect(() => {
    if (feito.current) return;
    feito.current = true;
    registrarVisita(pagina);
  }, [pagina]);
  return null;
}
