import { NextResponse } from "next/server";
import { getCompetidores } from "@/lib/desafio-esteiras/db";

export const dynamic = "force-dynamic";

/**
 * Grade pública de competidores.
 *
 * Alimenta a seção da home. Devolve só o que é para ser visto: primeiro nome,
 * unidade, categoria e foto — a consulta em `getCompetidores` nunca seleciona
 * CPF, e-mail, telefone ou nome completo, então não há como vazar por engano.
 */
export async function GET() {
  const { lista, disponivel } = await getCompetidores();

  return NextResponse.json(
    { competidores: lista, total: lista.length, disponivel },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
  );
}
