import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { jaReceberam, liberarEtapa, reivindicarEtapa } from "@/lib/campanhas/claim";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { linkDescadastro, descadastradosGlobalmente } from "@/lib/campanhas/descadastro";
import {
  TAMANHO_LOTE,
  espera,
  partir,
  paginar,
  enviarLoteComRetentativa,
  sincronizarBaseGenerica,
  type ItemLote,
  type ResumoSincronizacao,
} from "@/lib/campanhas/envio";
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
  status: "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";
  total_destinatarios: number;
}

/* ── 1. Sincronizar a base ───────────────────────────────────────────────── */

export async function sincronizarBase(): Promise<ResumoSincronizacao> {
  return sincronizarBaseGenerica(CAMPANHA);
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

  const [contatos, descadastrados] = await Promise.all([
    paginar<{ email: string; nome: string | null }>((de, ate) =>
      supabase
        .from("campanha_contatos")
        .select("email, nome")
        .eq("campanha", CAMPANHA)
        .eq("segmento", segmento)
        .range(de, ate)
    ),
    descadastradosGlobalmente(),
  ]);
  // Filtro global, não só a coluna desta linha: cobre quem saiu por uma
  // campanha diferente antes desta base existir.
  const daBase = contatos.filter((c) => !descadastrados.has(c.email.toLowerCase()));

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
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const chave = { campanha: CAMPANHA, etapa: params.etapa, segmento: params.segmento };
  const reserva = await reivindicarEtapa(supabase, chave, {
    variante: etapaRotulo(params.etapa),
    assunto: evolveFortalecimentoSubject(params.etapa),
  });
  if (!reserva.ok) throw new Error(reserva.motivo);

  try {
    return await executarDisparo(params);
  } catch (err) {
    // Reserva é para impedir disparo duplo, não para trancar a etapa para
    // sempre: se nada saiu, o operador precisa poder tentar de novo.
    await liberarEtapa(supabase, chave);
    throw err;
  }
}

async function executarDisparo(params: {
  etapa: EtapaRegua;
  segmento: SegmentoBase;
}): Promise<ResultadoDisparo> {
  const { etapa, segmento } = params;
  const supabase = getServiceSupabase();
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!supabase) throw new Error("Supabase não configurado.");
  if (!resend || !from) throw new Error("Resend não configurado.");

  const head = await fetch(EMAIL_HERO_URL, { method: "HEAD" });
  if (!head.ok || !(head.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new Error(
      `O banner não está publicado (${head.status}). Faça o deploy de public/evolve-fortalecimento/email/hero-banner.jpg antes de disparar.`
    );
  }

  // Uma tentativa anterior pode ter morrido no meio (timeout, lote com erro).
  // Quem já recebeu esta etapa fica de fora: retentativa continua, não reenvia.
  const servidos = await jaReceberam(supabase, { campanha: CAMPANHA, etapa, segmento });
  const destinatarios = (await destinatariosDaEtapa(etapa, segmento)).filter(
    (d) => !servidos.has(d.email.toLowerCase())
  );
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

  const [contatosRaw, descadastrados] = await Promise.all([
    paginar<{ email: string; segmento: string }>((de, ate) =>
      supabase.from("campanha_contatos").select("email, segmento").eq("campanha", CAMPANHA).range(de, ate)
    ),
    descadastradosGlobalmente(),
  ]);
  const contatos = contatosRaw.filter((c) => !descadastrados.has(c.email.toLowerCase()));
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
