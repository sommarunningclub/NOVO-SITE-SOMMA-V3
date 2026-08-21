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
import { SEGMENTOS, type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";
import { getEventStats } from "@/lib/desafio-esteiras/db";
import { VAGAS_TOTAIS } from "@/lib/desafio-esteiras/event.config";
import {
  campanhaRotulo,
  desafioEsteirasCampanhaSubject,
  renderDesafioEsteirasCampanhaEmail,
  EMAIL_HERO_URL,
  type VarianteCampanha,
} from "@/lib/emails/desafio-esteiras-campanha";

/**
 * Régua da campanha do Desafio das Esteiras: convite → vagas → última chamada →
 * lembrete final. Mesmo mecanismo da régua Evolve (lib/campanhas/regua.ts):
 * envio transacional em lote, tags para correlação de abertura, descadastro
 * próprio. Não é um copy-paste por acaso — as duas réguas reaproveitam o mesmo
 * `lib/campanhas/envio.ts` para a parte que mais importa acertar (retry, rate
 * limit, paginação); o que muda aqui é só o template e o mapa etapa→variante.
 *
 * Etapa 4 existe e a etapa 3 (`SegmentoBase` da évolve não tem) porque este
 * evento pede dois e-mails no dia: de manhã para todo mundo, à tarde só para
 * quem não abriu o da manhã. A régua "só quem não abriu a anterior" já resolve
 * isso sozinha — o e-mail 4 É uma etapa comum, só que no mesmo dia da 3.
 */

export const CAMPANHA = "desafio-esteiras-convite-ago2026";

export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

export type EtapaDesafioEsteiras = 1 | 2 | 3 | 4 | 5;
export const ETAPAS: readonly EtapaDesafioEsteiras[] = [1, 2, 3, 4, 5] as const;

const ETAPA_VARIANTE: Record<EtapaDesafioEsteiras, VarianteCampanha> = {
  1: "convite",
  2: "vagas",
  3: "ultima-chamada",
  4: "lembrete-final",
  5: "chamada-final",
};

const TAG_CAMPANHA = "campanha";
const TAG_ETAPA = "etapa";
const TAG_SEGMENTO = "segmento";

export interface EtapaRegistro {
  etapa: EtapaDesafioEsteiras;
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

/* ── 2. Vagas em tempo real ───────────────────────────────────────────────── */

/**
 * Contagem honesta, não um número escrito à mão num script: o e-mail nunca
 * pode prometer vaga que já foi preenchida entre a redação da campanha e o
 * disparo.
 */
export async function vagasRestantesAgora(): Promise<number> {
  const stats = await getEventStats();
  return Math.max(0, VAGAS_TOTAIS - stats.totalCompetidores);
}

/* ── 3. Quem recebe a próxima etapa ──────────────────────────────────────── */

export interface Destinatario {
  email: string;
  nome: string | null;
}

export async function destinatariosDaEtapa(
  etapa: EtapaDesafioEsteiras,
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
  const daBase = contatos.filter((c) => !descadastrados.has(c.email.toLowerCase()));

  if (etapa === 1) return daBase;

  const anterior = (etapa - 1) as EtapaDesafioEsteiras;
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
  etapa: EtapaDesafioEsteiras,
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

/* ── 4. Disparar uma etapa ───────────────────────────────────────────────── */

export interface ResultadoDisparo {
  etapa: EtapaDesafioEsteiras;
  segmento: SegmentoBase;
  vagasRestantes: number;
  total: number;
  enviados: number;
  falhas: number;
}

export async function dispararEtapa(params: {
  etapa: EtapaDesafioEsteiras;
  segmento: SegmentoBase;
}): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  // Reserva atômica antes de qualquer envio: dois cliques ou um retry do cron
  // não podem mais mandar a mesma etapa duas vezes para a base.
  const chave = { campanha: CAMPANHA, etapa: params.etapa, segmento: params.segmento };
  const reserva = await reivindicarEtapa(supabase, chave, {
    variante: ETAPA_VARIANTE[params.etapa],
    assunto: desafioEsteirasCampanhaSubject(ETAPA_VARIANTE[params.etapa]),
  });
  if (!reserva.ok) throw new Error(reserva.motivo);

  try {
    return await executarDisparo(params);
  } catch (err) {
    await liberarEtapa(supabase, chave);
    throw err;
  }
}

async function executarDisparo(params: {
  etapa: EtapaDesafioEsteiras;
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
    throw new Error(`O banner não está publicado (${head.status}).`);
  }

  // Retentativa continua de onde parou em vez de reenviar para quem já recebeu.
  const servidos = await jaReceberam(supabase, { campanha: CAMPANHA, etapa, segmento });
  const destinatarios = (await destinatariosDaEtapa(etapa, segmento)).filter(
    (d) => !servidos.has(d.email.toLowerCase())
  );
  if (destinatarios.length === 0) {
    throw new Error(`Nenhum destinatário para a etapa ${etapa} de ${segmento}.`);
  }

  const variante = ETAPA_VARIANTE[etapa];
  const agora = new Date();
  // Um número só para o lote inteiro: é "vagas restantes agora, quando este
  // e-mail saiu", não recomputado por pessoa dentro do mesmo disparo.
  const vagasRestantes = await vagasRestantesAgora();
  const assunto = desafioEsteirasCampanhaSubject(variante, { agora, vagasRestantes });

  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(destinatarios, TAMANHO_LOTE)) {
    const itens: ItemLote[] = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderDesafioEsteirasCampanhaEmail({
        variante,
        nome: d.nome,
        vagasRestantes,
        agora,
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

    await espera(600);
  }

  if (sucesso.length === 0) {
    throw new Error(`Nenhum e-mail foi enviado (${falhas} falha(s)). Etapa não marcada como enviada.`);
  }

  const linhasDestinatarios = sucesso.map((d) => ({ campanha: CAMPANHA, etapa, segmento, email: d.email }));
  for (let i = 0; i < linhasDestinatarios.length; i += 500) {
    const { error } = await supabase
      .from("campanha_destinatarios")
      .upsert(linhasDestinatarios.slice(i, i + 500), {
        onConflict: "campanha,etapa,email",
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`campanha_destinatarios: ${error.message}`);
  }

  const agoraIso = new Date().toISOString();
  const { error: erroEtapa } = await supabase.from("campanha_etapas").upsert(
    {
      campanha: CAMPANHA,
      etapa,
      segmento,
      variante: campanhaRotulo(variante),
      assunto,
      agendado_para: agoraIso,
      enviado_em: agoraIso,
      status: "enviado",
      total_destinatarios: sucesso.length,
    },
    { onConflict: "campanha,etapa,segmento" }
  );
  if (erroEtapa) throw new Error(`campanha_etapas: ${erroEtapa.message}`);

  return { etapa, segmento, vagasRestantes, total: destinatarios.length, enviados: sucesso.length, falhas };
}

/* ── 5. Painel ───────────────────────────────────────────────────────────── */

export interface LinhaPainel {
  etapa: EtapaDesafioEsteiras;
  rotulo: string;
  segmento: SegmentoBase;
  assunto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  naoAbriram: number | null;
}

export interface Painel {
  campanha: string;
  vagasRestantes: number;
  base: { total: number; porSegmento: Record<string, number> };
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
}

export async function montarPainel(): Promise<Painel> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const [contatosRaw, descadastrados, vagasRestantes] = await Promise.all([
    paginar<{ email: string; segmento: string }>((de, ate) =>
      supabase.from("campanha_contatos").select("email, segmento").eq("campanha", CAMPANHA).range(de, ate)
    ),
    descadastradosGlobalmente(),
    vagasRestantesAgora(),
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
      const variante = ETAPA_VARIANTE[etapa];

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
        rotulo: campanhaRotulo(variante),
        segmento,
        assunto: reg?.assunto ?? desafioEsteirasCampanhaSubject(variante, { vagasRestantes }),
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
    vagasRestantes,
    base: { total: contatos.length, porSegmento },
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}
