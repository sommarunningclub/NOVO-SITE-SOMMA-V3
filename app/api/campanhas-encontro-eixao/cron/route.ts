import { NextRequest, NextResponse } from "next/server";
import {
  CAMPANHA,
  ETAPAS,
  dispararCampanha,
  sincronizarBase,
  type EtapaEncontro,
} from "@/lib/campanhas/regua-encontro-eixao";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Gatilho agendado das três etapas. Chamado pelo cron da Vercel (ver
 * vercel.json), um agendamento por etapa, com `?etapa=` na URL.
 *
 * O horário de verdade mora no vercel.json, em UTC, não aqui: cron da Vercel
 * ignora fuso, e "09h30 de Brasília" só existe como 12h30 UTC. Esta rota não
 * confere a hora do relógio de propósito. Se o cron atrasar cinco minutos, o
 * disparo tem que sair atrasado, não ser cancelado por estar fora da janela.
 *
 * Repetição é problema resolvido na régua, não aqui: `dispararCampanha` recusa
 * uma etapa que já esteja `enviado`. Por isso um retry do cron devolve 409 com
 * a explicação em vez de mandar tudo de novo.
 *
 * Autenticação por `CRON_SECRET`, o header que a própria Vercel manda. Sem a
 * variável definida a rota recusa tudo: uma rota de disparo em massa aberta na
 * internet é pior do que uma campanha que não sai.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  }
  const header = request.headers.get("authorization");
  if (header !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const etapa = Number(request.nextUrl.searchParams.get("etapa")) as EtapaEncontro;
  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` }, { status: 400 });
  }

  try {
    /* Ressincronizar antes de cada etapa, não só antes da primeira: quem fez
       check-in entre um disparo e outro entra na etapa seguinte. */
    const base = await sincronizarBase();
    const resultado = await dispararCampanha(etapa);
    console.log(`[${CAMPANHA}] etapa ${etapa} enviada:`, resultado);
    return NextResponse.json({ ok: true, base, ...resultado });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha ao disparar.";
    console.error(`[${CAMPANHA}] etapa ${etapa} falhou:`, mensagem);
    // 409 e não 500 quando é a trava de idempotência: o cron repetiu, e isso
    // não é um erro do servidor.
    const repetido = /já está em/.test(mensagem);
    return NextResponse.json({ error: mensagem }, { status: repetido ? 409 : 500 });
  }
}
