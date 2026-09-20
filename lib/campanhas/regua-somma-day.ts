import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { jaReceberam, liberarEtapa, reivindicarEtapa } from "@/lib/campanhas/claim";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { linkDescadastro, descadastradosGlobalmente } from "@/lib/campanhas/descadastro";
import { isoDeBrasilia } from "@/lib/campanhas/agendamento";
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
import { DATA_ISO } from "@/lib/somma-day/event.config";
import {
  EMAIL_LOGO_URL,
  renderSommaDayCampanhaEmail,
  sommaDayRotulo,
  sommaDaySubject,
  type VarianteSommaDay,
} from "@/lib/emails/somma-day-campanha";

/**
 * Régua de convocação do SOMMA DAY, Edição Especial SET 2026 (26/09/2026).
 *
 * Mesmo motor das campanhas anteriores (lib/campanhas/envio.ts para lote, retry
 * e rate limit; claim.ts para a reserva atômica; agendamento.ts para a hora
 * marcada). O que é próprio desta campanha são três coisas: a base, o formato
 * da régua e o calendário.
 *
 * ┄ A base ┄
 * `cadastro_site` mais `checkins`, deduplicadas por e-mail, que é exatamente o
 * que `sincronizarBaseGenerica` já faz. Vale registrar o tamanho da sobreposição
 * porque ela surpreende: das 15.686 linhas somadas das duas tabelas, sobram
 * ~7,2 mil e-mails distintos. `checkins` guarda uma linha por PARTICIPAÇÃO, não
 * por pessoa, então quem foi a oito eventos aparece oito vezes; e quem faz
 * check-in quase sempre também está em `cadastro_site`. Sem a dedup, metade da
 * base receberia o mesmo e-mail duas vezes ou mais.
 *
 * ┄ O formato ┄
 *   etapa 1  convite            base inteira do segmento
 *   etapa 2  reforço            quem RECEBEU a 1 e não abriu nem clicou
 *   etapa 3  o dia inteiro      quem engajou em QUALQUER etapa anterior
 *   etapa 4  véspera            base inteira de novo
 *   etapa 5  última chamada     quem engajou em qualquer etapa anterior
 *
 * As etapas 3 e 5 falarem só com quem engajou é decisão de entregabilidade, não
 * de preguiça: cinco e-mails em seis dias para 7 mil endereços que abrem ~20% do
 * disparo é o caminho curto para o domínio cair em spam, e o domínio é o mesmo
 * do checkout e dos transacionais do site. A base inteira é chamada duas vezes,
 * no convite e na véspera; entre elas, só quem já disse que quer ouvir.
 *
 * ┄ O calendário ┄
 * Ver `AGENDAMENTO_SUGERIDO`. Ele existe para o painel poder oferecer a régua
 * inteira pronta, em vez de o operador digitar dez datas na mão na semana do
 * evento.
 */

export const CAMPANHA = "somma-day-set2026";

export type EtapaSommaDay = 1 | 2 | 3 | 4 | 5;
export const ETAPAS: readonly EtapaSommaDay[] = [1, 2, 3, 4, 5] as const;

/** Etapas que voltam a falar com a base inteira. Ver o cabeçalho. */
const ETAPAS_BASE_CHEIA: readonly EtapaSommaDay[] = [1, 4] as const;

/** Etapas que falam só com quem abriu ou clicou em alguma etapa anterior. */
const ETAPAS_ENGAJADOS: readonly EtapaSommaDay[] = [3, 5] as const;

export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

const TAG_CAMPANHA = "campanha";
const TAG_ETAPA = "etapa";
const TAG_SEGMENTO = "segmento";

const ETAPA_VARIANTE: Record<EtapaSommaDay, VarianteSommaDay> = {
  1: "convite",
  2: "reforco",
  3: "dia-inteiro",
  4: "vespera",
  5: "ultima-chamada",
};

export function varianteDaEtapa(etapa: EtapaSommaDay): VarianteSommaDay {
  return ETAPA_VARIANTE[etapa] ?? "convite";
}

/* ── 0. O calendário sugerido ────────────────────────────────────────────── */

