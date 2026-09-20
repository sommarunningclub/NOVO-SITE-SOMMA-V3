import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { jaReceberam, liberarEtapa, reivindicarEtapa } from "@/lib/campanhas/claim";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { linkDescadastro, descadastradosGlobalmente } from "@/lib/campanhas/descadastro";
import {
  TAMANHO_LOTE,
  EMAIL_OK,
  espera,
  partir,
  paginar,
  enviarLoteComRetentativa,
  sincronizarBaseGenerica,
  type ItemLote,
  type ResumoSincronizacao,
} from "@/lib/campanhas/envio";
import { type SegmentoBase } from "@/lib/emails/evolve-fortalecimento";
import {
  EVENTO,
  VARIANTES,
  renderTalkRunEmail,
  talkRunSubject,
  type VarianteTalkRun,
} from "@/lib/emails/talk-run";

/**
 * Campanha da Talk Run 2026: um e-mail por dia, de 20/09 a 26/09, para a base
 * inteira. A prova é 27/09, então a régua termina na véspera.
 *
 * ┄ Por que a base inteira nas sete, e não só os engajados ┄
 * É diferente do Sunset Wine Run, e a diferença é deliberada, não descuido. Lá
 * as etapas do meio falavam só com quem tinha aberto algo antes, para poupar o
 * domínio. Aqui o pedido de quem opera a campanha foi explícito: as sete vão
 * para toda a base de `cadastro_site` + `checkins`, deduplicada.
 *
 * O custo disso é real e está registrado aqui para quem vier depois: sete
 * disparos em sete dias para uma base de milhares de endereços, num domínio que
 * também manda os transacionais do checkout, é volume alto o bastante para
 * mexer na reputação do remetente. O que sobra de proteção é o que já existe e
 * continua valendo em todas as etapas:
 *
 *   - `descadastros_globais` é refiltrado a cada etapa, não herdado da anterior,
 *     então quem pediu para sair na terça não recebe na quarta;
 *   - `List-Unsubscribe` com one-click em todo e-mail, exigência do Gmail e do
 *     Yahoo para remetente em volume;
 *   - `jaReceberam` impede que uma retentativa reenvie para quem já recebeu.
 *
 * Se a taxa de descadastro ou de reclamação subir no meio da régua, a saída é
 * cancelar os agendamentos que faltam no painel. Por isso as sete etapas ficam
 * agendadas e canceláveis uma a uma, em vez de saírem de um job só.
 *
 * ┄ Por que sete etapas e não uma repetida ┄
 * Cada etapa tem variante de copy e assunto próprios (ver lib/emails/talk-run.ts).
 * O Gmail agrupa mensagens de mesmo assunto e mesmo remetente numa conversa só:
 * sete e-mails iguais chegariam empilhados e fechados, e o quarto viraria motivo
 * de descadastro em vez de lembrete.
 */

export const CAMPANHA = "talk-run-set2026";

export type EtapaTalkRun = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const ETAPAS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Inclui `manual` para contato avulso (imprensa, parceiros) que não vem das
 *  duas tabelas da sincronização. Mesma escolha do Sunset Wine Run. */
export const SEGMENTOS: readonly SegmentoBase[] = ["cadastro-site", "checkins", "manual"] as const;

export const EVENTOS_DE_ENGAJAMENTO = ["opened", "clicked"] as const;

const TAG_CAMPANHA = "campanha";
const TAG_ETAPA = "etapa";
const TAG_SEGMENTO = "segmento";

/** A variante de copy de cada etapa. Etapa 1 é a primeira de VARIANTES. */
export function varianteDaEtapa(etapa: EtapaTalkRun): VarianteTalkRun {
  return VARIANTES[etapa - 1] ?? VARIANTES[0];
}

/* ── 0. O levantamento de disparo ─────────────────────────────────────────── */

export interface DiaDaRegua {
  etapa: EtapaTalkRun;
  variante: VarianteTalkRun;
  /** Hora de Brasília, no formato do input datetime-local. Ver agendamento.ts. */
  quando: string;
  /** Rótulo curto para o painel. */
  rotulo: string;
  /** Por que este e-mail existe e por que nesta ordem. Aparece no painel. */
  gancho: string;
}

