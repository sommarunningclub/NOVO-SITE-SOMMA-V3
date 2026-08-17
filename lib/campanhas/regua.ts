import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { linkDescadastro } from "@/lib/campanhas/descadastro";
import {
  ETAPAS,
  SEGMENTOS,
  etapaRotulo,
  evolveFortalecimentoSubject,
  renderEvolveFortalecimentoEmail,
  EMAIL_HERO_URL,
  type EtapaRegua,
  type SegmentoBase,
} from "@/lib/emails/evolve-fortalecimento";

/**
 * Régua de disparo da campanha Evolve.
 *
 *   etapa 1  toda a base
 *   etapa 2  só quem não abriu a etapa 1
 *   etapa 3  só quem não abriu a etapa 2
 *
 * Envio transacional, não broadcast. A conta Resend está no plano Marketing que
 * limita a 1.000 contatos armazenados, e a base tem quase 7 mil; broadcast exige
 * importar todo mundo como Contact numa Audience antes de mandar, e foi
 * exatamente isso que a conta recusou. `emails.send`/`batch.send` são cobrados
 * por volume de e-mail, não por contato guardado, e não têm esse teto.
 *
 * A troca custa duas coisas que o broadcast dava de graça:
 *
 *   1. Correlação de abertura sem `broadcast_id`. Cada envio leva `tags`
 *      (campanha/etapa/segmento) e a Resend ecoa essas tags no evento do
 *      webhook — é isso, não mais o broadcast, que liga um evento a uma etapa.
 *   2. Descadastro. Broadcast dá URL nativa; transacional não dá nada. Por isso
 *      todo envio carrega `List-Unsubscribe` + `List-Unsubscribe-Post` apontando
 *      para /api/campanhas/descadastrar (lib/campanhas/descadastro.ts), e
 *      `campanha_contatos.descadastrado_em` é filtrado em toda consulta de
 *      destinatário.
 *
 * O "não abriu" continua sendo aproximação, não fato: pixel de abertura falha
 * com imagem bloqueada, e o Apple Mail pré-carrega o pixel de quem talvez nem
 * tenha visto.
 */

export const CAMPANHA = "evolve-fortalecimento-ago2026";

/** Clique conta como abertura: é medido por redirecionamento, não por pixel. */
export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

/** A Resend aceita só ASCII letras/números/_/- em nome e valor de tag. */
const TAG_CAMPANHA = "campanha";
const TAG_ETAPA = "etapa";
const TAG_SEGMENTO = "segmento";

export interface EtapaRegistro {
  etapa: EtapaRegua;
  segmento: SegmentoBase;
  variante: string;
  assunto: string;
  agendado_para: string | null;
  enviado_em: string | null;
  status: "rascunho" | "agendado" | "enviado" | "cancelado";
  total_destinatarios: number;
}

