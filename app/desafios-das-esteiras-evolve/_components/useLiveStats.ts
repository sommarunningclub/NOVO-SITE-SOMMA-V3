"use client";

import { useEffect, useState } from "react";
import {
  UNITS,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  type UnitId,
  type UnitStatus,
} from "@/lib/desafio-esteiras/event.config";

/** Ocupação de uma categoria: a regra é 12 vagas em cada. */
export interface VagasCategoria {
  ocupadas: number;
  total: number;
  restantes: number;
  status: "aberta" | "ultimas" | "esgotada";
}

export interface UnidadeStat {
  id: UnitId;
  inscritos: number;
  competidores: number;
  espectadores: number;
  status: UnitStatus;
  capacidade: number | null;
  categorias: { feminino: VagasCategoria; masculino: VagasCategoria };
  vagasCompetidores: number;
  competidoresRestantes: number;
}

export interface LiveStats {
  total: number;
  totalCompetidores: number;
  vagasTotais: number;
  vagasPorUnidade: number;
  vagasPorCategoria: number;
  unidades: UnidadeStat[];
  disponivel: boolean;
  carregando: boolean;
}

export type StatsIniciais = Pick<
  LiveStats,
  | "total"
  | "totalCompetidores"
  | "vagasTotais"
  | "vagasPorUnidade"
  | "vagasPorCategoria"
  | "unidades"
  | "disponivel"
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
        categorias: {
          feminino: { ocupadas: 0, total: VAGAS_POR_CATEGORIA, restantes: VAGAS_POR_CATEGORIA, status: "aberta" },
          masculino: { ocupadas: 0, total: VAGAS_POR_CATEGORIA, restantes: VAGAS_POR_CATEGORIA, status: "aberta" },
        },
        vagasCompetidores: VAGAS_POR_UNIDADE,
        competidoresRestantes: VAGAS_POR_UNIDADE,
      }
    );
  });
}
