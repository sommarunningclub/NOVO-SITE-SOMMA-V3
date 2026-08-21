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
  ENCONTRO,
  renderSommaClubEncontroEmail,
  sommaClubEncontroSubject,
  type VarianteEncontro,
} from "@/lib/emails/somma-club-encontro";

/**
 * Encontro de domingo no Eixão, com três disparos no MESMO dia (sexta):
 *
 *   etapa 1  09h30  convite, base inteira
 *   etapa 2  16h00  reforço, só quem recebeu a 1 e não abriu
 *   etapa 3  19h30  véspera, base inteira de novo
 *
 * Segmento único, `checkins`: esta campanha fala com quem já apareceu num
 * evento do SOMMA, não com a base de cadastro do site. Por isso `SEGMENTOS`
 * aqui é uma lista de um item só, e não a lista das outras campanhas.
 *
 * Três etapas no mesmo dia é o que torna a IDEMPOTÊNCIA obrigatória e não um
 * luxo: o gatilho é um cron, cron repete, e um retry às 16h01 não pode mandar
 * o mesmo e-mail duas vezes para a base. Quem garante isso é
 * `campanha_etapas.status`, checado em `dispararCampanha` antes de montar
 * qualquer lote.
 *
 * A etapa 3 vai para a base inteira DE NOVO, inclusive para quem já abriu as
 * duas anteriores, e isso é deliberado: é o lembrete de véspera, o único
 * momento em que o e-mail vale para quem já decidiu ir. Só o descadastro
 * global corta alguém dela.
 */

export const CAMPANHA = "encontro-eixao-ago2026";

export type EtapaEncontro = 1 | 2 | 3;
export const ETAPAS = [1, 2, 3] as const;

/** Só `checkins`: ver o comentário do topo. */
export const SEGMENTOS = ["checkins"] as const;
export type SegmentoEncontro = (typeof SEGMENTOS)[number];

export function varianteDaEtapa(etapa: EtapaEncontro): VarianteEncontro {
  if (etapa === 2) return "reforco";
  if (etapa === 3) return "vespera";
  return "convite";
}

export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

const TAG_CAMPANHA = "campanha";
const TAG_ETAPA = "etapa";
const TAG_SEGMENTO = "segmento";

interface EtapaRegistro {
  etapa: EtapaEncontro;
  segmento: SegmentoEncontro;
  assunto: string;
  enviado_em: string | null;
  status: "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";
  total_destinatarios: number;
}

export async function sincronizarBase(): Promise<ResumoSincronizacao> {
  return sincronizarBaseGenerica(CAMPANHA);
}

export interface Destinatario {
  email: string;
  nome: string | null;
}

/**
 * Etapas 1 e 3: a base do segmento, menos quem descadastrou.
 * Etapa 2: quem RECEBEU a etapa 1 e não gerou evento de engajamento nela.
 *
 * O "não abriu" é aproximação: pixel de abertura falha em cliente que bloqueia
 * imagem, então alguém que leu pode receber o reforço. Quem clicou também conta
 * como engajado e sai da etapa 2.
 *
 * O filtro de descadastro é refeito em cada etapa e não herdado da anterior:
 * entre as 09h30 e as 19h30 alguém pode pedir para sair, e a lista da manhã não
 * sabe disso.
 */
export async function destinatarios(
  segmento: SegmentoEncontro = "checkins",
  etapa: EtapaEncontro = 1
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
  if (etapa !== 2) return daBase;

  const registro = await buscarEtapa(supabase, segmento, 1);
  if (!registro || registro.status !== "enviado") {
    throw new Error("A etapa 1 ainda não foi disparada, então não há como saber quem não abriu.");
  }

  const recebeuEtapa1 = new Set(
    (
      await paginar<{ email: string }>((de, ate) =>
        supabase
          .from("campanha_destinatarios")
          .select("email")
          .eq("campanha", CAMPANHA)
          .eq("etapa", 1)
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
          .eq("etapa", 1)
          .eq("segmento", segmento)
          .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
          .range(de, ate)
      )
    ).map((r) => r.email.toLowerCase())
  );

  return daBase.filter((c) => {
    const email = c.email.toLowerCase();
    return recebeuEtapa1.has(email) && !engajou.has(email);
  });
}

