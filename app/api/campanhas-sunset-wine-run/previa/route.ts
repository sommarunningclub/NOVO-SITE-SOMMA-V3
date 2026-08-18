import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { destinatarios, SEGMENTOS } from "@/lib/campanhas/regua-sunset-wine-run";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const segmento = new URL(request.url).searchParams.get("segmento") as SegmentoBase;
  if (!SEGMENTOS.includes(segmento)) {
    return NextResponse.json({ error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` }, { status: 400 });
  }

  try {
    const alvo = await destinatarios(segmento);
    return NextResponse.json({ segmento, total: alvo.length, amostra: alvo.slice(0, 5).map((d) => d.email) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao calcular a prévia." },
      { status: 400 }
    );
  }
}
