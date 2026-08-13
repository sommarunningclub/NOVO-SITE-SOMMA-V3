import { NextResponse } from "next/server";
import { getEventStats } from "@/lib/desafio-esteiras/db";
import { UNITS, unitStatusFor } from "@/lib/desafio-esteiras/event.config";

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
    return {
      id: unit.id,
      inscritos,
      competidores: u?.competidores ?? 0,
      espectadores: u?.espectadores ?? 0,
      status: unitStatusFor(unit, inscritos),
      capacidade: unit.capacidade,
    };
  });

  return NextResponse.json(
    {
      total: stats.total,
      totalCompetidores: stats.totalCompetidores,
      unidades,
      disponivel: stats.disponivel,
    },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } }
  );
}
