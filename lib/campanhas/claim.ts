import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { paginar } from "./envio";

/**
 * Reserva atômica de uma etapa de disparo.
 *
 * O disparo levava até 5 minutos entre "conferi que ninguém enviou" e "marquei
 * como enviado". Dois cliques no botão, duas abas abertas ou um retry da Vercel
 * dentro dessa janela passavam os dois pela conferência e a base inteira
 * recebia o mesmo e-mail duas vezes — e não tem como cancelar e-mail que já saiu.
 *
 * A reserva fecha essa janela com uma escrita, não com uma leitura:
 *
 *  - `UPDATE ... WHERE status IN ('rascunho','cancelado') RETURNING` é uma
 *    instrução só. Dois processos correndo juntos, um leva a linha e o outro
 *    volta vazio.
 *  - Quando a linha ainda não existe, o `INSERT` é protegido pela UNIQUE
 *    (campanha, etapa, segmento): o segundo leva 23505 e desiste.
 *
 * O status `enviando` é o que marca a reserva. Se o disparo falhar, quem chamou
 * devolve a etapa com `liberarEtapa` para o operador poder tentar de novo.
 */

export type ResultadoReserva = { ok: true } | { ok: false; motivo: string };

export interface ChaveEtapa {
  campanha: string;
  etapa: number;
  segmento: string;
}

const REIVINDICAVEIS = ["rascunho", "cancelado"];

export async function reivindicarEtapa(
  supabase: SupabaseClient,
  chave: ChaveEtapa,
  campos: { variante: string; assunto: string }
): Promise<ResultadoReserva> {
  const { campanha, etapa, segmento } = chave;

  // 1. A linha já existe e está livre? Toma numa instrução só.
  const { data: tomada, error: erroUpdate } = await supabase
    .from("campanha_etapas")
    .update({ status: "enviando", assunto: campos.assunto })
    .eq("campanha", campanha)
    .eq("etapa", etapa)
    .eq("segmento", segmento)
    .in("status", REIVINDICAVEIS)
    .select("etapa");

  if (erroUpdate) return { ok: false, motivo: `campanha_etapas: ${erroUpdate.message}` };
  if (tomada && tomada.length > 0) return { ok: true };

  // 2. Não tomou: ou a linha não existe, ou está ocupada. Descobre qual.
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
          ? `A etapa ${etapa} de ${segmento} já está sendo disparada agora. Aguarde terminar.`
          : `A etapa ${etapa} de ${segmento} já está em ${status}. Cancele antes de recriar.`,
    };
  }

  // 3. Linha nova. A UNIQUE decide quem chegou primeiro.
  const { error: erroInsert } = await supabase.from("campanha_etapas").insert({
    campanha,
    etapa,
    segmento,
    variante: campos.variante,
    assunto: campos.assunto,
    status: "enviando",
    total_destinatarios: 0,
  });

  if (erroInsert) {
    if (erroInsert.code === "23505") {
      return {
        ok: false,
        motivo: `A etapa ${etapa} de ${segmento} já está sendo disparada agora. Aguarde terminar.`,
      };
    }
    return { ok: false, motivo: `campanha_etapas: ${erroInsert.message}` };
  }

  return { ok: true };
}

/** Devolve a etapa reservada quando o disparo não foi adiante. */
export async function liberarEtapa(
  supabase: SupabaseClient,
  chave: ChaveEtapa
): Promise<void> {
  const { error } = await supabase
    .from("campanha_etapas")
    .update({ status: "rascunho" })
    .eq("campanha", chave.campanha)
    .eq("etapa", chave.etapa)
    .eq("segmento", chave.segmento)
    .eq("status", "enviando");
  if (error) {
    console.error("[campanhas] não liberou a etapa reservada:", error.message);
  }
}

/**
 * Quem já recebeu esta etapa.
 *
 * Um disparo que morreu no meio (timeout da função, erro num lote) deixa parte
 * da base já servida. Sem este filtro, tentar de novo reenviaria para todo
 * mundo; com ele, a segunda tentativa continua de onde parou.
 */
export async function jaReceberam(
  supabase: SupabaseClient,
  chave: ChaveEtapa
): Promise<Set<string>> {
  const linhas = await paginar<{ email: string }>((de, ate) =>
    supabase
      .from("campanha_destinatarios")
      .select("email")
      .eq("campanha", chave.campanha)
      .eq("etapa", chave.etapa)
      .eq("segmento", chave.segmento)
      .range(de, ate)
  );
  return new Set(linhas.map((l) => l.email.toLowerCase()));
}