/**
 * O calendário proposto, de hoje até a véspera. É daqui que o painel pré-enche
 * os campos de horário e que o botão "Agendar a régua inteira" trabalha.
 *
 * Os horários NÃO são lei: o painel deixa trocar linha a linha antes de
 * agendar, e reagendar uma etapa já marcada é uma operação normal. O que este
 * array garante é que o padrão seja um calendário pensado, e não sete campos
 * em branco que alguém preenche às pressas na noite do primeiro disparo.
 *
 * Critério dos horários:
 *
 *   - a etapa 1 sai às 21h de 20/09 porque a régua foi montada nesta noite e
 *     esperar até segunda custaria um dos sete dias de janela;
 *   - as etapas de dia útil saem 9h30, cedo o bastante para pegar a leitura da
 *     manhã e tarde o bastante para não competir com a fila do café;
 *   - a etapa 4 é a exceção, 18h30: ela fala de churrasquinho, Corona e festa
 *     de chegada, e esse argumento lê melhor no fim do dia do que às 9h30;
 *   - a véspera sai 9h no sábado, quando ainda dá tempo de a pessoa decidir,
 *     se inscrever e organizar o domingo.
 *
 * A data da largada vive em `EVENTO.dataISO` (lib/emails/talk-run.ts) e a
 * `assertCalendarioCoerente` abaixo garante que este calendário nunca
 * atravesse o dia da prova sem alguém perceber.
 */
export const CALENDARIO: readonly DiaDaRegua[] = [
  {
    etapa: 1,
    variante: "convite",
    quando: "2026-09-20T21:00",
    rotulo: "Etapa 1 · convite",
    gancho: "Apresenta o cupom SOMMA15 e a prova. Base inteira.",
  },
  {
    etapa: 2,
    variante: "lote",
    quando: "2026-09-21T09:30",
    rotulo: "Etapa 2 · o lote vai virar",
    gancho: "A única urgência real do briefing: quem deixa para depois paga mais caro.",
  },
  {
    etapa: 3,
    variante: "experiencia",
    quando: "2026-09-22T09:30",
    rotulo: "Etapa 3 · o que vem na inscrição",
    gancho: "Fotos grátis, película, cinto porta-número, medalha personalizada.",
  },
  {
    etapa: 4,
    variante: "pos-prova",
    quando: "2026-09-23T18:30",
    rotulo: "Etapa 4 · o pós-prova",
    gancho: "Churrasquinho, Corona e festa da chegada. Abre com o criativo oficial.",
  },
  {
    etapa: 5,
    variante: "distancias",
    quando: "2026-09-24T09:30",
    rotulo: "Etapa 5 · 2K, 5K ou 10K",
    gancho: "Desarma o \"10K é muito para mim\", que trava boa parte de quem não comprou.",
  },
  {
    etapa: 6,
    variante: "logistica",
    quando: "2026-09-25T09:30",
    rotulo: "Etapa 6 · como vai ser o dia",
    gancho: "Domingo, 10h, Brasília Shopping. Responde a pergunta prática antes de pedir a compra.",
  },
  {
    etapa: 7,
    variante: "vespera",
    quando: "2026-09-26T09:00",
    rotulo: "Etapa 7 · véspera",
    gancho: "É amanhã e é a última chance de usar o cupom.",
  },
] as const;

/**
 * Trava de sanidade do calendário, chamada pelo painel.
 *
 * Existe porque o erro mais fácil de cometer aqui é silencioso: alguém muda a
 * data do evento em `EVENTO.dataISO` e esquece do `CALENDARIO`, e a régua passa
 * a mandar "é amanhã" dois dias depois da prova ter acontecido. Devolve a lista
 * de problemas em português, vazia quando está tudo certo.
 */
