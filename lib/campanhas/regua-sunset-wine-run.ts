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
import { EMAIL_OK } from "@/lib/campanhas/envio";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";
import {
  EVENTO,
  LINK_VENDAS_PENDENTE,
  renderSunsetWineRunEmail,
  sunsetWineRunSubject,
  type VarianteSwr,
} from "@/lib/emails/sunset-wine-run";

/**
 * Campanha do Sunset Wine Run, em duas etapas:
 *
 *   etapa 1  convite, para a base inteira de cada segmento
 *   etapa 2  última chamada, só para quem recebeu a 1 e não abriu
 *
 * Nasceu como disparo único (só a etapa 1) porque não havia e-mail seguinte. A
 * etapa 2 entrou quando o cupom SOMA10 chegou ao último dia (19/08) e o
 * fechamento passou a ter argumento próprio — o mesmo formato de régua que
 * Evolve e Desafio das Esteiras já usavam, com o motor compartilhado de
 * lib/campanhas/envio.ts.
 *
 * O "não abriu" é aproximação, não fato: pixel de abertura falha em cliente que
 * bloqueia imagem. Quem clicou também conta como engajado e sai da etapa 2 —
 * ver EVENTOS_DE_ENGAJAMENTO.
 */

export const CAMPANHA = "sunset-wine-run-ago2026";

export type EtapaSwr = 1 | 2;
export const ETAPAS = [1, 2] as const;

/** A variante de copy de cada etapa. Ver VarianteSwr em lib/emails. */
export function varianteDaEtapa(etapa: EtapaSwr): VarianteSwr {
  return etapa === 2 ? "ultima-chamada" : "convite";
}

/** Inclui `manual`, ao contrário do SEGMENTOS das outras campanhas: é onde
 *  entra contato avulso (ex.: imprensa) que não vem de cadastro_site/checkins. */
export const SEGMENTOS: readonly SegmentoBase[] = ["cadastro-site", "checkins", "manual"] as const;

export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

const TAG_CAMPANHA = "campanha";
const TAG_ETAPA = "etapa";
const TAG_SEGMENTO = "segmento";

interface EtapaRegistro {
  etapa: EtapaSwr;
  segmento: SegmentoBase;
  assunto: string;
  enviado_em: string | null;
  status: "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";
  total_destinatarios: number;
}

/* ── 1. Sincronizar a base ───────────────────────────────────────────────── */

export async function sincronizarBase(): Promise<ResumoSincronizacao> {
  return sincronizarBaseGenerica(CAMPANHA);
}

/**
 * Contato avulso fora da sincronização automática (imprensa, parceiros).
 * `ignoreDuplicates: false` aqui de propósito: se a pessoa já está na base
 * (veio de cadastro_site/checkins), a chamada não deve pisar em cima do
 * segmento real dela só porque alguém pediu para "incluir esse e-mail".
 */
export async function adicionarContatoManual(email: string, nome: string | null): Promise<{ ok: boolean; motivo?: string }> {
  const normalizado = email.trim().toLowerCase();
  if (!EMAIL_OK.test(normalizado)) return { ok: false, motivo: "E-mail inválido." };

  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: existente } = await supabase
    .from("campanha_contatos")
    .select("segmento")
    .eq("campanha", CAMPANHA)
    .eq("email", normalizado)
    .maybeSingle();
  if (existente) return { ok: false, motivo: `Já está na base, como "${existente.segmento}".` };

  const { error } = await supabase
    .from("campanha_contatos")
    .insert({ campanha: CAMPANHA, email: normalizado, nome, segmento: "manual" });
  if (error) throw new Error(`campanha_contatos: ${error.message}`);
  return { ok: true };
}

/* ── 2. Destinatários ─────────────────────────────────────────────────────── */

export interface Destinatario {
  email: string;
  nome: string | null;
}

/**
 * Etapa 1: a base do segmento, menos quem descadastrou.
 * Etapa 2: quem RECEBEU a etapa 1 e não gerou evento de engajamento nela.
 *
 * O filtro de descadastro é refeito aqui e não herdado da etapa 1: entre um
 * disparo e outro alguém pode ter pedido para sair, e a lista de ontem não sabe
 * disso.
 */
