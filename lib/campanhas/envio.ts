import "server-only";
import { getResendClient } from "@/lib/resend";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Peças de envio compartilhadas entre réguas de campanha.
 *
 * Extraído de `regua.ts` quando a segunda campanha (Desafio das Esteiras)
 * precisou do mesmo mecanismo de disparo em lote. É a parte mais arriscada de
 * cada régua — retry, rate limit, paginação — e reaproveitar em vez de copiar
 * evita duas cópias divergindo silenciosamente depois de testadas separado.
 */

export const EMAIL_OK = /^[^\s@,;]+@[^\s@,;.]+\.[a-z]{2,}$/i;

/** O PostgREST devolve no máximo 1000 linhas; sem paginar, a base sai truncada. */
export async function paginar<T>(
  montaQuery: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const passo = 1000;
  const tudo: T[] = [];
  for (let de = 0; ; de += passo) {
    const { data, error } = await montaQuery(de, de + passo - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    tudo.push(...data);
    if (data.length < passo) break;
  }
  return tudo;
}

export const TAMANHO_LOTE = 100; // teto do endpoint de batch da Resend
export const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function partir<T>(itens: T[], tamanho: number): T[][] {
  const partes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) partes.push(itens.slice(i, i + tamanho));
  return partes;
}

export interface ItemLote {
  from: string;
  to: string;
  subject: string;
  html: string;
  headers: Record<string, string>;
  tags: { name: string; value: string }[];
}

export interface RespostaLote {
  data: { id: string }[];
  errors?: { index: number; message: string }[];
}

/**
 * `null` de volta = o lote inteiro falhou mesmo após tentar de novo. Quem chama
 * conta essas pessoas como falha e segue para o próximo lote, em vez de abortar
 * a etapa inteira por causa de um lote ruim.
 */
export async function enviarLoteComRetentativa(
  resend: NonNullable<ReturnType<typeof getResendClient>>,
  itens: ItemLote[],
  tentativas = 4
): Promise<RespostaLote | null> {
  for (let i = 0; i < tentativas; i++) {
    const { data, error } = await resend.batch.send(itens, { batchValidation: "permissive" });
    if (!error) return data as RespostaLote;

    const transitorio = /rate|too many|429|timeout|network|fetch failed/i.test(error.message);
    if (!transitorio || i === tentativas - 1) {
      console.error("[campanhas] lote falhou:", error.message);
      return null;
    }
    await espera(1500 * (i + 1));
  }
  return null;
}

export interface ResumoSincronizacao {
  cadastroSite: number;
  checkins: number;
  total: number;
  removidosPorCruzamento: number;
}

/**
 * Lê `cadastro_site` e `checkins`, deduplica e grava em `campanha_contatos` sob
 * a `campanha` dada. Parametrizada por campanha porque cada campanha tem sua
 * própria régua e seu próprio progresso — mas a fonte (as mesmas duas tabelas) e
 * a regra de dedup (cadastro_site tem precedência) são as mesmas para qualquer
 * campanha que promova o SOMMA Club para a base inteira.
 *
 * `ignoreDuplicates` no upsert é o que faz resync repetido não reviver quem já
 * pediu descadastro NESTA campanha: uma linha existente nunca é sobrescrita. O
 * descadastro que vale entre campanhas é outra tabela (`descadastros_globais`,
 * ver lib/campanhas/descadastro.ts) — filtrada na hora de montar destinatários,
 * não aqui na sincronização.
 */
export async function sincronizarBaseGenerica(campanha: string): Promise<ResumoSincronizacao> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const puxar = (tabela: string) =>
    paginar<{ email: string | null; nome_completo: string | null }>((de, ate) =>
      supabase.from(tabela).select("email, nome_completo").range(de, ate)
    );

  const [brutoCadastro, brutoCheckins] = await Promise.all([
    puxar("cadastro_site"),
    puxar("checkins"),
  ]);

  const vistos = new Set<string>();
  const linhas: Array<{ campanha: string; email: string; nome: string | null; segmento: string }> = [];
  let removidosPorCruzamento = 0;

  const absorver = (
    bruto: Array<{ email: string | null; nome_completo: string | null }>,
    segmento: "cadastro-site" | "checkins"
  ) => {
    let entraram = 0;
    for (const r of bruto) {
      const email = String(r.email ?? "").trim().toLowerCase();
      if (!EMAIL_OK.test(email)) continue;
      if (vistos.has(email)) {
        if (segmento === "checkins") removidosPorCruzamento++;
        continue;
      }
      vistos.add(email);
      linhas.push({ campanha, email, nome: r.nome_completo ?? null, segmento });
      entraram++;
    }
    return entraram;
  };

  const cadastroSite = absorver(brutoCadastro, "cadastro-site");
  const checkins = absorver(brutoCheckins, "checkins");

  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await supabase
      .from("campanha_contatos")
      .upsert(linhas.slice(i, i + 500), { onConflict: "campanha,email", ignoreDuplicates: true });
    if (error) throw new Error(`campanha_contatos: ${error.message}`);
  }

  return { cadastroSite, checkins, total: linhas.length, removidosPorCruzamento };
}
