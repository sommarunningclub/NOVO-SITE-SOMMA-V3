import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { ETAPAS, dispararCampanha, type EtapaEncontro } from "@/lib/campanhas/regua-encontro-eixao";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Disparo manual de uma etapa, para quando o cron falhar ou for preciso
 *  antecipar. Mesma régua e mesma trava de idempotência do gatilho agendado. */
export async function POST(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let body: { etapa?: unknown; confirmar?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (body.confirmar !== true) {
    return NextResponse.json(
      { error: "Envie confirmar: true. Este disparo vai para a base agora e não tem volta." },
      { status: 400 }
    );
  }
  const etapa = Number(body.etapa) as EtapaEncontro;
  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` }, { status: 400 });
  }

  try {
    return NextResponse.json({ ok: true, ...(await dispararCampanha(etapa)) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao disparar." },
      { status: 400 }
    );
  }
}
