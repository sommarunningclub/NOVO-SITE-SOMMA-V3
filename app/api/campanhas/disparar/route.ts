import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { dispararEtapa } from "@/lib/campanhas/regua";
import { ETAPAS, SEGMENTOS, type EtapaRegua, type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
/** Envio síncrono em lotes de 100 com espera entre eles; 5k contatos leva ~1 min. */
export const maxDuration = 300;

/**
 * Dispara uma etapa por e-mail transacional (`batch.send`), não broadcast.
 *
 * Envio transacional não agenda: `batch.send` da Resend não aceita `scheduledAt`
 * (só o `emails.send` individual aceita, e a 2 req/s enviar 6 mil pessoas uma a
 * uma levaria quase uma hora só para submeter). Por isso esta rota dispara na
 * hora em que é chamada — quem decide "quando" é o operador clicando o botão, não
 * um agendamento programado.
 *
 * `confirmar: true` explícito é a única trava contra POST acidental: a partir
 * daqui o e-mail já está saindo, e não tem como cancelar no meio.
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

  const etapa = Number(body.etapa) as EtapaRegua;
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
    return NextResponse.json(
      { error: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` },
      { status: 400 }
    );
  }

  try {
    const resultado = await dispararEtapa({ etapa, segmento });
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao disparar." },
      { status: 400 }
    );
  }
}