/** O PostgREST devolve no máximo 1000 linhas; sem paginar, a base sai truncada. */
async function paginar<T>(
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

const EMAIL_OK = /^[^\s@,;]+@[^\s@,;.]+\.[a-z]{2,}$/i;

/* ── 1. Sincronizar a base ───────────────────────────────────────────────── */

export interface ResumoSincronizacao {
  cadastroSite: number;
  checkins: number;
  total: number;
  removidosPorCruzamento: number;
}

/**
 * Lê `cadastro_site` e `checkins`, deduplica e grava em `campanha_contatos`.
 *
 * `cadastro_site` tem precedência: quem está nas duas listas recebe UM e-mail,
 * contado como cadastro_site. `ignoreDuplicates` no upsert é o que faz resync
 * repetido não reviver quem já pediu descadastro: uma linha existente nunca é
 * sobrescrita, então `descadastrado_em` sobrevive a qualquer nova sincronização.
 */
export async function sincronizarBase(): Promise<ResumoSincronizacao> {
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
    segmento: SegmentoBase
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
      linhas.push({ campanha: CAMPANHA, email, nome: r.nome_completo ?? null, segmento });
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

/* ── 2. Quem recebe a próxima etapa ──────────────────────────────────────── */

export interface Destinatario {
  email: string;
  nome: string | null;
}

/**
 * A lista de uma etapa, para uma base.
 *
 * Etapa 1 é a base inteira daquele segmento, menos quem já descadastrou. Etapa N
 * é quem RECEBEU a etapa N-1 e não gerou evento de engajamento nela — consultado
 * agora por (campanha, etapa, segmento) em `campanha_eventos`, que é o que o
 * envio transacional grava a partir das `tags` ecoadas no webhook.
 */
export async function destinatariosDaEtapa(
  etapa: EtapaRegua,
  segmento: SegmentoBase
): Promise<Destinatario[]> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const daBase = await paginar<{ email: string; nome: string | null }>((de, ate) =>
    supabase
      .from("campanha_contatos")
      .select("email, nome")
      .eq("campanha", CAMPANHA)
      .eq("segmento", segmento)
      .is("descadastrado_em", null)
      .range(de, ate)
  );

  if (etapa === 1) return daBase;

  const anterior = (etapa - 1) as EtapaRegua;
  const registro = await buscarEtapa(supabase, anterior, segmento);
  if (!registro || registro.status !== "enviado") {
    throw new Error(
      `A etapa ${anterior} de ${segmento} ainda não foi disparada, então não há como saber quem não abriu.`
    );
  }

  const recebeuAnterior = new Set(
    (
      await paginar<{ email: string }>((de, ate) =>
        supabase
          .from("campanha_destinatarios")
          .select("email")
          .eq("campanha", CAMPANHA)
          .eq("etapa", anterior)
          .eq("segmento", segmento)
          .range(de, ate)
      )
    ).map((r) => r.email.toLowerCase())
  );

  const engajou = new Set(
    (
      await paginar<{ email: string }>((de, ate) =>
        supabase
          .from("campanha_eventos")
          .select("email")
          .eq("campanha", CAMPANHA)
          .eq("etapa", anterior)
          .eq("segmento", segmento)
          .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
          .range(de, ate)
      )
    ).map((r) => r.email.toLowerCase())
  );

  return daBase.filter((c) => recebeuAnterior.has(c.email) && !engajou.has(c.email));
}

async function buscarEtapa(
  supabase: SupabaseClient,
  etapa: EtapaRegua,
  segmento: SegmentoBase
): Promise<EtapaRegistro | null> {
  const { data, error } = await supabase
    .from("campanha_etapas")
    .select("*")
    .eq("campanha", CAMPANHA)
    .eq("etapa", etapa)
    .eq("segmento", segmento)
    .maybeSingle();
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  return (data as EtapaRegistro | null) ?? null;
}

/* ── 3. Disparar uma etapa (envio transacional em lote) ──────────────────── */

const TAMANHO_LOTE = 100; // teto do endpoint de batch da Resend
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function partir<T>(itens: T[], tamanho: number): T[][] {
  const partes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) partes.push(itens.slice(i, i + tamanho));
  return partes;
}

export interface ResultadoDisparo {
  etapa: EtapaRegua;
  segmento: SegmentoBase;
  total: number;
  enviados: number;
  falhas: number;
}

/**
 * Monta e envia uma etapa por lotes de 100 (`batch.send`, `batchValidation:
 * "permissive"`, para um endereço ruim num lote não derrubar os outros 99).
 *
 * Nunca aborta a operação inteira por causa de um lote: um lote que falha depois
 * de tentar de novo é contado como falha e a função segue para o próximo. O que
 * já foi enviado com sucesso é sempre gravado, mesmo que outro lote quebre depois
 * — a alternativa (jogar tudo fora e recomeçar) reenviaria e-mail para quem já
 * recebeu.
 */
