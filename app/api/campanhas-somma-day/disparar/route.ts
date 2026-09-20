import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { dispararEtapa, ETAPAS, type EtapaSommaDay } from "@/lib/campanhas/regua-somma-day";
import { SEGMENTOS, type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Dispara uma etapa agora, por e-mail transacional em lote. `confirmar: true` é
 * a trava contra POST acidental: isto vai para a base e não tem volta.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let body: { etapa?: unknown; segmento?: unknown; confirmar?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const etapa = Number(body.etapa) as EtapaSommaDay;
  const segmento = body.segmento as SegmentoBase;

  if (body.confirmar !== true) {
    return NextResponse.json(
      { error: "Envie confirmar: true. Este disparo vai para a base agora e não tem volta." },
      { status: 400 }
    );
  }
  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(", ")}.` }, { status: 400 });
  }
  if (!SEGMENTOS.includes(segmento)) {
    return NextResponse.json({ error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` }, { status: 400 });
  }

  try {
    const resultado = await dispararEtapa(etapa, segmento);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao disparar." },
      { status: 400 }
    );
  }
}