export function problemasDoCalendario(): string[] {
  const problemas: string[] = [];
  const largada = new Date(EVENTO.dataISO);

  for (const dia of CALENDARIO) {
    const quando = new Date(`${dia.quando}:00-03:00`);
    if (Number.isNaN(quando.getTime())) {
      problemas.push(`Etapa ${dia.etapa}: horário "${dia.quando}" não é uma data válida.`);
      continue;
    }
    if (quando >= largada) {
      problemas.push(
        `Etapa ${dia.etapa} está marcada para ${dia.quando}, que é depois da largada (${EVENTO.dataExtenso}).`
      );
    }
    if (dia.variante !== varianteDaEtapa(dia.etapa)) {
      problemas.push(`Etapa ${dia.etapa}: o calendário diz "${dia.variante}" e a régua diz "${varianteDaEtapa(dia.etapa)}".`);
    }
  }
  return problemas;
}

/* ── 1. Sincronizar a base ───────────────────────────────────────────────── */

/**
 * Puxa `cadastro_site` + `checkins` para `campanha_contatos` sob esta campanha,
 * deduplicando por e-mail com precedência de `cadastro_site`. Ver
 * `sincronizarBaseGenerica` em lib/campanhas/envio.ts: a regra de dedup é a
 * mesma para toda campanha que fala com a base inteira, e é lá que ela mora.
 */
export async function sincronizarBase(): Promise<ResumoSincronizacao> {
  return sincronizarBaseGenerica(CAMPANHA);
}

/**
 * Contato avulso fora da sincronização automática (imprensa, parceiros).
 * `ignoreDuplicates: false` de propósito: se a pessoa já veio de
 * cadastro_site/checkins, a chamada não deve pisar no segmento real dela.
 */
