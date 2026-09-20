import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { agendarEtapa, cancelarAgendamento, isoDeBrasilia } from "@/lib/campanhas/agendamento";
import {
  CALENDARIO,
  CAMPANHA,
  ETAPAS,
  SEGMENTOS,
  destinatarios,
  problemasDoCalendario,
  varianteDaEtapa,
  type EtapaTalkRun,
} from "@/lib/campanhas/regua-talk-run";
import { talkRunSubject } from "@/lib/emails/talk-run";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Valida etapa e segmento de uma vez, para as rotas abaixo. */
function validar(segmento: unknown, etapa: unknown) {
  const seg = segmento as SegmentoBase;
  const et = Number(etapa) as EtapaTalkRun;
  if (!SEGMENTOS.includes(seg)) {
    return { erro: `Segmento inválido. Use ${SEGMENTOS.join(" | ")}.` } as const;
  }
  if (!ETAPAS.includes(et)) {
    return { erro: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` } as const;
  }
  return { segmento: seg, etapa: et } as const;
}

/**
 * Marca UMA etapa de UM segmento para sair sozinha na hora escolhida.
 *
 * `quando` chega no formato do input datetime-local ("2026-09-21T09:30") e o
 * fuso é resolvido no servidor, em Brasília. Ver lib/campanhas/agendamento.ts.
 *
 * Não pede `confirmar: true` como a rota de disparo: agendar não manda e-mail
 * agora e pode ser desfeito com o DELETE enquanto a hora não chegou. Quem manda
 * de verdade é o cron, e lá a confirmação é o `CRON_SECRET`.
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

  /* O assunto é gravado como ele vai LER no dia agendado, não hoje: a véspera
     tem contagem regressiva ("É amanhã"), e calcular com a data de hoje
     mostraria no painel um assunto diferente do que a pessoa vai receber. O
     disparo recalcula na hora de verdade, de todo jeito. */
  const variante = varianteDaEtapa(alvo.etapa);
  const assunto = talkRunSubject(variante, new Date(quandoIso));

  const resultado = await agendarEtapa(CAMPANHA, alvo, quandoIso, { variante, assunto });
  if (!resultado.ok) return NextResponse.json({ error: resultado.motivo }, { status: 409 });

  return NextResponse.json({ ok: true, etapa: alvo.etapa, segmento: alvo.segmento, agendadoPara: quandoIso, assunto });
}

interface ResultadoLinha {
  etapa: EtapaTalkRun;
  segmento: SegmentoBase;
  quando: string;
  resultado: "agendado" | "pulado";
  motivo?: string;
}

/**
 * Aplica o CALENDARIO inteiro de uma vez: todas as etapas, em todos os
 * segmentos que têm gente.
 *
 * É o botão "Agendar a régua inteira" do painel, e existe porque são 7 etapas
 * x 3 segmentos: 21 agendamentos na mão são 21 chances de digitar um horário
 * errado numa data que não se desfaz depois que o e-mail sai.
 *
 * O que ele pula, e por quê, vai de volta linha a linha para o painel mostrar:
 *
 *   - segmento vazio: agendar uma etapa sem ninguém para receber só gera um
 *     erro "sem público" no cron cinco minutos depois da hora;
 *   - horário que já passou: `agendarEtapa` recusaria de todo jeito, e é o
 *     caso normal para a etapa 1 quando o operador disparou ela na mão;
 *   - etapa já enviada ou saindo: `agendarEtapa` recusa, e a recusa é o
 *     comportamento certo, não um erro a esconder.
 *
 * Reaplicar é seguro: uma etapa já `agendado` é reagendada para o horário do
 * calendário, e uma `enviado` nunca é tocada.
 *
 * Aceita `horarios` opcional, { "1": "2026-09-20T21:00", ... }, para o painel
 * mandar os horários que o operador ajustou em vez dos do calendário.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const problemas = problemasDoCalendario();
  if (problemas.length > 0) {
    return NextResponse.json(
      { error: `O calendário tem problemas e nada foi agendado:\n${problemas.join("\n")}` },
      { status: 409 }
    );
  }

  let body: { horarios?: Record<string, unknown> } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* Corpo vazio é o caso normal: usar o calendário como está. */
  }

  /* Público por segmento calculado uma vez, não uma por etapa: é o mesmo nas
     sete, porque esta régua não corta por engajamento. */
  const publico = new Map<SegmentoBase, number>();
  for (const segmento of SEGMENTOS) {
    publico.set(segmento, (await destinatarios(segmento)).length);
  }

  const linhas: ResultadoLinha[] = [];
  for (const dia of CALENDARIO) {
    const ajustado = body.horarios?.[String(dia.etapa)];
    const quando = typeof ajustado === "string" && ajustado ? ajustado : dia.quando;
    const quandoIso = isoDeBrasilia(quando);

    for (const segmento of SEGMENTOS) {
      const linha = { etapa: dia.etapa, segmento, quando };

      if ((publico.get(segmento) ?? 0) === 0) {
        linhas.push({ ...linha, resultado: "pulado", motivo: "Segmento sem ninguém na base." });
        continue;
      }
      if (!quandoIso) {
        linhas.push({ ...linha, resultado: "pulado", motivo: `Horário inválido: "${quando}".` });
        continue;
      }

      const assunto = talkRunSubject(dia.variante, new Date(quandoIso));
      const r = await agendarEtapa(CAMPANHA, { etapa: dia.etapa, segmento }, quandoIso, {
        variante: dia.variante,
        assunto,
      });
      linhas.push(r.ok ? { ...linha, resultado: "agendado" } : { ...linha, resultado: "pulado", motivo: r.motivo });
    }
  }

  return NextResponse.json({
    ok: true,
    agendadas: linhas.filter((l) => l.resultado === "agendado").length,
    puladas: linhas.filter((l) => l.resultado === "pulado").length,
    linhas,
  });
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
