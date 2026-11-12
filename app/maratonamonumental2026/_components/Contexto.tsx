"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { contarVisita, medir } from "@/lib/evp/analytics";
import { type DistanciaBase, type DistanciaInscricao, distanciaPrincipal } from "@/lib/evp/config";
import type { EventoPublico, Vagas } from "@/lib/evp/tipos";

/**
 * Estado compartilhado da página: a distância escolhida (o seletor, o mapa e o
 * formulário olham para o mesmo valor) e a situação real das vagas.
 */
type Valor = {
  evento: EventoPublico;
  vagas: Vagas;
  atualizarVagas: () => Promise<void>;
  definirVagas: (v: Vagas) => void;
  /** Distância em destaque no seletor e no mapa. */
  distancia: DistanciaBase;
  escolherDistancia: (d: DistanciaBase, local: string) => void;
  /** Opção marcada no formulário (pode ser um Desafio). */
  distanciaForm: DistanciaInscricao | null;
  escolherNoFormulario: (d: DistanciaInscricao) => void;
};

const Ctx = createContext<Valor | null>(null);

export function useEvento(): Valor {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEvento fora do EventoProvider");
  return v;
}

export function EventoProvider({ evento, children }: { evento: EventoPublico; children: ReactNode }) {
  const [vagas, setVagas] = useState<Vagas>(evento.vagas);
  const [distancia, setDistancia] = useState<DistanciaBase>("21k");
  const [distanciaForm, setDistanciaForm] = useState<DistanciaInscricao | null>(null);

  const atualizarVagas = useCallback(async () => {
    try {
      const r = await fetch("/api/evp/evento", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { vagas?: Vagas };
      if (j.vagas) setVagas(j.vagas);
    } catch {
      /* fica com o número que veio do servidor */
    }
  }, []);

  // A página é servida de cache por até um minuto: as vagas são conferidas ao abrir.
  useEffect(() => {
    void atualizarVagas();
    contarVisita();
    medir("evp_view_page", {}, "pagina");
  }, [atualizarVagas]);

  const escolherDistancia = useCallback((d: DistanciaBase, local: string) => {
    setDistancia((atual) => {
      if (atual !== d) medir("evp_select_distance", { distancia: d, local });
      return d;
    });
    // Quem ainda não marcou nada no formulário já chega lá com a distância escolhida.
    setDistanciaForm((atual) => (atual === null || !atual.includes("+") ? d : atual));
  }, []);

  const escolherNoFormulario = useCallback((d: DistanciaInscricao) => {
    setDistanciaForm(d);
    setDistancia(distanciaPrincipal(d));
  }, []);

  const valor = useMemo<Valor>(
    () => ({ evento, vagas, atualizarVagas, definirVagas: setVagas, distancia, escolherDistancia, distanciaForm, escolherNoFormulario }),
    [evento, vagas, atualizarVagas, distancia, escolherDistancia, distanciaForm, escolherNoFormulario]
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** Texto do botão principal conforme a situação das vagas. */
export function rotuloCta(modo: Vagas["modo"]): string {
  if (modo === "lista_espera") return "Entrar na lista de espera";
  if (modo === "esgotada") return "Vagas esgotadas";
  if (modo === "encerrada") return "Inscrições encerradas";
  return "Quero participar";
}
