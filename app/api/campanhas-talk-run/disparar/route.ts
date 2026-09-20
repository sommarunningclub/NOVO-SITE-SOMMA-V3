import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { dispararCampanha, ETAPAS, SEGMENTOS, type EtapaTalkRun } from "@/lib/campanhas/regua-talk-run";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Dispara uma etapa AGORA, na mão.
 *
 * O caminho normal desta campanha é o agendamento (ver ../agendar): sete
 * disparos em sete dias não se fazem no botão. Isto aqui é para o primeiro
 * e-mail, que sai no mesmo dia em que a régua é montada, e para retomar uma
 * etapa que o cron recolheu e deixou em rascunho depois de falhar.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let body: { segmento?: unknown; etapa?: unknown; confirmar?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const segmento = body.segmento as SegmentoBase;
  const etapa = Number(body.etapa) as EtapaTalkRun;

  if (body.confirmar !== true) {
    return NextResponse.json(
      { error: "Envie confirmar: true. Este disparo vai para a base agora e não tem volta." },
      { status: 400 }
    );
  }
  if (!SEGMENTOS.includes(segmento)) {
    return NextResponse.json({ error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` }, { status: 400 });
  }
  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` }, { status: 400 });
  }

  try {
    const resultado = await dispararCampanha(segmento, etapa);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao disparar." },
      { status: 400 }
    );
  }
}
