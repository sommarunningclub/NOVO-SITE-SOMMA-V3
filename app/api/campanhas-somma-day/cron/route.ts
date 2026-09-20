import { NextRequest, NextResponse } from "next/server";
import { devolverParaAgendado, reservarVencidas } from "@/lib/campanhas/agendamento";
import {
  CAMPANHA,
  dispararEtapa,
  sincronizarBase,
  type EtapaSommaDay,
} from "@/lib/campanhas/regua-somma-day";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Recolhe e dispara o que foi agendado no painel.
 *
 * Roda a cada 5 minutos (vercel.json). O horário é escolhido pelo operador e
 * mora no banco, então o cron é só uma varredura: o disparo sai entre a hora
 * marcada e cinco minutos depois.
 *
 * Repetição já está resolvida em duas camadas: `reservarVencidas` é um UPDATE
 * atômico (dois crons simultâneos, só um leva as linhas) e `dispararEtapa`
 * reivindica a etapa antes de enviar. Uma invocação repetida da Vercel não
 * remanda nada.
 *
 * Autenticação por CRON_SECRET, o header que a própria Vercel manda. Sem a
 * variável a rota recusa tudo: rota de disparo em massa aberta na internet é
 * pior do que campanha que não sai.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let vencidas;
  try {
    vencidas = await reservarVencidas(CAMPANHA);
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha ao ler os agendamentos.";
    console.error(`[${CAMPANHA}] cron não conseguiu ler agendamentos:`, mensagem);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }

  if (vencidas.length === 0) return NextResponse.json({ ok: true, disparadas: [] });

  /* Ressincronizar antes de disparar, uma vez para a varredura inteira: quem se
     cadastrou ou fez check-in depois do agendamento entra na etapa. Se falhar,
     segue com a base que já está lá, em vez de deixar a etapa não sair. */
  try {
    await sincronizarBase();
  } catch (err) {
    console.error(`[${CAMPANHA}] sincronização falhou, seguindo com a base atual:`, err);
  }

  const disparadas = [];
  for (const alvo of vencidas) {
    try {
      const resultado = await dispararEtapa(alvo.etapa as EtapaSommaDay, alvo.segmento as SegmentoBase);
      console.log(`[${CAMPANHA}] etapa ${alvo.etapa}/${alvo.segmento} enviada:`, resultado);
      disparadas.push({ ...alvo, ok: true as const, ...resultado });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Falha ao disparar.";
      console.error(`[${CAMPANHA}] etapa ${alvo.etapa}/${alvo.segmento} falhou:`, mensagem);

      /* Erro que não vai se resolver em cinco minutos (sem público, etapa
         anterior não saiu, evento já passou) fica em rascunho e aparece no
         painel. Qualquer outro (Resend fora do ar, timeout) volta para
         `agendado` e a próxima varredura tenta de novo, sem risco de duplicar:
         quem já recebeu está em campanha_destinatarios. */
      const definitivo = /Nenhum destinatário|Ninguém em|Nenhuma etapa anterior|ainda não foi disparada|foi em \d{4}/i.test(
        mensagem
      );
      if (!definitivo) await devolverParaAgendado(CAMPANHA, alvo, alvo.agendadoPara);

      disparadas.push({ ...alvo, ok: false as const, erro: mensagem, retentar: !definitivo });
    }
  }

  return NextResponse.json({ ok: true, disparadas });
}
