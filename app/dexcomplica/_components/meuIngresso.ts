"use client";

import { useEffect, useState } from "react";
import type { ReciboTransferencia } from "@/lib/dexcomplica-love-run/transferencia";
import { EVENTO_REALIZADO } from "@/lib/dexcomplica-love-run/event.config";

/**
 * Atalho "Meu ingresso" neste aparelho. Guarda só o caminho do ingresso (que
 * já é o segredo, do mesmo jeito que o link do e-mail); nada de nome ou CPF.
 */
const CHAVE = "love-run:ingresso";
const CHAVE_TRANSFERENCIA = "love-run:transferencia";

export function lembrarIngresso(caminho: string) {
  try {
    localStorage.setItem(CHAVE, caminho.split("?")[0]);
  } catch {
    /* modo privado: o e-mail continua sendo o caminho de volta */
  }
}

/** Depois da transferência este aparelho não pode continuar abrindo o QR antigo. */
export function esquecerIngresso() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* ignore */
  }
}

export function useMeuIngresso(): string | null {
  const [caminho, setCaminho] = useState<string | null>(null);
  useEffect(() => {
    if (EVENTO_REALIZADO) return;
    try {
      const v = localStorage.getItem(CHAVE);
      if (v && /^\/dexcomplica\/ingresso\/[A-Za-z0-9_-]{40,60}$/.test(v)) setCaminho(v);
    } catch {
      setCaminho(null);
    }
  }, []);
  return caminho;
}

/** Recibo da transferência nesta sessão (não vai para a URL: tem e-mail). */
export function lembrarTransferencia(d: ReciboTransferencia) {
  try {
    sessionStorage.setItem(CHAVE_TRANSFERENCIA, JSON.stringify(d));
  } catch {
    /* modo privado: a página ainda abre, só sem o nome do destinatário */
  }
}

export function lerTransferencia(): ReciboTransferencia | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_TRANSFERENCIA);
    if (!bruto) return null;
    const d = JSON.parse(bruto) as Partial<ReciboTransferencia>;
    if (typeof d.agora !== "boolean") return null;
    return {
      nome: typeof d.nome === "string" ? d.nome : "",
      email: typeof d.email === "string" && d.email ? d.email : null,
      agora: d.agora,
    };
  } catch {
    return null;
  }
}
