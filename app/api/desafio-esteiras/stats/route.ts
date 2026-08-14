import { NextResponse } from "next/server";
import { getEventStats } from "@/lib/desafio-esteiras/db";
import { COMPETICAO, UNITS, bateriasNecessarias, unitStatusFor } from "@/lib/desafio-esteiras/event.config";

export const dynamic = "force-dynamic";

/**
 * Números públicos do evento: inscritos por unidade + total.
 *
 * Alimenta o contador ao vivo da LP (polling leve). Não expõe nenhum dado
 * pessoal, só contagem agregada.
 *
 * Sem teto de inscrição, o que sai daqui é adesão: quantos entraram e quantas
 * baterias isso já forma. Não existe mais saldo de vaga nem estado de
 * esgotado — a unidade só fecha por decisão da organização.
 */
export async function GET() {
  const stats = await getEventStats();

  const unidades = UNITS.map((unit) => {
    const u = stats.porUnidade.find((x) => x.unitId === unit.id);
    const feminino = u?.feminino ?? 0;
    const masculino = u?.masculino ?? 0;

    return {
      id: unit.id,
      inscritos: u?.inscritos ?? 0,
      competidores: u?.competidores ?? 0,
      espectadores: u?.espectadores ?? 0,
      status: unitStatusFor(unit),
      capacidade: unit.capacidade,
      /** Quanta gente entrou em cada categoria e o tamanho da grade que isso pede. */
      categorias: {
        feminino: { inscritos: feminino, baterias: bateriasNecessarias(feminino) },
        masculino: { inscritos: masculino, baterias: bateriasNecessarias(masculino) },
      },
    };
  });

  return NextResponse.json(
    {
      total: stats.total,
      totalCompetidores: stats.totalCompetidores,
      esteirasPorBateria: COMPETICAO.esteirasPorBateria,
      unidades,
      disponivel: stats.disponivel,
    },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } }
  );
}
