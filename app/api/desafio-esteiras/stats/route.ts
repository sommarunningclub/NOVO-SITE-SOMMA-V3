import { NextResponse } from "next/server";
import { getEventStats } from "@/lib/desafio-esteiras/db";
import {
  UNITS,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  VAGAS_TOTAIS,
  unitStatusFor,
  vagasRestantes,
  vagasStatus,
} from "@/lib/desafio-esteiras/event.config";

export const dynamic = "force-dynamic";

/**
 * Números públicos do evento: inscritos por unidade + total.
 * Alimenta o contador ao vivo da LP (polling leve). Não expõe nenhum dado
 * pessoal — só contagem agregada.
 */
export async function GET() {
  const stats = await getEventStats();

  const unidades = UNITS.map((unit) => {
    const u = stats.porUnidade.find((x) => x.unitId === unit.id);
    const inscritos = u?.inscritos ?? 0;
    const feminino = u?.feminino ?? 0;
    const masculino = u?.masculino ?? 0;
    // A unidade só está esgotada quando as DUAS categorias lotam: com uma
    // cheia, quem é da outra ainda tem vaga.
    const esgotada =
      vagasStatus(feminino) === "esgotada" && vagasStatus(masculino) === "esgotada";

    return {
      id: unit.id,
      inscritos,
      competidores: u?.competidores ?? 0,
      espectadores: u?.espectadores ?? 0,
      status: esgotada ? ("esgotada" as const) : unitStatusFor(unit, inscritos),
      capacidade: unit.capacidade,
      /** Ocupação das 12 vagas de cada categoria — a regra da competição. */
      categorias: {
        feminino: {
          ocupadas: feminino,
          total: VAGAS_POR_CATEGORIA,
          restantes: vagasRestantes(feminino),
          status: vagasStatus(feminino),
        },
        masculino: {
          ocupadas: masculino,
          total: VAGAS_POR_CATEGORIA,
          restantes: vagasRestantes(masculino),
          status: vagasStatus(masculino),
        },
      },
      vagasCompetidores: VAGAS_POR_UNIDADE,
      competidoresRestantes: Math.max(0, VAGAS_POR_UNIDADE - feminino - masculino),
    };
  });

  return NextResponse.json(
    {
      total: stats.total,
      totalCompetidores: stats.totalCompetidores,
      vagasTotais: VAGAS_TOTAIS,
      vagasPorUnidade: VAGAS_POR_UNIDADE,
      vagasPorCategoria: VAGAS_POR_CATEGORIA,
      unidades,
      disponivel: stats.disponivel,
    },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } }
  );
}
