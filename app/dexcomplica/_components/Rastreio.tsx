"use client";

import { useEffect } from "react";
import { rastrear, type EventoLoveRun } from "@/lib/dexcomplica-love-run/analytics";

/**
 * Visualização da página + cliques marcados com `data-rastrear="evento:origem"`.
 * Delegado no documento para os links do servidor não precisarem virar client.
 */
export default function Rastreio() {
  useEffect(() => {
    rastrear("lp_visualizada");
    const onClick = (e: MouseEvent) => {
      const alvo = (e.target as Element | null)?.closest<HTMLElement>("[data-rastrear]");
      if (!alvo) return;
      const [nome, origem] = (alvo.dataset.rastrear ?? "").split(":");
      if (nome === "cta") rastrear("cta_clicado", { origem: origem ?? null });
      else rastrear(nome as EventoLoveRun, origem ? { origem } : {});
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
