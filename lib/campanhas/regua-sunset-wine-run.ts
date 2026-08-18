import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
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
} from "@/lib/emails/sunset-wine-run";

/**
 * Disparo do Sunset Wine Run: um envio só pra base inteira, não uma régua de
 * etapas como Evolve/Desafio das Esteiras. Não existe "quem não abriu" aqui
 * porque não há e-mail seguinte — por isso `campanha_etapas`/`campanha_eventos`
 * são usadas com `etapa` sempre 1, só para reaproveitar as mesmas tabelas e o
 * mesmo motor de envio (lib/campanhas/envio.ts) já testado nas outras duas.
 */

export const CAMPANHA = "sunset-wine-run-ago2026";
export const ETAPA = 1;

/** Inclui `manual`, ao contrário do SEGMENTOS das outras campanhas: é onde
 *  entra contato avulso (ex.: imprensa) que não vem de cadastro_site/checkins. */
export const SEGMENTOS: readonly SegmentoBase[] = ["cadastro-site", "checkins", "manual"] as const;

export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

const TAG_CAMPANHA = "campanha";
const TAG_SEGMENTO = "segmento";

interface EtapaRegistro {
  segmento: SegmentoBase;
  assunto: string;
  enviado_em: string | null;
  status: "rascunho" | "agendado" | "enviado" | "cancelado";
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

export async function destinatarios(segmento: SegmentoBase): Promise<Destinatario[]> {
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
  return contatos.filter((c) => !descadastrados.has(c.email.toLowerCase()));
}

async function buscarEtapa(supabase: SupabaseClient, segmento: SegmentoBase): Promise<EtapaRegistro | null> {
  const { data, error } = await supabase
    .from("campanha_etapas")
    .select("segmento, assunto, enviado_em, status, total_destinatarios")
    .eq("campanha", CAMPANHA)
    .eq("etapa", ETAPA)
    .eq("segmento", segmento)
    .maybeSingle();
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  return (data as EtapaRegistro | null) ?? null;
}

/* ── 3. Disparar ──────────────────────────────────────────────────────────── */

export interface ResultadoDisparo {
  segmento: SegmentoBase;
  total: number;
  enviados: number;
  falhas: number;
}

export async function dispararCampanha(segmento: SegmentoBase): Promise<ResultadoDisparo> {
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

  const jaExiste = await buscarEtapa(supabase, segmento);
  if (jaExiste && jaExiste.status !== "cancelado" && jaExiste.status !== "rascunho") {
    throw new Error(`O segmento ${segmento} já está em ${jaExiste.status}. Cancele antes de recriar.`);
  }

  const alvo = await destinatarios(segmento);
  if (alvo.length === 0) {
    throw new Error(`Nenhum destinatário para o segmento ${segmento}.`);
  }

  const assunto = sunsetWineRunSubject();
  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(alvo, TAMANHO_LOTE)) {
    const itens: ItemLote[] = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderSunsetWineRunEmail({ nome: d.nome, descadastroUrl });
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

  const linhasDestinatarios = sucesso.map((d) => ({ campanha: CAMPANHA, etapa: ETAPA, segmento, email: d.email }));
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
      etapa: ETAPA,
      segmento,
      variante: "único",
      assunto,
      agendado_para: agoraIso,
      enviado_em: agoraIso,
      status: "enviado",
      total_destinatarios: sucesso.length,
    },
    { onConflict: "campanha,etapa,segmento" }
  );
  if (erroEtapa) throw new Error(`campanha_etapas: ${erroEtapa.message}`);

  return { segmento, total: alvo.length, enviados: sucesso.length, falhas };
}

/* ── 4. Painel ───────────────────────────────────────────────────────────── */

export interface LinhaPainel {
  segmento: SegmentoBase;
  assunto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
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
    .select("segmento, assunto, enviado_em, status, total_destinatarios")
    .eq("campanha", CAMPANHA)
    .eq("etapa", ETAPA);
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  const etapas = (etapasRaw ?? []) as EtapaRegistro[];

  const linhas: LinhaPainel[] = [];
  for (const segmento of SEGMENTOS) {
    const reg = etapas.find((e) => e.segmento === segmento) ?? null;

    let aberturas = 0;
    let cliques = 0;
    if (reg?.status === "enviado") {
      const eventos = await paginar<{ tipo: string; email: string }>((de, ate) =>
        supabase
          .from("campanha_eventos")
          .select("tipo, email")
          .eq("campanha", CAMPANHA)
          .eq("etapa", ETAPA)
          .eq("segmento", segmento)
          .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
          .range(de, ate)
      );
      aberturas = new Set(eventos.map((e) => e.email)).size;
      cliques = new Set(eventos.filter((e) => e.tipo === "clicked").map((e) => e.email)).size;
    }

    linhas.push({
      segmento,
      assunto: reg?.assunto ?? sunsetWineRunSubject(),
      status: reg?.status ?? "pendente",
      enviadoEm: reg?.enviado_em ?? null,
      totalDestinatarios: reg?.total_destinatarios ?? 0,
      aberturas,
      cliques,
    });
  }

  return {
    campanha: CAMPANHA,
    linkPendente: EVENTO.linkIngresso === LINK_VENDAS_PENDENTE,
    base: { total: contatos.length, porSegmento },
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}
