"use client";

import { useEffect, useState } from "react";

/**
 * Atalho "Meu ingresso" neste aparelho. Guarda só o caminho do ingresso (que
 * já é o segredo, do mesmo jeito que o link do e-mail); nada de nome ou CPF.
 */
const CHAVE = "love-run:ingresso";

export function lembrarIngresso(caminho: string) {
  try {
    localStorage.setItem(CHAVE, caminho.split("?")[0]);
  } catch {
    /* modo privado: o e-mail continua sendo o caminho de volta */
  }
}

export function useMeuIngresso(): string | null {
  const [caminho, setCaminho] = useState<string | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(CHAVE);
      if (v && /^\/dexcomplica\/ingresso\/[A-Za-z0-9_-]{40,60}$/.test(v)) setCaminho(v);
    } catch {
      setCaminho(null);
    }
  }, []);
  return caminho;
}
