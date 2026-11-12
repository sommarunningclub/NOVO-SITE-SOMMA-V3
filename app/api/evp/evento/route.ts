import { NextResponse } from "next/server";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import type { EventoPublico } from "@/lib/evp/tipos";

export const dynamic = "force-dynamic";

/** Situação das vagas, direto do banco. A página consulta para não mostrar número velho. */
export async function GET() {
  try {
    const ev = await rpc<EventoPublico | null>("evp_evento_publico", { p_slug: SLUG });
    if (!ev) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    return NextResponse.json({ vagas: ev.vagas }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Indisponível." }, { status: 503 });
  }
}
