import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { agendarEtapa, cancelarAgendamento, isoDeBrasilia } from "@/lib/campanhas/agendamento";
import {
  CAMPANHA,
  ETAPAS,
  montarPainel,
  varianteDaEtapa,
  type EtapaSommaDay,
} from "@/lib/campanhas/regua-somma-day";
import { sommaDayRotulo, sommaDaySubject } from "@/lib/emails/somma-day-campanha";
import { SEGMENTOS, type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";

/** Valida etapa e segmento de uma vez, para as rotas abaixo. */
function validar(segmento: unknown, etapa: unknown) {
  const seg = segmento as SegmentoBase;
  const et = Number(etapa) as EtapaSommaDay;
  if (!SEGMENTOS.includes(seg)) {
    return { erro: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` } as const;
  }
  if (!ETAPAS.includes(et)) {
    return { erro: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` } as const;
  }
  return { segmento: seg, etapa: et } as const;
}

function campos(etapa: EtapaSommaDay) {
  const variante = varianteDaEtapa(etapa);
  return { variante: sommaDayRotulo(variante), assunto: sommaDaySubject(variante) };
}

/**
 * Marca UMA etapa para sair sozinha na hora escolhida.
 *
 * `quando` vem no formato do input datetime-local ("2026-09-22T19:00") e o fuso
 * é resolvido no servidor, em Brasília. Ver lib/campanhas/agendamento.ts.
 *
 * Não pede `confirmar: true` como o disparo: agendar não manda e-mail nenhum
 * agora e pode ser desfeito pelo DELETE enquanto a hora não chegou. Quem manda
 * de verdade é o cron, e lá a confirmação é o CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let body: { segmento?: unknown; etapa?: unknown; quando?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const alvo = validar(body.segmento, body.etapa);
  if ("erro" in alvo) return NextResponse.json({ error: alvo.erro }, { status: 400 });

  const quandoIso = typeof body.quando === "string" ? isoDeBrasilia(body.quando) : null;
  if (!quandoIso) {
    return NextResponse.json(
      { error: "Horário inválido. Esperado AAAA-MM-DDTHH:MM, hora de Brasília." },
      { status: 400 }
    );
  }

  const resultado = await agendarEtapa(CAMPANHA, alvo, quandoIso, campos(alvo.etapa));
  if (!resultado.ok) return NextResponse.json({ error: resultado.motivo }, { status: 409 });

  return NextResponse.json({ ok: true, etapa: alvo.etapa, segmento: alvo.segmento, agendadoPara: quandoIso });
}

/**
 * Agenda a régua inteira de uma vez, cada linha na hora sugerida
 * (AGENDAMENTO_SUGERIDO em lib/campanhas/regua-somma-day.ts).
 *
 * Só toca linha que ainda está livre (`pendente`, `rascunho`, `cancelado`).
 * Linha já `agendada` fica como está de propósito: se o operador trocou a hora
 * de uma etapa na mão, apertar "agendar tudo" depois não pode desfazer isso.
 * Linha cuja sugestão já passou também fica de fora, e volta no relatório para
 * o painel dizer qual precisa de hora nova ou de disparo manual.
 */
export async function PUT() {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let painel;
  try {
    painel = await montarPainel();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao ler a régua." },
      { status: 500 }
    );
  }

  const agora = Date.now();
  const agendadas: Array<{ etapa: number; segmento: string; agendadoPara: string }> = [];
  const puladas: Array<{ etapa: number; segmento: string; motivo: string }> = [];

  for (const l of painel.linhas) {
    const livre = l.status === "pendente" || l.status === "rascunho" || l.status === "cancelado";
    if (!livre) {
      puladas.push({ etapa: l.etapa, segmento: l.segmento, motivo: `já está ${l.status}` });
      continue;
    }
    if (!l.sugeridoPara) {
      puladas.push({ etapa: l.etapa, segmento: l.segmento, motivo: "sem horário sugerido" });
      continue;
    }
    if (new Date(l.sugeridoPara).getTime() <= agora) {
      puladas.push({ etapa: l.etapa, segmento: l.segmento, motivo: "o horário sugerido já passou" });
      continue;
    }

    const r = await agendarEtapa(CAMPANHA, { etapa: l.etapa, segmento: l.segmento }, l.sugeridoPara, campos(l.etapa));
    if (r.ok) agendadas.push({ etapa: l.etapa, segmento: l.segmento, agendadoPara: l.sugeridoPara });
    else puladas.push({ etapa: l.etapa, segmento: l.segmento, motivo: r.motivo });
  }

  return NextResponse.json({ ok: true, agendadas, puladas });
}

/** Desmarca. A etapa volta a poder ser disparada na mão ou reagendada. */
export async function DELETE(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const alvo = validar(params.get("segmento"), params.get("etapa"));
  if ("erro" in alvo) return NextResponse.json({ error: alvo.erro }, { status: 400 });

  const resultado = await cancelarAgendamento(CAMPANHA, alvo);
  if (!resultado.ok) return NextResponse.json({ error: resultado.motivo }, { status: 409 });

  return NextResponse.json({ ok: true, etapa: alvo.etapa, segmento: alvo.segmento });
}
