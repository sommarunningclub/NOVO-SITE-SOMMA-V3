import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { destinatarios, ETAPAS, SEGMENTOS, type EtapaTalkRun } from "@/lib/campanhas/regua-talk-run";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const segmento = params.get("segmento") as SegmentoBase;
  const etapa = (params.get("etapa") === null ? 1 : Number(params.get("etapa"))) as EtapaTalkRun;
  if (!SEGMENTOS.includes(segmento)) {
    return NextResponse.json({ error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` }, { status: 400 });
  }
  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` }, { status: 400 });
  }

  try {
    const alvo = await destinatarios(segmento, etapa);
    return NextResponse.json({ segmento, etapa, total: alvo.length, amostra: alvo.slice(0, 5).map((d) => d.email) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao calcular a prévia." },
      { status: 400 }
    );
  }
}