export async function dispararEtapa(params: {
  etapa: EtapaRegua;
  segmento: SegmentoBase;
}): Promise<ResultadoDisparo> {
  const { etapa, segmento } = params;
  const supabase = getServiceSupabase();
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!supabase) throw new Error("Supabase não configurado.");
  if (!resend || !from) throw new Error("Resend não configurado.");

  const jaExiste = await buscarEtapa(supabase, etapa, segmento);
  if (jaExiste && jaExiste.status !== "cancelado" && jaExiste.status !== "rascunho") {
    throw new Error(
      `A etapa ${etapa} de ${segmento} já está em ${jaExiste.status}. Cancele antes de recriar.`
    );
  }

  const head = await fetch(EMAIL_HERO_URL, { method: "HEAD" });
  if (!head.ok || !(head.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new Error(
      `O banner não está publicado (${head.status}). Faça o deploy de public/evolve-fortalecimento/email/hero-banner.jpg antes de disparar.`
    );
  }

  const destinatarios = await destinatariosDaEtapa(etapa, segmento);
  if (destinatarios.length === 0) {
    throw new Error(`Nenhum destinatário para a etapa ${etapa} de ${segmento}.`);
  }

  const assunto = evolveFortalecimentoSubject(etapa);
  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(destinatarios, TAMANHO_LOTE)) {
    const itens = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderEvolveFortalecimentoEmail({
        nome: d.nome,
        segmento,
        etapa,
        descadastroUrl,
      });
      return {
        from,
        to: d.email,
        subject: assunto,
        html,
        headers: {
          "List-Unsubscribe": `<${descadastroUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [
          { name: TAG_CAMPANHA, value: CAMPANHA },
          { name: TAG_ETAPA, value: String(etapa) },
          { name: TAG_SEGMENTO, value: segmento },
        ],
      };
    });

    const resultado = await enviarLoteComRetentativa(resend, itens);
    if (!resultado) {
      falhas += lote.length;
      continue;
    }

    const indicesComErro = new Set(resultado.errors?.map((e) => e.index) ?? []);
    lote.forEach((d, i) => {
      if (indicesComErro.has(i)) falhas++;
      else sucesso.push(d);
    });

    // ~2 req/s é o teto documentado da API sem plano elevado; 600ms dá folga.
    await espera(600);
  }

  if (sucesso.length === 0) {
    throw new Error(`Nenhum e-mail foi enviado (${falhas} falha(s)). Etapa não marcada como enviada.`);
  }

  const linhasDestinatarios = sucesso.map((d) => ({
    campanha: CAMPANHA,
    etapa,
    segmento,
    email: d.email,
  }));
  for (let i = 0; i < linhasDestinatarios.length; i += 500) {
    const { error } = await supabase
      .from("campanha_destinatarios")
      .upsert(linhasDestinatarios.slice(i, i + 500), {
        onConflict: "campanha,etapa,email",
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`campanha_destinatarios: ${error.message}`);
  }

  const agora = new Date().toISOString();
  const { error: erroEtapa } = await supabase.from("campanha_etapas").upsert(
    {
      campanha: CAMPANHA,
      etapa,
      segmento,
      variante: etapaRotulo(etapa),
      assunto,
      agendado_para: agora,
      enviado_em: agora,
      status: "enviado",
      total_destinatarios: sucesso.length,
    },
    { onConflict: "campanha,etapa,segmento" }
  );
  if (erroEtapa) throw new Error(`campanha_etapas: ${erroEtapa.message}`);

  return { etapa, segmento, total: destinatarios.length, enviados: sucesso.length, falhas };
}

interface ItemLote {
  from: string;
  to: string;
  subject: string;
  html: string;
  headers: Record<string, string>;
  tags: { name: string; value: string }[];
}

interface RespostaLote {
  data: { id: string }[];
  errors?: { index: number; message: string }[];
}

/**
 * `null` de volta = o lote inteiro falhou mesmo após tentar de novo. Quem chama
 * conta essas pessoas como falha e segue para o próximo lote, em vez de abortar.
 */
async function enviarLoteComRetentativa(
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

/* ── 4. Painel ───────────────────────────────────────────────────────────── */

export interface LinhaPainel {
  etapa: EtapaRegua;
  rotulo: string;
  segmento: SegmentoBase;
  assunto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  /** Eventos de engajamento distintos por e-mail, vindos do webhook. */
  aberturas: number;
  cliques: number;
  /** Quantos entrariam na etapa seguinte se ela fosse montada agora. */
  naoAbriram: number | null;
}

export interface Painel {
  campanha: string;
  base: { total: number; porSegmento: Record<string, number> };
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
}

export async function montarPainel(): Promise<Painel> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const contatos = await paginar<{ segmento: string }>((de, ate) =>
    supabase
      .from("campanha_contatos")
      .select("segmento")
      .eq("campanha", CAMPANHA)
      .is("descadastrado_em", null)
      .range(de, ate)
  );
  const porSegmento: Record<string, number> = {};
  for (const c of contatos) porSegmento[c.segmento] = (porSegmento[c.segmento] ?? 0) + 1;

  const { data: etapasRaw, error } = await supabase
    .from("campanha_etapas")
    .select("*")
    .eq("campanha", CAMPANHA);
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  const etapas = (etapasRaw ?? []) as EtapaRegistro[];

  const linhas: LinhaPainel[] = [];
  for (const etapa of ETAPAS) {
    for (const segmento of SEGMENTOS) {
      const reg = etapas.find((e) => e.etapa === etapa && e.segmento === segmento) ?? null;

      let aberturas = 0;
      let cliques = 0;
      if (reg?.status === "enviado") {
        const eventos = await paginar<{ tipo: string; email: string }>((de, ate) =>
          supabase
            .from("campanha_eventos")
            .select("tipo, email")
            .eq("campanha", CAMPANHA)
            .eq("etapa", etapa)
            .eq("segmento", segmento)
            .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
            .range(de, ate)
        );
        aberturas = new Set(eventos.map((e) => e.email)).size;
        cliques = new Set(eventos.filter((e) => e.tipo === "clicked").map((e) => e.email)).size;
      }

      linhas.push({
        etapa,
        rotulo: etapaRotulo(etapa),
        segmento,
        assunto: reg?.assunto ?? evolveFortalecimentoSubject(etapa),
        status: reg?.status ?? "pendente",
        enviadoEm: reg?.enviado_em ?? null,
        totalDestinatarios: reg?.total_destinatarios ?? 0,
        aberturas,
        cliques,
        naoAbriram: reg?.status === "enviado" ? Math.max(0, (reg.total_destinatarios ?? 0) - aberturas) : null,
      });
    }
  }

  return {
    campanha: CAMPANHA,
    base: { total: contatos.length, porSegmento },
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}