/**
 * A régua com data e hora, de hoje até a véspera do evento.
 *
 * Formato do input `datetime-local`, hora de Brasília, convertido por
 * `isoDeBrasilia`. Isto é SUGESTÃO, não trava: o painel pré-preenche o campo
 * com estes valores e o operador muda o que quiser antes de confirmar. Nada
 * aqui dispara sozinho sem alguém ter clicado em agendar.
 *
 * ┄ Por que os dois segmentos não saem no mesmo minuto ┄
 * `reservarVencidas` recolhe TUDO que venceu numa varredura só, então dois
 * segmentos marcados para a mesma hora viram ~7 mil e-mails numa invocação de
 * função, perto demais do teto de 300s. Vinte minutos de intervalo garantem
 * duas varreduras distintas, cada uma com um segmento.
 *
 * ┄ Por que a etapa 5 é na sexta, e não no sábado de manhã ┄
 * O pedido foi explícito: disparos de hoje até UM DIA ANTES do evento. O evento
 * é sábado 26/09, então nada sai no dia. A última mensagem é a de sexta à
 * noite, com o despertador.
 */
export const AGENDAMENTO_SUGERIDO: Record<EtapaSommaDay, Record<string, string>> = {
  1: { "cadastro-site": "2026-09-20T21:30", checkins: "2026-09-20T21:50" },
  2: { "cadastro-site": "2026-09-22T19:00", checkins: "2026-09-22T19:20" },
  3: { "cadastro-site": "2026-09-24T12:00", checkins: "2026-09-24T12:20" },
  4: { "cadastro-site": "2026-09-25T09:00", checkins: "2026-09-25T09:20" },
  5: { "cadastro-site": "2026-09-25T19:00", checkins: "2026-09-25T19:20" },
};

/** A sugestão desta linha em ISO (UTC), ou null se a combinação não existir. */
export function sugestaoIso(etapa: EtapaSommaDay, segmento: string): string | null {
  const local = AGENDAMENTO_SUGERIDO[etapa]?.[segmento];
  return local ? isoDeBrasilia(local) : null;
}

/* ── 1. Sincronizar a base ───────────────────────────────────────────────── */

export async function sincronizarBase(): Promise<ResumoSincronizacao> {
  return sincronizarBaseGenerica(CAMPANHA);
}

/* ── 2. Quem recebe cada etapa ───────────────────────────────────────────── */

export interface Destinatario {
  email: string;
  nome: string | null;
}

interface EtapaRegistro {
  etapa: EtapaSommaDay;
  segmento: SegmentoBase;
  variante: string;
  assunto: string;
  agendado_para: string | null;
  enviado_em: string | null;
  status: "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";
  total_destinatarios: number;
}

const COLUNAS_ETAPA = "etapa, segmento, variante, assunto, agendado_para, enviado_em, status, total_destinatarios";

/**
 * O filtro de descadastro é refeito a cada etapa e não herdado da anterior:
 * entre um disparo e outro alguém pode ter pedido para sair, e a lista de ontem
 * não sabe disso.
 *
 * O engajamento das etapas 3 e 5 é ACUMULADO, não só da etapa imediatamente
 * anterior: quem abriu o convite no domingo e ignorou o reforço da terça segue
 * sendo alguém interessado no evento, e um público que só olha o último e-mail
 * encolheria a cada dia até sobrar quase ninguém.
 */
