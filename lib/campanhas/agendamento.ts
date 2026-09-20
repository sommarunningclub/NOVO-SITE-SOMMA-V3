import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Agendamento de etapas de campanha, genérico por `campanha`.
 *
 * Existe porque o agendamento vivia fora do produto: um shell script
 * (`scripts/*-agendar.sh`) que dormia no Mac do operador sob `caffeinate` até a
 * hora e então chamava a régua. Funciona enquanto a máquina estiver ligada — e
 * em 26/08/2026 ela não estava: o Mac foi desligado, os três processos em
 * espera morreram junto e a etapa 4 do Sunset Wine Run simplesmente não saiu,
 * sem ninguém ser avisado. Um disparo que depende de um laptop acordado não é
 * um agendamento, é uma torcida.
 *
 * O desenho aqui tem duas metades, e a divisão é proposital:
 *
 *   - o operador marca a hora no painel, e isso vira uma LINHA no banco
 *     (`status = 'agendado'`, `agendado_para = <quando>`). Nada fica em
 *     memória de processo nenhum;
 *   - um cron da Vercel passa de tempos em tempos e recolhe o que venceu.
 *
 * Ou seja: quem lembra da hora é o Postgres, não um `sleep`. Fechar o
 * navegador, desligar o Mac ou redeployar o site não muda o que está marcado.
 *
 * ┄ Sobre o horário ┄
 * O painel manda "YYYY-MM-DDTHH:mm" e QUEM interpreta o fuso é o servidor, com
 * -03:00 fixo. Não uso o fuso do navegador de propósito: o mesmo horário
 * digitado tem que significar a mesma coisa se o operador estiver em Brasília,
 * em Lisboa ou num servidor em UTC. Brasília não tem horário de verão desde
 * 2019, então o offset fixo é correto e não vai passar a mentir sozinho.
 */

/** Brasília, sem horário de verão desde 2019. Ver o cabeçalho. */
const OFFSET_BRASILIA = "-03:00";

/** Status que uma etapa pode ter quando ainda não saiu nem está saindo. */
const AGENDAVEIS = ["rascunho", "cancelado", "agendado"];

export interface ChaveAgendamento {
  etapa: number;
  segmento: string;
}

export interface Agendamento extends ChaveAgendamento {
  agendadoPara: string;
}

export type ResultadoAgendamento = { ok: true } | { ok: false; motivo: string };

/**
 * "2026-08-28T10:00" (hora de Brasília) para ISO em UTC.
 * Devolve null se o formato não for exatamente o do input datetime-local.
 */
