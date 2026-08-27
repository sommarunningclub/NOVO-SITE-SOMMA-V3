import { NextResponse } from "next/server";
import { getCrewsPublicas } from "@/lib/o-longao/db";

/**
 * Vitrine pública das crews aprovadas. Só dado de vitrine, nunca pessoal.
 * Cacheado na borda por 30s: a lista muda devagar e a landing é a página mais
 * acessada do evento.
 */
export async function GET() {
  try {
    const crews = await getCrewsPublicas();
    return NextResponse.json(
      { crews },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (err) {
    console.error(
      "[o-longao] crews públicas:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ crews: [] });
  }
}
