import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { paginaValida } from "@/lib/nova-assessoria/professores";
import { dadosDeRastreio } from "@/lib/nova-assessoria/rastreio-servidor";

/**
 * Uma visita a /assessoria ou ao link de um professor. Chega por sendBeacon,
 * ninguém espera a resposta: falha vira log e 204, nunca erro na tela.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !paginaValida(body.pagina)) return new NextResponse(null, { status: 400 });

    const supabase = getServiceSupabase();
    if (!supabase) return new NextResponse(null, { status: 204 });

    const { error } = await supabase.from("nova_assessoria_eventos").insert({
      tipo: "visita",
      pagina: body.pagina,
      ...dadosDeRastreio(req, body.rastreio),
    });
    if (error) console.error("[nova-assessoria] Falha ao registrar visita:", error.message);
  } catch (err) {
    console.error("[nova-assessoria] Falha ao registrar visita:", err);
  }
  return new NextResponse(null, { status: 204 });
}