async function buscarEtapa(
  supabase: SupabaseClient,
  segmento: SegmentoEncontro,
  etapa: EtapaEncontro
): Promise<EtapaRegistro | null> {
  const { data, error } = await supabase
    .from("campanha_etapas")
    .select("etapa, segmento, assunto, enviado_em, status, total_destinatarios")
    .eq("campanha", CAMPANHA)
    .eq("etapa", etapa)
    .eq("segmento", segmento)
    .maybeSingle();
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  return (data as EtapaRegistro | null) ?? null;
}

export interface ResultadoDisparo {
  segmento: SegmentoEncontro;
  etapa: EtapaEncontro;
  total: number;
  enviados: number;
  falhas: number;
}

export async function dispararCampanha(
  etapa: EtapaEncontro = 1,
  segmento: SegmentoEncontro = "checkins"
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  /* A trava de idempotência. O gatilho é um cron e cron repete: sem isto, uma
     segunda chamada da mesma etapa mandaria o e-mail de novo para a base
     inteira. A reserva é uma escrita atômica, não uma leitura seguida de
     escrita — o `SELECT` de antes deixava uma janela de até 5 minutos entre
     conferir e marcar, tempo de sobra para dois disparos passarem juntos. */
  const chave = { campanha: CAMPANHA, etapa, segmento };
  const varianteReserva = varianteDaEtapa(etapa);
  const reserva = await reivindicarEtapa(supabase, chave, {
    variante: varianteReserva,
    assunto: sommaClubEncontroSubject(varianteReserva),
  });
  if (!reserva.ok) throw new Error(reserva.motivo);

  try {
    return await executarDisparo(etapa, segmento);
  } catch (err) {
    await liberarEtapa(supabase, chave);
    throw err;
  }
}

async function executarDisparo(
  etapa: EtapaEncontro,
  segmento: SegmentoEncontro
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!supabase) throw new Error("Supabase não configurado.");
  if (!resend || !from) throw new Error("Resend não configurado.");

  // Retentativa continua de onde parou em vez de reenviar para quem já recebeu.
  const servidos = await jaReceberam(supabase, { campanha: CAMPANHA, etapa, segmento });
  const alvo = (await destinatarios(segmento, etapa)).filter(
    (d) => !servidos.has(d.email.toLowerCase())
  );
  if (alvo.length === 0) throw new Error(`Nenhum destinatário para a etapa ${etapa}.`);

  const variante = varianteDaEtapa(etapa);
  const assunto = sommaClubEncontroSubject(variante);
  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(alvo, TAMANHO_LOTE)) {
    const itens: ItemLote[] = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderSommaClubEncontroEmail({
        nome: d.nome,
        descadastroUrl,
        variante,
        utm: `utm_source=email&utm_medium=campanha&utm_campaign=${CAMPANHA}&utm_content=etapa-${etapa}`,
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
        // `etapa` precisa ser inteiro: o webhook da Resend descarta em silêncio
        // o evento cuja tag `etapa` não parseia, e sem ela a etapa 2 não sabe
        // quem abriu a 1.
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
    throw new Error(`Nenhum e-mail foi enviado (${falhas} falha(s)). Não marcado como enviado.`);
  }

  const linhas = sucesso.map((d) => ({ campanha: CAMPANHA, etapa, segmento, email: d.email }));
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await supabase
      .from("campanha_destinatarios")
      .upsert(linhas.slice(i, i + 500), { onConflict: "campanha,etapa,email", ignoreDuplicates: true });
    if (error) throw new Error(`campanha_destinatarios: ${error.message}`);
  }

  const agoraIso = new Date().toISOString();
  const { error: erroEtapa } = await supabase.from("campanha_etapas").upsert(
    {
      campanha: CAMPANHA,
      etapa,
      segmento,
      variante,
      assunto,
      agendado_para: agoraIso,
      enviado_em: agoraIso,
      status: "enviado",
      total_destinatarios: sucesso.length,
    },
    { onConflict: "campanha,etapa,segmento" }
  );
  if (erroEtapa) throw new Error(`campanha_etapas: ${erroEtapa.message}`);

  return { segmento, etapa, total: alvo.length, enviados: sucesso.length, falhas };
}