export async function destinatariosDaEtapa(
  etapa: EtapaSommaDay,
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

  if (ETAPAS_BASE_CHEIA.includes(etapa)) return daBase;

  if (ETAPAS_ENGAJADOS.includes(etapa)) {
    const anteriores = ETAPAS.filter((e) => e < etapa);
    const enviadas = await etapasEnviadas(supabase, segmento);
    if (!anteriores.some((e) => enviadas.has(e))) {
      throw new Error(
        `Nenhuma etapa anterior à ${etapa} foi disparada em ${segmento}, então não há engajamento para segmentar.`
      );
    }

    const engajados = await emailsQueEngajaram(supabase, segmento, anteriores);
    const alvo = daBase.filter((c) => engajados.has(c.email.toLowerCase()));
    if (alvo.length === 0) {
      throw new Error(
        `Ninguém em ${segmento} abriu ou clicou nas etapas anteriores. Sem público engajado para a etapa ${etapa}.`
      );
    }
    return alvo;
  }

  // Etapa 2: quem recebeu a 1 e não deu sinal de vida nela.
  const registro = await buscarEtapa(supabase, 1, segmento);
  if (!registro || registro.status !== "enviado") {
    throw new Error(
      `A etapa 1 de ${segmento} ainda não foi disparada, então não há como saber quem não abriu.`
    );
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

  const engajou = await emailsQueEngajaram(supabase, segmento, [1]);

  return daBase.filter((c) => {
    const email = c.email.toLowerCase();
    return recebeuEtapa1.has(email) && !engajou.has(email);
  });
}

/** Os e-mails que geraram abertura ou clique em qualquer uma das etapas dadas. */
async function emailsQueEngajaram(
  supabase: SupabaseClient,
  segmento: SegmentoBase,
  etapas: readonly EtapaSommaDay[]
): Promise<Set<string>> {
  const eventos = await paginar<{ email: string }>((de, ate) =>
    supabase
      .from("campanha_eventos")
      .select("email")
      .eq("campanha", CAMPANHA)
      .eq("segmento", segmento)
      .in("etapa", [...etapas])
      .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
      .range(de, ate)
  );
  return new Set(eventos.map((e) => e.email.toLowerCase()));
}

/** As etapas do segmento que já saíram, para saber se há histórico a segmentar. */
async function etapasEnviadas(supabase: SupabaseClient, segmento: SegmentoBase): Promise<Set<number>> {
  const { data, error } = await supabase
    .from("campanha_etapas")
    .select("etapa, status")
    .eq("campanha", CAMPANHA)
    .eq("segmento", segmento)
    .eq("status", "enviado");
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  return new Set((data ?? []).map((e) => (e as { etapa: number }).etapa));
}

async function buscarEtapa(
  supabase: SupabaseClient,
  etapa: EtapaSommaDay,
  segmento: SegmentoBase
): Promise<EtapaRegistro | null> {
  const { data, error } = await supabase
    .from("campanha_etapas")
    .select(COLUNAS_ETAPA)
    .eq("campanha", CAMPANHA)
    .eq("etapa", etapa)
    .eq("segmento", segmento)
    .maybeSingle();
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  return (data as EtapaRegistro | null) ?? null;
}

/* ── 3. Disparar ─────────────────────────────────────────────────────────── */

export interface ResultadoDisparo {
  etapa: EtapaSommaDay;
  segmento: SegmentoBase;
  total: number;
  enviados: number;
  falhas: number;
}

export async function dispararEtapa(
  etapa: EtapaSommaDay,
  segmento: SegmentoBase
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  // Reserva atômica antes de qualquer envio: dois cliques no botão ou um retry
  // do cron não podem mandar a mesma etapa duas vezes para a base.
  const chave = { campanha: CAMPANHA, etapa, segmento };
  const variante = varianteDaEtapa(etapa);
  const reserva = await reivindicarEtapa(supabase, chave, {
    variante: sommaDayRotulo(variante),
    assunto: sommaDaySubject(variante),
  });
  if (!reserva.ok) throw new Error(reserva.motivo);

  try {
    return await executarDisparo(etapa, segmento);
  } catch (err) {
    // Reserva é para impedir disparo duplo, não para trancar a etapa para
    // sempre: se nada saiu, o operador precisa poder tentar de novo.
    await liberarEtapa(supabase, chave);
    throw err;
  }
}

async function executarDisparo(
  etapa: EtapaSommaDay,
  segmento: SegmentoBase
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!supabase) throw new Error("Supabase não configurado.");
  if (!resend || !from) throw new Error("Resend não configurado.");

  /* O evento já passou? Não há campanha a disparar, e um "é amanhã" chegando
     depois do sábado é pior do que não chegar. A checagem é por data do evento,
     não por etapa: vale para retentativa de cron atrasado também. */
  if (new Date().toISOString().slice(0, 10) > DATA_ISO) {
    throw new Error(`O SOMMA DAY foi em ${DATA_ISO}. Não faz sentido disparar convocação depois do evento.`);
  }

  /* Imagem quebrada em e-mail de campanha só se descobre depois de ter saído
     para milhares de pessoas. Um HEAD custa 200ms e evita isso. */
  const head = await fetch(EMAIL_LOGO_URL, { method: "HEAD" });
  if (!head.ok || !(head.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new Error(
      `A logo do e-mail não está publicada (${head.status}). Faça o deploy de public/somma-day/email/logo.png antes de disparar.`
    );
  }

  // Uma tentativa anterior pode ter morrido no meio (timeout, lote com erro).
  // Quem já recebeu esta etapa fica de fora: retentativa continua, não reenvia.
  const servidos = await jaReceberam(supabase, { campanha: CAMPANHA, etapa, segmento });
  const alvo = (await destinatariosDaEtapa(etapa, segmento)).filter(
    (d) => !servidos.has(d.email.toLowerCase())
  );
  if (alvo.length === 0) {
    throw new Error(`Nenhum destinatário para a etapa ${etapa} de ${segmento}.`);
  }

  const variante = varianteDaEtapa(etapa);
  const assunto = sommaDaySubject(variante);
  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(alvo, TAMANHO_LOTE)) {
    const itens: ItemLote[] = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderSommaDayCampanhaEmail({ nome: d.nome, variante, descadastroUrl });
      return {
        from,
        to: d.email,
        subject: assunto,
        html,
        headers: {
          "List-Unsubscribe": `<${descadastroUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        /* As três tags são o que liga um evento do webhook a esta etapa. Sem
           `etapa`, o evento chega e é descartado em silêncio, e a etapa
           seguinte não tem como saber quem não abriu. */
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
      variante: sommaDayRotulo(variante),
      assunto,
      agendado_para: agoraIso,
      enviado_em: agoraIso,
      status: "enviado",
      total_destinatarios: sucesso.length,
    },
    { onConflict: "campanha,etapa,segmento" }
  );
  if (erroEtapa) throw new Error(`campanha_etapas: ${erroEtapa.message}`);

  return { etapa, segmento, total: alvo.length, enviados: sucesso.length, falhas };
}

/* ── 4. Painel ───────────────────────────────────────────────────────────── */

export interface LinhaPainel {
  etapa: EtapaSommaDay;
  rotulo: string;
  segmento: SegmentoBase;
  assunto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  /** Quem recebeu e não abriu, o alvo da etapa 2. Null se a etapa não saiu. */
  naoAbriram: number | null;
  /** Motivo de a etapa não poder ser disparada ainda, ou null se pode. */
  bloqueada: string | null;
  /** Quando esta etapa está marcada para sair sozinha. */
  agendadoPara: string | null;
  /** A hora que a régua propõe para esta linha. Ver AGENDAMENTO_SUGERIDO. */
  sugeridoPara: string | null;
}

export interface Painel {
  campanha: string;
  evento: { titulo: string; dataIso: string };
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
    .select(COLUNAS_ETAPA)
    .eq("campanha", CAMPANHA);
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  const etapas = (etapasRaw ?? []) as EtapaRegistro[];

  const linhas: LinhaPainel[] = [];
  for (const etapa of ETAPAS) {
    for (const segmento of SEGMENTOS) {
      const reg = etapas.find((e) => e.etapa === etapa && e.segmento === segmento) ?? null;
      const variante = varianteDaEtapa(etapa);

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

      /* O que impede o disparo desta linha hoje. A etapa 2 precisa da 1 para
         saber quem não abriu; as 3 e 5 precisam de alguma etapa anterior
         enviada para ter engajamento em que se apoiar. As 1 e 4 vão para a base
         inteira e nunca dependem de ninguém.

         Isto é aviso de painel, não trava de agendamento: agendar uma etapa
         bloqueada é permitido de propósito, porque na hora marcada a etapa
         anterior já vai ter saído. Quem recusa de verdade, se ainda assim não
         tiver saído, é `destinatariosDaEtapa` no momento do disparo. */
      const enviadasAntes = etapas.filter(
        (e) => e.segmento === segmento && e.etapa < etapa && e.status === "enviado"
      );
      let bloqueada: string | null = null;
      if (etapa === 2 && !enviadasAntes.some((e) => e.etapa === 1)) {
        bloqueada = "Depende da etapa 1 deste segmento ter sido enviada.";
      } else if (ETAPAS_ENGAJADOS.includes(etapa) && enviadasAntes.length === 0) {
        bloqueada = "Depende de alguma etapa anterior deste segmento ter sido enviada.";
      }

      linhas.push({
        etapa,
        rotulo: sommaDayRotulo(variante),
        segmento,
        assunto: reg?.assunto ?? sommaDaySubject(variante),
        status: reg?.status ?? "pendente",
        enviadoEm: reg?.enviado_em ?? null,
        totalDestinatarios: reg?.total_destinatarios ?? 0,
        aberturas,
        cliques,
        naoAbriram: reg?.status === "enviado" ? Math.max(0, (reg.total_destinatarios ?? 0) - aberturas) : null,
        bloqueada,
        agendadoPara: reg?.status === "agendado" ? (reg.agendado_para ?? null) : null,
        sugeridoPara: sugestaoIso(etapa, segmento),
      });
    }
  }

  return {
    campanha: CAMPANHA,
    evento: { titulo: "SOMMA DAY, Edição Especial SET 2026", dataIso: DATA_ISO },
    base: { total: contatos.length, porSegmento },
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}