export async function adicionarContatoManual(
  email: string,
  nome: string | null
): Promise<{ ok: boolean; motivo?: string }> {
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
 * Quem recebe cada etapa: a base inteira do segmento, menos quem descadastrou.
 *
 * Sem corte por engajamento em nenhuma das sete, ao contrário do Sunset Wine
 * Run. Ver o cabeçalho do arquivo: é decisão de quem opera a campanha, e o que
 * ela custa está documentado lá.
 *
 * O filtro de descadastro é REFEITO a cada etapa e não herdado da anterior:
 * entre um disparo e o do dia seguinte alguém pode ter pedido para sair, e a
 * lista de ontem não sabe disso. Numa régua diária isso não é detalhe, é a
 * diferença entre respeitar o descadastro em 24h ou em uma semana.
 */
export async function destinatarios(
  segmento: SegmentoBase,
  _etapa: EtapaTalkRun = 1
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

  return contatos.filter((c) => !descadastrados.has(c.email.toLowerCase()));
}

interface EtapaRegistro {
  etapa: EtapaTalkRun;
  segmento: SegmentoBase;
  assunto: string;
  enviado_em: string | null;
  agendado_para: string | null;
  status: "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";
  total_destinatarios: number;
}

/* ── 3. Disparar ──────────────────────────────────────────────────────────── */

export interface ResultadoDisparo {
  segmento: SegmentoBase;
  etapa: EtapaTalkRun;
  total: number;
  enviados: number;
  falhas: number;
}

export async function dispararCampanha(
  segmento: SegmentoBase,
  etapa: EtapaTalkRun = 1
): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  // Reserva atômica: fecha a janela entre conferir e marcar como enviado.
  const chave = { campanha: CAMPANHA, etapa, segmento };
  const variante = varianteDaEtapa(etapa);
  const reserva = await reivindicarEtapa(supabase, chave, {
    variante,
    assunto: talkRunSubject(variante),
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
  etapa: EtapaTalkRun
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
  if (alvo.length === 0) {
    throw new Error(`Nenhum destinatário para a etapa ${etapa} de ${segmento}.`);
  }

  const variante = varianteDaEtapa(etapa);
  /* Uma referência de tempo só para o disparo inteiro: sem isto, um envio que
     atravessasse a meia-noite mandaria "faltam 2 dias" para uns e "é amanhã"
     para outros dentro do mesmo lote. */
  const agora = new Date();
  const assunto = talkRunSubject(variante, agora);
  const sucesso: Destinatario[] = [];
  let falhas = 0;

  for (const lote of partir(alvo, TAMANHO_LOTE)) {
    const itens: ItemLote[] = lote.map((d) => {
      const descadastroUrl = linkDescadastro(d.email);
      const html = renderTalkRunEmail({ nome: d.nome, descadastroUrl, variante, agora });
      return {
        from,
        to: d.email,
        subject: assunto,
        html,
        headers: {
          "List-Unsubscribe": `<${descadastroUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        /* As três tags são obrigatórias: o webhook (app/api/webhooks/resend)
           só aceita um evento como "da régua" quando campanha, segmento e uma
           `etapa` inteira válida chegam juntas. Sem elas o Resend registra a
           abertura e `campanha_eventos` fica vazia, sem erro nenhum aparecer. */
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
  etapa: EtapaTalkRun;
  segmento: SegmentoBase;
  assunto: string;
  status: EtapaRegistro["status"] | "pendente";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  /** Quem recebeu e não abriu. Null se a etapa não foi enviada. */
  naoAbriram: number | null;
  /** Quando esta etapa está marcada para sair sozinha. */
  agendadoPara: string | null;
  /** O horário do CALENDARIO para esta etapa, para o painel pré-encher. */
  quandoPlanejado: string;
  /** Quantas pessoas estão na base deste segmento agora. */
  publico: number;
}

export interface Painel {
  campanha: string;
  evento: { nome: string; dataExtenso: string; local: string; largada: string; cupom: string; link: string };
  base: { total: number; porSegmento: Record<string, number> };
  calendario: DiaDaRegua[];
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
  problemasCalendario: string[];
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
    .select("etapa, segmento, assunto, enviado_em, agendado_para, status, total_destinatarios")
    .eq("campanha", CAMPANHA);
  if (error) throw new Error(`campanha_etapas: ${error.message}`);
  const etapas = (etapasRaw ?? []) as EtapaRegistro[];

  /* Uma consulta só de eventos para a campanha inteira, e não uma por linha do
     painel. São 7 etapas x 3 segmentos: 21 consultas paginadas a cada refresh
     deixariam o painel lento justamente no dia em que ele é mais usado. */
  const eventos = await paginar<{ tipo: string; email: string; etapa: number; segmento: string }>((de, ate) =>
    supabase
      .from("campanha_eventos")
      .select("tipo, email, etapa, segmento")
      .eq("campanha", CAMPANHA)
      .in("tipo", [...EVENTOS_DE_ENGAJAMENTO])
      .range(de, ate)
  );

  const linhas: LinhaPainel[] = [];
  for (const dia of CALENDARIO) {
    for (const segmento of SEGMENTOS) {
      const reg = etapas.find((e) => e.etapa === dia.etapa && e.segmento === segmento) ?? null;
      const doGrupo = eventos.filter((e) => e.etapa === dia.etapa && e.segmento === segmento);
      const aberturas = new Set(doGrupo.map((e) => e.email)).size;
      const cliques = new Set(doGrupo.filter((e) => e.tipo === "clicked").map((e) => e.email)).size;

      linhas.push({
        etapa: dia.etapa,
        segmento,
        assunto: reg?.assunto ?? talkRunSubject(dia.variante, new Date(`${dia.quando}:00-03:00`)),
        status: reg?.status ?? "pendente",
        enviadoEm: reg?.enviado_em ?? null,
        totalDestinatarios: reg?.total_destinatarios ?? 0,
        aberturas: reg?.status === "enviado" ? aberturas : 0,
        cliques: reg?.status === "enviado" ? cliques : 0,
        naoAbriram: reg?.status === "enviado" ? Math.max(0, (reg.total_destinatarios ?? 0) - aberturas) : null,
        agendadoPara: reg?.status === "agendado" ? (reg.agendado_para ?? null) : null,
        quandoPlanejado: dia.quando,
        publico: porSegmento[segmento] ?? 0,
      });
    }
  }

  return {
    campanha: CAMPANHA,
    evento: {
      nome: EVENTO.nome,
      dataExtenso: EVENTO.dataExtenso,
      local: EVENTO.local,
      largada: EVENTO.largada,
      cupom: EVENTO.cupom,
      link: EVENTO.linkInscricao,
    },
    base: { total: contatos.length, porSegmento },
    calendario: [...CALENDARIO],
    linhas,
    webhookConfigurado: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    problemasCalendario: problemasDoCalendario(),
  };
}
