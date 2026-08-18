import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { destinatariosDaEtapa, ETAPAS, type EtapaDesafioEsteiras } from "@/lib/campanhas/regua-desafio-esteiras";
import { SEGMENTOS, type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const etapa = Number(searchParams.get("etapa")) as EtapaDesafioEsteiras;
  const segmento = searchParams.get("segmento") as SegmentoBase;

  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(", ")}.` }, { status: 400 });
  }
  if (!SEGMENTOS.includes(segmento)) {
    return NextResponse.json(
      { error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` },
      { status: 400 }
    );
  }

  try {
    const destinatarios = await destinatariosDaEtapa(etapa, segmento);
    return NextResponse.json({
      etapa,
      segmento,
      total: destinatarios.length,
      amostra: destinatarios.slice(0, 5).map((d) => d.email),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao calcular a prévia." },
      { status: 400 }
    );
  }
}