/* ── Painel ──────────────────────────────────────────────────────────────── */

export interface LinhaPainel {
  etapa: EtapaEncontro;
  assunto: string;
  horarioPrevisto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  naoAbriram: number | null;
  bloqueada: string | null;
}

/** Só rótulo de painel. O horário que vale de verdade é o do cron. */
export const HORARIO_PREVISTO: Record<EtapaEncontro, string> = {
  1: "09h30",
  2: "16h00",
  3: "19h30",
};

export interface Painel {
  campanha: string;
  encontro: { dataExtenso: string; horario: string; local: string };
  base: { total: number };
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
}

export async function montarPainel(): Promise<Painel> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");
  const segmento: SegmentoEncontro = "checkins";

  const [contatosRaw, descadastrados] = await Promise.all([
    paginar<{ email: string; segmento: string }>((de, ate) =>
      supabase.from("campanha_contatos").select("email, segmento").eq("campanha", CAMPANHA).range(de, ate)
    ),
    descadastradosGlobalmente(),
  ]);
  const contatos = contatosRaw.filter(
    (c) => c.segmento === segmento && !descadastrados.has(c.email.toLowerCase())
  );

  const { data: etapasRaw, error } = await supabase
    .from("campanha_etapas")
    .select("etapa, segmento, assunto, enviado_em, status, total_destinatarios")
    .eq("campanha", CAMPANHA);
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  const etapas = (etapasRaw ?? []) as EtapaRegistro[];

  const linhas: LinhaPainel[] = [];
  for (const etapa of ETAPAS) {
    const reg = etapas.find((e) => e.etapa === etapa) ?? null;
    let aberturas = 0;
    let cliques = 0;
    if (reg?.status === "enviado") {
      const eventos = await paginar<{ tipo: string; email: string }>((de, ate) =>
        supabase
          .from("campanha_eventos")
          .select("tipo, email")
          .eq("campanha", CAMPANHA)
          .eq("etapa", etapa)
          .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
          .range(de, ate)
      );
      aberturas = new Set(eventos.map((e) => e.email)).size;
      cliques = new Set(eventos.filter((e) => e.tipo === "clicked").map((e) => e.email)).size;
    }

    const primeira = etapas.find((e) => e.etapa === 1) ?? null;
    linhas.push({
      etapa,
      assunto: reg?.assunto ?? sommaClubEncontroSubject(varianteDaEtapa(etapa)),
      horarioPrevisto: HORARIO_PREVISTO[etapa],
      status: reg?.status ?? "pendente",
      enviadoEm: reg?.enviado_em ?? null,
      totalDestinatarios: reg?.total_destinatarios ?? 0,
      aberturas,
      cliques,
      naoAbriram: reg?.status === "enviado" ? Math.max(0, (reg.total_destinatarios ?? 0) - aberturas) : null,
      bloqueada: etapa === 2 && primeira?.status !== "enviado" ? "Depende da etapa 1 ter sido enviada." : null,
    });
  }

  return {
    campanha: CAMPANHA,
    encontro: { dataExtenso: ENCONTRO.dataExtenso, horario: ENCONTRO.horario, local: `${ENCONTRO.local} ${ENCONTRO.localDetalhe}` },
    base: { total: contatos.length },
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}