export function isoDeBrasilia(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const data = new Date(`${local}:00${OFFSET_BRASILIA}`);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function cliente(): SupabaseClient {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

/**
 * Marca a etapa para sair em `quandoIso`.
 *
 * Mesmo desenho de `claim.ts`: tenta tomar a linha existente com um UPDATE
 * condicionado ao status, e só cai para o INSERT quando ela não existe. Uma
 * etapa `enviado` ou `enviando` nunca é reagendada — o UPDATE não a alcança e a
 * leitura seguinte devolve o motivo em português para o painel mostrar.
 *
 * Reagendar uma etapa que já está `agendado` é permitido de propósito: trocar a
 * hora marcada é a operação mais comum do painel, e obrigar a cancelar antes só
 * criaria uma janela onde a etapa não está marcada para nada.
 */
export async function agendarEtapa(
  campanha: string,
  chave: ChaveAgendamento,
  quandoIso: string,
  campos: { variante: string; assunto: string }
): Promise<ResultadoAgendamento> {
  const supabase = cliente();
  const { etapa, segmento } = chave;

  if (new Date(quandoIso).getTime() <= Date.now()) {
    return { ok: false, motivo: "O horário escolhido já passou." };
  }

  const { data: tomada, error: erroUpdate } = await supabase
    .from("campanha_etapas")
    .update({ status: "agendado", agendado_para: quandoIso, assunto: campos.assunto })
    .eq("campanha", campanha)
    .eq("etapa", etapa)
    .eq("segmento", segmento)
    .in("status", AGENDAVEIS)
    .select("etapa");

  if (erroUpdate) return { ok: false, motivo: `campanha_etapas: ${erroUpdate.message}` };
  if (tomada && tomada.length > 0) return { ok: true };

  const { data: existente, error: erroLeitura } = await supabase
    .from("campanha_etapas")
    .select("status")
    .eq("campanha", campanha)
    .eq("etapa", etapa)
    .eq("segmento", segmento)
    .maybeSingle();

  if (erroLeitura) return { ok: false, motivo: `campanha_etapas: ${erroLeitura.message}` };
  if (existente) {
    const status = String(existente.status);
    return {
      ok: false,
      motivo:
        status === "enviando"
          ? `A etapa ${etapa} de ${segmento} está sendo disparada agora.`
          : `A etapa ${etapa} de ${segmento} já está em ${status} e não pode ser agendada.`,
    };
  }

  const { error: erroInsert } = await supabase.from("campanha_etapas").insert({
    campanha,
    etapa,
    segmento,
    variante: campos.variante,
    assunto: campos.assunto,
    status: "agendado",
    agendado_para: quandoIso,
    total_destinatarios: 0,
  });

  if (erroInsert) {
    if (erroInsert.code === "23505") {
      return { ok: false, motivo: `A etapa ${etapa} de ${segmento} acabou de ser criada por outra aba. Recarregue.` };
    }
    return { ok: false, motivo: `campanha_etapas: ${erroInsert.message}` };
  }

  return { ok: true };
}

/**
 * Desmarca uma etapa agendada.
 *
 * Vai para `cancelado` e não para `rascunho` porque é assim que a régua e o
 * painel já leem "existe mas não saiu, e pode ser disparada": `cancelado` está
 * na lista de reivindicáveis de `claim.ts`, então o botão "Disparar agora"
 * continua funcionando logo depois de cancelar, sem passo intermediário.
 */
export async function cancelarAgendamento(
  campanha: string,
  chave: ChaveAgendamento
): Promise<ResultadoAgendamento> {
  const supabase = cliente();
  const { data, error } = await supabase
    .from("campanha_etapas")
    .update({ status: "cancelado", agendado_para: null })
    .eq("campanha", campanha)
    .eq("etapa", chave.etapa)
    .eq("segmento", chave.segmento)
    .eq("status", "agendado")
    .select("etapa");

  if (error) return { ok: false, motivo: `campanha_etapas: ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, motivo: `A etapa ${chave.etapa} de ${chave.segmento} não está agendada.` };
  }
  return { ok: true };
}

/**
 * Recolhe, de uma vez e sem corrida, as etapas cujo horário já venceu.
 *
 * O UPDATE condicionado a `status = 'agendado' AND agendado_para <= agora` é
 * uma instrução só: se dois crons se sobrepuserem (a Vercel repete invocação
 * quando não recebe 2xx), um leva as linhas e o outro volta de mãos vazias.
 * Só depois disso o disparo começa, e ele tem a própria reserva em `claim.ts`.
 *
 * As linhas vão para `rascunho`, o estado que `dispararCampanha` sabe
 * reivindicar. A consequência: se o processo morrer entre o recolhimento e o
 * disparo, a etapa fica em `rascunho` no painel em vez de voltar sozinha para
 * `agendado`. É de propósito — melhor uma etapa parada e visível do que uma
 * etapa que tenta sair de novo a cada cinco minutos sem ninguém olhando.
 * `agendado_para` é preservado para o painel ainda saber para quando era.
 */
export async function reservarVencidas(
  campanha: string,
  agora: Date = new Date()
): Promise<Agendamento[]> {
  const supabase = cliente();
  const { data, error } = await supabase
    .from("campanha_etapas")
    .update({ status: "rascunho" })
    .eq("campanha", campanha)
    .eq("status", "agendado")
    .lte("agendado_para", agora.toISOString())
    .select("etapa, segmento, agendado_para");

  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  return (data ?? []).map((l) => ({
    etapa: Number((l as { etapa: number }).etapa),
    segmento: String((l as { segmento: string }).segmento),
    agendadoPara: String((l as { agendado_para: string }).agendado_para),
  }));
}

/** Devolve uma etapa recolhida para `agendado`, quando o disparo nem começou. */
export async function devolverParaAgendado(
  campanha: string,
  chave: ChaveAgendamento,
  quandoIso: string
): Promise<void> {
  const supabase = cliente();
  const { error } = await supabase
    .from("campanha_etapas")
    .update({ status: "agendado", agendado_para: quandoIso })
    .eq("campanha", campanha)
    .eq("etapa", chave.etapa)
    .eq("segmento", chave.segmento)
    .eq("status", "rascunho");
  if (error) console.error("[campanhas] não devolveu a etapa para agendado:", error.message);
}
