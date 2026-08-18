import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { dispararCampanha, SEGMENTOS } from "@/lib/campanhas/regua-sunset-wine-run";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Dispara para um segmento. Sem agendamento nativo (batch.send da Resend não
 * aceita scheduledAt): quando isto precisa sair numa hora específica, quem
 * agenda é um cron externo chamando esta rota, não a Resend.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let body: { segmento?: unknown; confirmar?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const segmento = body.segmento as SegmentoBase;

  if (body.confirmar !== true) {
    return NextResponse.json(
      { error: "Envie confirmar: true. Este disparo vai para a base agora e não tem volta." },
      { status: 400 }
    );
  }
  if (!SEGMENTOS.includes(segmento)) {
    return NextResponse.json({ error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` }, { status: 400 });
  }

  try {
    const resultado = await dispararCampanha(segmento);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao disparar." },
      { status: 400 }
    );
  }
}