export async function destinatarios(
  segmento: SegmentoBase,
  etapa: EtapaSwr = 1
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

  const registro = await buscarEtapa(supabase, segmento, 1);
  if (!registro || registro.status !== "enviado") {
    throw new Error("A etapa 1 deste segmento ainda não foi disparada, então não há como saber quem não abriu.");
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
  segmento: SegmentoBase,
  etapa: EtapaSwr
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

/* ── 3. Disparar ──────────────────────────────────────────────────────────── */

export interface ResultadoDisparo {
  segmento: SegmentoBase;
  etapa: EtapaSwr;
  total: number;
  enviados: number;
  falhas: number;
}

export async function dispararCampanha(
  segmento: SegmentoBase,
  etapa: EtapaSwr = 1
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  // Reserva atômica: fecha a janela entre conferir e marcar como enviado.
  const chave = { campanha: CAMPANHA, etapa, segmento };
  const varianteReserva = varianteDaEtapa(etapa);
  const reserva = await reivindicarEtapa(supabase, chave, {
    variante: varianteReserva,
    assunto: sunsetWineRunSubject(varianteReserva),
  });
  if (!reserva.ok) throw new Error(reserva.motivo);

  try {
    return await executarDisparo(segmento, etapa);
  } catch (err) {
    await liberarEtapa(supabase, chave);
    throw err;
  }
}

async function executarDisparo(
  segmento: SegmentoBase,
  etapa: EtapaSwr
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!supabase) throw new Error("Supabase não configurado.");
  if (!resend || !from) throw new Error("Resend não configurado.");

  // Trava contra o placeholder: sem link real, o CTA do e-mail inteiro é um
  // link morto, e isso só se descobre depois de já ter saído pra base.
  if (EVENTO.linkIngresso === LINK_VENDAS_PENDENTE) {
    throw new Error(
      "Link de vendas ainda é o placeholder (LINK_VENDAS_PENDENTE). Atualize EVENTO.linkIngresso antes de disparar."
    );
  }

  // Retentativa continua de onde parou em vez de reenviar para quem já recebeu.
  const servidos = await jaReceberam(supabase, { campanha: CAMPANHA, etapa, segmento });
  const alvo = (await destinatarios(segmento, etapa)).filter(
    (d) => !servidos.has(d.email.toLowerCase())
  );
  if (alvo.length === 0) {
    throw new Error(`Nenhum destinatário para a etapa ${etapa} de ${segmento}.`);
  }

  const variante = varianteDaEtapa(etapa);
  /* Uma referência de tempo só para o disparo inteiro: sem isto, um envio que
     atravessasse a meia-noite mandaria "hoje, até 23h59" para uns e "até 19/08"
     para outros dentro do mesmo lote. */
  const agora = new Date();
  const assunto = sunsetWineRunSubject(variante);
  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(alvo, TAMANHO_LOTE)) {
    const itens: ItemLote[] = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderSunsetWineRunEmail({ nome: d.nome, descadastroUrl, variante, agora });
      return {
        from,
        to: d.email,
        subject: assunto,
        html,
        headers: {
          "List-Unsubscribe": `<${descadastroUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        // A tag `etapa` é obrigatória mesmo aqui não havendo régua de etapas:
        // o webhook (app/api/webhooks/resend/route.ts) só aceita um evento como
        // "da régua" se `etapa` for um inteiro válido — sem ela, o evento chega
        // mas é descartado em silêncio, e é exatamente o que aconteceu no
        // primeiro disparo (Resend confirma abertura, campanha_eventos não).
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

/* ── 4. Painel ───────────────────────────────────────────────────────────── */

export interface LinhaPainel {
  etapa: EtapaSwr;
  segmento: SegmentoBase;
  assunto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  /** Quem recebeu e não abriu — o alvo da etapa seguinte. Null se não enviada. */
  naoAbriram: number | null;
  /** Motivo de a etapa não poder ser disparada ainda, ou null se pode. */
  bloqueada: string | null;
}

export interface Painel {
  campanha: string;
  linkPendente: boolean;
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
    .select("etapa, segmento, assunto, enviado_em, status, total_destinatarios")
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

      const anterior = etapas.find((e) => e.etapa === 1 && e.segmento === segmento) ?? null;
      const bloqueada =
        etapa === 2 && anterior?.status !== "enviado"
          ? "Depende da etapa 1 deste segmento ter sido enviada."
          : null;

      linhas.push({
        etapa,
        segmento,
        assunto: reg?.assunto ?? sunsetWineRunSubject(varianteDaEtapa(etapa)),
        status: reg?.status ?? "pendente",
        enviadoEm: reg?.enviado_em ?? null,
        totalDestinatarios: reg?.total_destinatarios ?? 0,
        aberturas,
        cliques,
        naoAbriram: reg?.status === "enviado" ? Math.max(0, (reg.total_destinatarios ?? 0) - aberturas) : null,
        bloqueada,
      });
    }
  }

  return {
    campanha: CAMPANHA,
    linkPendente: EVENTO.linkIngresso === LINK_VENDAS_PENDENTE,
    base: { total: contatos.length, porSegmento },
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}
