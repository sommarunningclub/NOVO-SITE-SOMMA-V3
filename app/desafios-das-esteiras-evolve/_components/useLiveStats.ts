"use client";

import { useEffect, useState } from "react";
import { UNITS, type UnitId, type UnitStatus } from "@/lib/desafio-esteiras/event.config";

export interface UnidadeStat {
  id: UnitId;
  inscritos: number;
  competidores: number;
  espectadores: number;
  status: UnitStatus;
  capacidade: number | null;
}

export interface LiveStats {
  total: number;
  totalCompetidores: number;
  unidades: UnidadeStat[];
  disponivel: boolean;
  carregando: boolean;
}

export type StatsIniciais = Pick<
  LiveStats,
  "total" | "totalCompetidores" | "unidades" | "disponivel"
>;

/**
 * Contadores de inscritos.
 *
 * O primeiro valor vem renderizado do servidor (sem flash de zero) e é
 * atualizado por polling enquanto a aba está visível. Não usamos Supabase
 * Realtime de propósito: a tabela está com RLS sem policy, então a anon key
 * não pode assinar — abrir esse acesso só para o contador seria pagar
 * segurança por conveniência.
 */
export function useLiveStats(iniciais: StatsIniciais, intervaloMs = 30_000): LiveStats {
  const [stats, setStats] = useState<StatsIniciais>(iniciais);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;

    async function buscar() {
      if (document.visibilityState === "hidden") return agendar();
      setCarregando(true);
      try {
        const res = await fetch("/api/desafio-esteiras/stats", { cache: "no-store" });
        if (res.ok && vivo) {
          const data = (await res.json()) as StatsIniciais;
          setStats(data);
        }
      } catch {
        // rede instável: mantém o último valor conhecido
      } finally {
        if (vivo) setCarregando(false);
        agendar();
      }
    }

    function agendar() {
      if (!vivo) return;
      timer = setTimeout(buscar, intervaloMs);
    }

    agendar();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [intervaloMs]);

  return { ...stats, carregando };
}

/** Sempre devolve as 4 unidades na ordem do config, mesmo se a API falhar. */
export function statsPorUnidade(stats: StatsIniciais): UnidadeStat[] {
  return UNITS.map((u) => {
    const achado = stats.unidades.find((s) => s.id === u.id);
    return (
      achado ?? {
        id: u.id as UnitId,
        inscritos: 0,
        competidores: 0,
        espectadores: 0,
        status: u.status,
        capacidade: u.capacidade,
      }
    );
  });
}
