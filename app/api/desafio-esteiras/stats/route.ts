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
    const inscritos = stats.porUnidade.find((u) => u.unitId === unit.id)?.inscritos ?? 0;
    return {
      id: unit.id,
      inscritos,
      status: unitStatusFor(unit, inscritos),
      capacidade: unit.capacidade,
    };
  });

  return NextResponse.json(
    { total: stats.total, unidades, disponivel: stats.disponivel },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } }
  );
}
