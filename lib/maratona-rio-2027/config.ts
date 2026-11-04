import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIMITE_VAGAS } from "./inscricao";

/**
 * Vagas do lote e abertura da inscrição, editáveis pelo painel
 * (`maratona_rio_2027_config`). Se a tabela não responder, vale o padrão do
 * código (LIMITE_VAGAS, inscrições abertas): o site não cai por causa disso.
 */
export interface ConfigRio {
  limite: number;
  abertas: boolean;
  /** false quando caiu no padrão do código (tabela ausente ou erro). */
  doBanco: boolean;
}

export async function lerConfig(supabase: SupabaseClient | null): Promise<ConfigRio> {
  const padrao: ConfigRio = { limite: LIMITE_VAGAS, abertas: true, doBanco: false };
  if (!supabase) return padrao;
  const { data, error } = await supabase
    .from("maratona_rio_2027_config")
    .select("limite_vagas, inscricoes_abertas")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[maratona-rio-2027] Falha ao ler config:", error.message);
    return padrao;
  }
  return { limite: data.limite_vagas, abertas: data.inscricoes_abertas, doBanco: true };
}
