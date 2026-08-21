import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { destinatariosDaEtapa } from "@/lib/campanhas/regua";
import { SEGMENTOS, ETAPAS, type EtapaRegua, type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Quantos entrariam numa etapa se ela fosse montada agora, sem criar nada.
 *
 * É o passo que separa "achar" de "saber" antes de mandar e-mail para milhares
 * de pessoas: o painel mostra este número, e só depois libera o disparo.
 */
export async function GET(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const etapa = Number(searchParams.get("etapa")) as EtapaRegua;
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
      // Uma amostra pequena só para o operador reconhecer a base, não a lista toda.
      amostra: destinatarios.slice(0, 5).map((d) => d.email),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao calcular a prévia." },
      { status: 400 }
    );
  }
}
