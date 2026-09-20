import { NextRequest, NextResponse } from "next/server";
import { devolverParaAgendado, reservarVencidas } from "@/lib/campanhas/agendamento";
import {
  CAMPANHA,
  dispararCampanha,
  sincronizarBase,
  type EtapaTalkRun,
} from "@/lib/campanhas/regua-talk-run";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Recolhe e dispara o que foi agendado no painel da Talk Run.
 *
 * Mesmo desenho do cron do Sunset Wine Run, que já rodou uma régua diária
 * inteira em produção: varredura de 5 em 5 minutos (ver vercel.json), o
 * horário mora no banco e quem decide o que venceu é o
 * `agendado_para <= now()` dentro de `reservarVencidas`. O disparo sai entre a
 * hora marcada e cinco minutos depois.
 *
 * A hora do relógio não é conferida aqui de propósito: se a varredura atrasar,
 * o disparo sai atrasado, não é cancelado por estar fora da janela.
 *
 * Repetição está resolvida em duas camadas: `reservarVencidas` é um UPDATE
 * atômico (dois crons simultâneos, só um leva as linhas) e `dispararCampanha`
 * reivindica a etapa antes de enviar.
 *
 * Autenticação por `CRON_SECRET`, o header que a própria Vercel manda. Sem a
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

  /* Ressincronizar antes de disparar, uma vez só para a varredura inteira: quem
     se cadastrou no site ou fez check-in desde ontem entra no e-mail de hoje.
     Numa régua diária de sete dias isso é boa parte do motivo de ela existir. */
  try {
    await sincronizarBase();
  } catch (err) {
    console.error(`[${CAMPANHA}] sincronização falhou, seguindo com a base atual:`, err);
  }

  const disparadas = [];
  for (const alvo of vencidas) {
    try {
      const resultado = await dispararCampanha(alvo.segmento as SegmentoBase, alvo.etapa as EtapaTalkRun);
      console.log(`[${CAMPANHA}] etapa ${alvo.etapa}/${alvo.segmento} enviada:`, resultado);
      disparadas.push({ ...alvo, ok: true as const, ...resultado });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Falha ao disparar.";
      console.error(`[${CAMPANHA}] etapa ${alvo.etapa}/${alvo.segmento} falhou:`, mensagem);

      /* Falta de público não é falha de infraestrutura: a etapa não tinha para
         quem ir e não vai passar a ter em cinco minutos. Fica em rascunho, o
         operador vê no painel. Qualquer outro erro volta para `agendado` e a
         próxima varredura tenta de novo, sem risco de duplicar, porque quem já
         recebeu está em campanha_destinatarios. */
      const semPublico = /Nenhum destinatário|Ninguém em|Sem público/i.test(mensagem);
      if (!semPublico) await devolverParaAgendado(CAMPANHA, alvo, alvo.agendadoPara);

      disparadas.push({ ...alvo, ok: false as const, erro: mensagem, retentar: !semPublico });
    }
  }

  return NextResponse.json({ ok: true, disparadas });
}
