import "server-only";
import { getServiceSupabase } from "@/lib/supabase";
import { EVENTO_SLUG, prazoTransferenciaPassou } from "./event.config";
import { pelotoesValidos, type EventoOperacional } from "./estado";
import type { Inscricao } from "./schema";
import { gerarTicketCode, gerarTicketToken } from "./ticket";
import {
  cpfsAnteriores,
  destinoDaTransferencia,
  parseTransferencias,
  transferenciaDestaOrigem,
} from "./transferencia";

/**
 * Persistência do Love Run, toda em estruturas que já existem no Somma:
 *
 * - `public.eventos` (slug `dexcomplica-love-run`): o evento. A gestão abre,
 *   fecha, define pelotões e vagas; o /check-in lista e manda para a LP.
 * - `public.inscrever_no_evento(...)`: cria/acha a pessoa em `cadastro_site`
 *   pelo CPF e grava a inscrição em `evento_participantes` NA MESMA transação,
 *   com teto de vagas sob advisory lock e unicidade (evento, pessoa).
 * - `public.checkins`: a lista que a gestão opera. Espelhada logo depois.
 *
 * Nada aqui roda no navegador: service role só no servidor.
 */

const TABELA = "evento_participantes";

export interface EventoRow extends EventoOperacional {
  id: string;
  titulo: string;
  slug: string | null;
  data_evento: string | null;
  horario_inicio: string | null;
}

export interface Participante {
  id: string;
  evento_id: string;
  pessoa_id: number;
  cpf: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  status: "inscrito" | "confirmado" | "presente" | "cancelado" | "no_show";
  ticket_code: string;
  ticket_token: string;
  pelotao: string | null;
  checkin_em: string | null;
  metadata: Record<string, unknown> | null;
  criado_em: string;
}

/** `select('*')` de propósito: funciona antes e depois da coluna `capacidade` existir. */
export async function getEvento(): Promise<EventoRow | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("eventos").select("*").eq("slug", EVENTO_SLUG).maybeSingle();
  if (error) {
    console.error("[love-run] Erro ao carregar evento:", error.message);
    return null;
  }
  return (data as EventoRow) ?? null;
}

/** Inscrições que ocupam vaga (mesma conta da trava da função no banco). */
export async function contarInscritos(eventoId: string): Promise<number> {
  const supabase = getServiceSupabase();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(TABELA)
    .select("id", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .neq("status", "cancelado");
  if (error) {
    console.error("[love-run] Erro ao contar inscritos:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getParticipacao(eventoId: string, cpf: string): Promise<Participante | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .eq("evento_id", eventoId)
    .eq("cpf", cpf)
    .neq("status", "cancelado")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Participante) ?? null;
}

export async function getParticipantePorToken(token: string): Promise<Participante | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABELA).select("*").eq("ticket_token", token).maybeSingle();
  if (error) {
    console.error("[love-run] Erro ao buscar ingresso:", error.message);
    return null;
  }
  return (data as Participante) ?? null;
}

export async function getEventoPorId(id: string): Promise<EventoRow | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("eventos").select("*").eq("id", id).maybeSingle();
  return (data as EventoRow) ?? null;
}

export async function getParticipantePorId(id: string): Promise<Participante | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABELA).select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[love-run] Erro ao buscar inscrição:", error.message);
    return null;
  }
  return (data as Participante) ?? null;
}

function cpfMascarado(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export type ReciboOrigem = {
  emailOrigem: string | null;
  paraNome: string;
  paraEmail: string | null;
};

/**
 * Quem já passou a vaga: a inscrição agora está no CPF do novo titular, mas
 * o CPF antigo ficou no histórico da metadata. E-mail de origem vem do
 * registro (transferências novas) ou do cadastro_site (as antigas só tinham CPF).
 */
export async function getTransferenciaPorCpfOrigem(eventoId: string, cpf: string): Promise<ReciboOrigem | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return null;
  const mascarado = cpfMascarado(d);

  const tentar = async (filtro: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from(TABELA)
      .select("nome_completo, email, metadata")
      .eq("evento_id", eventoId)
      .contains("metadata", filtro)
      .limit(1);
    if (error) {
      console.error("[love-run] Erro ao buscar transferência por origem:", error.message);
      return null;
    }
    return data?.[0] ?? null;
  };

  const linha =
    (await tentar({ cpfs_anteriores: [d] })) ||
    (await tentar({ transferencias: [{ cpf_origem: d }] })) ||
    (await tentar({ transferencias: [{ cpf_origem: mascarado }] }));
  if (!linha) return null;

  const lista = parseTransferencias(linha.metadata);
  const registro = transferenciaDestaOrigem(lista, d);
  if (!registro) return null;

  let emailOrigem = registro.email_origem ?? null;
  if (!emailOrigem) emailOrigem = await emailCadastroPorCpf(d);

  const destino = destinoDaTransferencia(
    registro,
    { nome: linha.nome_completo, email: linha.email },
    lista[lista.length - 1] === registro
  );

  return { emailOrigem, paraNome: destino.nome, paraEmail: destino.email };
}

async function emailCadastroPorCpf(cpf: string): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const d = cpf.replace(/\D/g, "");
  const { data, error } = await supabase
    .from("cadastro_site")
    .select("email")
    .in("cpf", [d, cpfMascarado(d)])
    .limit(1);
  if (error) {
    console.error("[love-run] Erro ao buscar e-mail do cadastro na transferência:", error.message);
    return null;
  }
  const email = (data?.[0]?.email ?? "").trim().toLowerCase();
  return email || null;
}

export type MotivoTransferencia =
  | "sem_banco"
  | "nao_encontrada"
  | "presente"
  | "cancelado"
  | "mesmo_cpf"
  | "destino_inscrito"
  | "prazo"
  | "pelotao"
  | "erro";

export type ResultadoTransferencia =
  | { ok: true; participante: Participante; anterior: { nome: string; cpf: string; email: string | null } }
  | { ok: false; motivo: MotivoTransferencia };

/**
 * Passa a vaga para outra pessoa. A inscrição é a MESMA linha: o teto de
 * vagas não se mexe (o evento está esgotado). O que muda de verdade:
 *  - o titular (pessoa, CPF, e-mail, telefone, sexo, pelotão);
 *  - o `ticket_token`, então o QR e o link antigos deixam de abrir.
 *
 * O `ticket_code` (DLR-XXXXXX) fica: é o que o balcão já tem na lista.
 */
export async function transferirIngresso(
  participacaoId: string,
  novo: Inscricao,
  evento: EventoRow
): Promise<ResultadoTransferencia> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, motivo: "sem_banco" };

  if (prazoTransferenciaPassou()) return { ok: false, motivo: "prazo" };

  const atual = await getParticipantePorId(participacaoId);
  if (!atual || atual.evento_id !== evento.id) return { ok: false, motivo: "nao_encontrada" };
  if (atual.status === "presente") return { ok: false, motivo: "presente" };
  if (atual.status === "cancelado") return { ok: false, motivo: "cancelado" };
  if (atual.cpf === novo.cpf) return { ok: false, motivo: "mesmo_cpf" };

  if (!pelotoesValidos(evento.pelotoes).includes(novo.pelotao)) {
    return { ok: false, motivo: "pelotao" };
  }

  const { data: destino, error: erroDestino } = await supabase
    .from(TABELA)
    .select("id")
    .eq("evento_id", evento.id)
    .eq("cpf", novo.cpf)
    .maybeSingle();
  if (erroDestino) {
    console.error("[love-run] Erro ao conferir destino:", erroDestino.message);
    return { ok: false, motivo: "erro" };
  }
  if (destino && destino.id !== atual.id) return { ok: false, motivo: "destino_inscrito" };

  const { data: pessoaId, error: erroPessoa } = await supabase.rpc("upsert_pessoa_por_cpf", {
    p_cpf: novo.cpf,
    p_nome: novo.nome,
    p_email: novo.email,
    p_whatsapp: novo.telefone,
    p_sexo: novo.sexo,
    p_nascimento: null,
    p_cep: null,
    p_atualizar: false,
  });
  if (erroPessoa || pessoaId == null) {
    console.error("[love-run] Erro ao upsert pessoa na transferência:", erroPessoa?.message);
    return { ok: false, motivo: "erro" };
  }

  const { data: conflitoPessoa } = await supabase
    .from(TABELA)
    .select("id")
    .eq("evento_id", evento.id)
    .eq("pessoa_id", pessoaId)
    .neq("id", atual.id)
    .maybeSingle();
  if (conflitoPessoa) return { ok: false, motivo: "destino_inscrito" };

  const metaAtual = atual.metadata && typeof atual.metadata === "object" ? atual.metadata : {};
  const historico = Array.isArray(metaAtual.transferencias) ? [...metaAtual.transferencias] : [];
  historico.push({
    em: new Date().toISOString(),
    cpf_origem: atual.cpf,
    email_origem: (atual.email ?? "").trim().toLowerCase() || null,
    nome_origem: atual.nome_completo,
    cpf_destino: novo.cpf,
    email_destino: novo.email,
    nome_destino: novo.nome,
  });
  const anteriores = [...cpfsAnteriores(metaAtual), atual.cpf.replace(/\D/g, "")].filter(
    (c, i, a) => c.length === 11 && a.indexOf(c) === i
  );

  const novoToken = gerarTicketToken();
  const { data: atualizado, error } = await supabase
    .from(TABELA)
    .update({
      pessoa_id: pessoaId,
      cpf: novo.cpf,
      nome_completo: novo.nome,
      email: novo.email,
      telefone: novo.telefone,
      pelotao: novo.pelotao,
      ticket_token: novoToken,
      metadata: {
        ...metaAtual,
        sexo: novo.sexo,
        marketing_optin: novo.marketing === true,
        transferencias: historico,
        cpfs_anteriores: anteriores,
      },
    })
    .eq("id", atual.id)
    .eq("ticket_token", atual.ticket_token)
    .in("status", ["inscrito", "confirmado"])
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return { ok: false, motivo: "destino_inscrito" };
    console.error("[love-run] Transferência falhou:", error.message);
    return { ok: false, motivo: "erro" };
  }
  if (!atualizado) {
    // Check-in bateu na mesma janela, ou o token já tinha virado.
    const deNovo = await getParticipantePorId(atual.id);
    if (deNovo?.status === "presente") return { ok: false, motivo: "presente" };
    return { ok: false, motivo: "nao_encontrada" };
  }

  const participante = atualizado as Participante;
  await atualizarCheckinTransferencia(evento, atual.cpf, {
    nome: novo.nome,
    email: novo.email,
    telefone: novo.telefone,
    cpf: novo.cpf,
    sexo: novo.sexo,
    pelotao: novo.pelotao,
  });

  return {
    ok: true,
    participante,
    anterior: { nome: atual.nome_completo, cpf: atual.cpf, email: atual.email },
  };
}

async function atualizarCheckinTransferencia(
  evento: EventoRow,
  cpfAntigo: string,
  novo: { nome: string; email: string; telefone: string; cpf: string; sexo: string; pelotao: string },
  opcoes: { manterValidacao?: boolean } = {}
): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  const antigo = cpfAntigo.replace(/\D/g, "");
  if (antigo.length !== 11) return;

  const { data: linhas, error: erroBusca } = await supabase
    .from("checkins")
    .select("id")
    .eq("evento_id", evento.id)
    .in("cpf", [antigo, cpfMascarado(antigo)]);
  if (erroBusca) {
    console.error("[love-run] Erro ao achar check-in da transferência:", erroBusca.message);
    return;
  }

  const payload = {
    nome_completo: novo.nome,
    email: novo.email,
    telefone: novo.telefone,
    cpf: novo.cpf,
    sexo: novo.sexo,
    pelotao: novo.pelotao,
    ...(opcoes.manterValidacao ? {} : { validacao_do_checkin: false }),
  };

  if (linhas && linhas.length > 0) {
    const { error } = await supabase
      .from("checkins")
      .update(payload)
      .in(
        "id",
        linhas.map((l) => l.id)
      );
    if (error) console.error("[love-run] Erro ao atualizar check-in na transferência:", error.message);
    return;
  }

  const { error } = await supabase.from("checkins").insert({
    ...payload,
    data_do_evento: evento.data_evento,
    nome_do_evento: evento.titulo ?? "",
    evento_id: evento.id,
    data_hora_checkin: new Date().toISOString(),
  });
  if (error) console.error("[love-run] Erro ao espelhar check-in na transferência:", error.message);
}

/* ─── Insider Connect: editar e desfazer a última transferência ─────────── */

export type MotivoAjusteTransferencia =
  | "sem_banco"
  | "nao_encontrada"
  | "nao_e_a_ultima"
  | "presente"
  | "cancelado"
  | "cpf_inscrito"
  | "sem_dados_origem"
  | "pelotao"
  | "erro";

export type ResultadoAjusteTransferencia =
  | { ok: true; participante: Participante; reenviarPara: string | null }
  | { ok: false; motivo: MotivoAjusteTransferencia };

/** `"<id da inscrição>:<posição no histórico>"`, como a lista do Insider monta. */
function lerIdTransferencia(id: string): { participacaoId: string; indice: number } | null {
  const m = /^([0-9a-f-]{36}):(\d+)$/i.exec(id.trim());
  return m ? { participacaoId: m[1], indice: Number(m[2]) } : null;
}

async function carregarUltimaTransferencia(id: string, evento: EventoRow) {
  const ref = lerIdTransferencia(id);
  if (!ref) return { erro: "nao_encontrada" as const };
  const atual = await getParticipantePorId(ref.participacaoId);
  if (!atual || atual.evento_id !== evento.id) return { erro: "nao_encontrada" as const };
  const meta = atual.metadata && typeof atual.metadata === "object" ? atual.metadata : {};
  const bruto = Array.isArray(meta.transferencias) ? [...(meta.transferencias as unknown[])] : [];
  if (!bruto.length || ref.indice >= bruto.length) return { erro: "nao_encontrada" as const };
  // Só a última mexe no titular atual; as anteriores já viraram história.
  if (ref.indice !== bruto.length - 1) return { erro: "nao_e_a_ultima" as const };
  const registro = parseTransferencias({ transferencias: [bruto[ref.indice]] })[0];
  if (!registro) return { erro: "nao_encontrada" as const };
  return { atual, meta, bruto, registro };
}

async function cpfJaInscritoEmOutra(evento: EventoRow, cpf: string, participacaoId: string): Promise<boolean | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABELA)
    .select("id")
    .eq("evento_id", evento.id)
    .eq("cpf", cpf)
    .neq("id", participacaoId)
    .limit(1);
  if (error) return null;
  return (data ?? []).length > 0;
}

/**
 * Desfaz a última transferência: a vaga volta para quem passou, com QR novo
 * (o de quem recebeu deixa de abrir) e a lista de check-in volta para ele. O
 * registro sai do histórico e vai para `transferencias_desfeitas`, com quem
 * desfez. O pelotão fica o atual: a transferência não guardava o antigo.
 * Nome, e-mail, WhatsApp e sexo de quem passou vêm do registro ou, nas
 * primeiras transferências (só CPF), do cadastro de pessoas.
 */
export async function desfazerTransferencia(
  id: string,
  evento: EventoRow,
  porQuem: string
): Promise<ResultadoAjusteTransferencia> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, motivo: "sem_banco" };
  const c = await carregarUltimaTransferencia(id, evento);
  if ("erro" in c) return { ok: false, motivo: c.erro! };
  const { atual, meta, bruto, registro } = c;
  if (atual.status === "presente") return { ok: false, motivo: "presente" };
  if (atual.status === "cancelado") return { ok: false, motivo: "cancelado" };

  const conflito = await cpfJaInscritoEmOutra(evento, registro.cpf_origem, atual.id);
  if (conflito === null) return { ok: false, motivo: "erro" };
  if (conflito) return { ok: false, motivo: "cpf_inscrito" };

  const { data: pessoa } = await supabase
    .from("cadastro_site")
    .select("id, nome_completo, email, whatsapp, sexo")
    .eq("cpf_digits", registro.cpf_origem)
    .maybeSingle();
  const nome = registro.nome_origem || pessoa?.nome_completo || "";
  const email = (registro.email_origem || pessoa?.email || "").trim().toLowerCase();
  if (!nome || !email || !pessoa?.id) return { ok: false, motivo: "sem_dados_origem" };
  const telefone = String(pessoa.whatsapp ?? "").trim() || null;
  const sexoCad = String(pessoa.sexo ?? "").trim().toLowerCase();
  const sexo = sexoCad.startsWith("f") ? "feminino" : sexoCad.startsWith("m") ? "masculino" : (meta.sexo as string) ?? null;

  const desfeitas = Array.isArray(meta.transferencias_desfeitas) ? [...(meta.transferencias_desfeitas as unknown[])] : [];
  desfeitas.push({ ...(bruto[bruto.length - 1] as object), desfeita_em: new Date().toISOString(), desfeita_por: porQuem });
  const historico = bruto.slice(0, -1);
  const anteriores = cpfsAnteriores({ cpfs_anteriores: meta.cpfs_anteriores, transferencias: historico }).filter(
    (cpf) => cpf !== registro.cpf_origem
  );

  const cpfAtual = atual.cpf;
  const { data: atualizado, error } = await supabase
    .from(TABELA)
    .update({
      pessoa_id: pessoa.id,
      cpf: registro.cpf_origem,
      nome_completo: nome,
      email,
      telefone,
      ticket_token: gerarTicketToken(),
      metadata: { ...meta, sexo, transferencias: historico, cpfs_anteriores: anteriores, transferencias_desfeitas: desfeitas },
    })
    .eq("id", atual.id)
    .eq("ticket_token", atual.ticket_token)
    .in("status", ["inscrito", "confirmado"])
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { ok: false, motivo: "cpf_inscrito" };
    console.error("[love-run] Desfazer transferência falhou:", error.message);
    return { ok: false, motivo: "erro" };
  }
  if (!atualizado) return { ok: false, motivo: "presente" };

  await atualizarCheckinTransferencia(evento, cpfAtual, {
    nome,
    email,
    telefone: telefone ?? "",
    cpf: registro.cpf_origem,
    sexo: sexo ?? "",
    pelotao: atual.pelotao ?? "",
  });
  return { ok: true, participante: atualizado as Participante, reenviarPara: email };
}

/**
 * Corrige os dados de quem recebeu a vaga (o titular atual) e o registro da
 * transferência. O QR não muda. Mudou o e-mail: o ingresso vai de novo para
 * o novo endereço. Vale também depois do check-in, sem desfazer a validação.
 */
export async function editarTitularTransferido(
  id: string,
  dados: Omit<Inscricao, "utm" | "marketing">,
  evento: EventoRow
): Promise<ResultadoAjusteTransferencia> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, motivo: "sem_banco" };
  const c = await carregarUltimaTransferencia(id, evento);
  if ("erro" in c) return { ok: false, motivo: c.erro! };
  const { atual, meta, bruto } = c;
  if (atual.status === "cancelado") return { ok: false, motivo: "cancelado" };
  if (!pelotoesValidos(evento.pelotoes).includes(dados.pelotao)) return { ok: false, motivo: "pelotao" };

  let pessoaId: number = atual.pessoa_id;
  if (dados.cpf !== atual.cpf) {
    const conflito = await cpfJaInscritoEmOutra(evento, dados.cpf, atual.id);
    if (conflito === null) return { ok: false, motivo: "erro" };
    if (conflito) return { ok: false, motivo: "cpf_inscrito" };
    const { data: novaPessoa, error: erroPessoa } = await supabase.rpc("upsert_pessoa_por_cpf", {
      p_cpf: dados.cpf,
      p_nome: dados.nome,
      p_email: dados.email,
      p_whatsapp: dados.telefone,
      p_sexo: dados.sexo,
      p_nascimento: null,
      p_cep: null,
      p_atualizar: false,
    });
    if (erroPessoa || novaPessoa == null) return { ok: false, motivo: "erro" };
    pessoaId = novaPessoa as number;
  }

  const historico = [...bruto];
  historico[historico.length - 1] = {
    ...(historico[historico.length - 1] as object),
    cpf_destino: dados.cpf,
    nome_destino: dados.nome,
    email_destino: dados.email,
    editada_em: new Date().toISOString(),
  };

  const { data: atualizado, error } = await supabase
    .from(TABELA)
    .update({
      pessoa_id: pessoaId,
      cpf: dados.cpf,
      nome_completo: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      pelotao: dados.pelotao,
      metadata: { ...meta, sexo: dados.sexo, transferencias: historico },
    })
    .eq("id", atual.id)
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { ok: false, motivo: "cpf_inscrito" };
    console.error("[love-run] Editar titular falhou:", error.message);
    return { ok: false, motivo: "erro" };
  }
  if (!atualizado) return { ok: false, motivo: "nao_encontrada" };

  await atualizarCheckinTransferencia(evento, atual.cpf, { ...dados }, { manterValidacao: true });
  const mudouEmail = (atual.email ?? "").trim().toLowerCase() !== dados.email;
  return { ok: true, participante: atualizado as Participante, reenviarPara: mudouEmail ? dados.email : null };
}

export type ResultadoInscricao =
  | { ok: true; participante: Participante; jaEstava: boolean }
  | { ok: false; motivo: "sem_banco" | "lotado" | "erro" };

/**
 * `opcoes.interno`: inscrição feita pela equipe em /check-in/interno. Fica
 * marcada no metadata e usa o teto que a rota calcula (`opcoes.capacidade`,
 * a cota do link) no lugar do teto público do evento.
 */
export async function inscrever(
  dados: Inscricao,
  evento: EventoRow,
  opcoes: { interno?: boolean; capacidade?: number | null } = {}
): Promise<ResultadoInscricao> {
  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, motivo: "sem_banco" };

  // Se a função devolver outro código, a inscrição já existia (corrida entre
  // dois envios simultâneos do mesmo CPF): a resposta é a mesma inscrição.
  const ticketNovo = gerarTicketCode();

  const { data, error } = await supabase.rpc("inscrever_no_evento", {
    p_evento_id: evento.id,
    p_cpf: dados.cpf,
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone,
    p_ticket_code: ticketNovo,
    p_ticket_token: gerarTicketToken(),
    p_sexo: dados.sexo,
    p_nascimento: null,
    p_pelotao: dados.pelotao,
    p_categoria: null,
    p_origem: "site",
    p_parceiro_slug: null,
    p_lote: null,
    p_utm: dados.utm ?? {},
    // `evento_participantes` não tem coluna de sexo: vai no metadata, e o
    // leitor da gestão usa daqui quando precisa criar a linha em `checkins`.
    p_metadata: {
      sexo: dados.sexo,
      marketing_optin: dados.marketing === true,
      lp: EVENTO_SLUG,
      ...(opcoes.interno ? { via: "check-in-interno" } : {}),
    },
    p_capacidade: opcoes.interno
      ? (opcoes.capacidade ?? null)
      : typeof evento.capacidade === "number"
        ? evento.capacidade
        : null,
    p_atualizar_cadastro: false,
  });

  if (error) {
    if (error.message?.includes("EVENTO_LOTADO")) return { ok: false, motivo: "lotado" };
    console.error("[love-run] Erro ao inscrever:", error.code, error.message);
    return { ok: false, motivo: "erro" };
  }

  const participante = (Array.isArray(data) ? data[0] : data) as Participante | null;
  if (!participante) return { ok: false, motivo: "erro" };

  // Só quem CRIOU a inscrição espelha. A função serializa o evento sob
  // advisory lock, então em envios simultâneos do mesmo CPF exatamente um
  // recebe o próprio código de volta; se todos espelhassem, a conferência
  // "já está na lista?" correria em paralelo e duplicaria a linha em
  // `checkins` (pego pelo teste de integração em 27/10/2026).
  const jaEstava = participante.ticket_code !== ticketNovo;
  if (!jaEstava) await espelharNoCheckin(participante, evento, dados.sexo);
  return { ok: true, participante, jaEstava };
}

/**
 * Copia a inscrição para `checkins`, a lista da gestão e do balcão.
 * Idempotente por CPF + evento (nas duas grafias, como o /api/checkin). Não
 * derruba a inscrição: se falhar, a gestão traz a pessoa sozinha ao abrir a
 * lista (sincronização do módulo Check-in).
 */
async function espelharNoCheckin(p: Participante, evento: EventoRow, sexo: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  const cpf = String(p.cpf ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) return;
  const mascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

  const { data: existente, error: erroBusca } = await supabase
    .from("checkins")
    .select("id")
    .eq("evento_id", evento.id)
    .in("cpf", [cpf, mascarado])
    .limit(1);
  if (erroBusca) {
    console.error("[love-run] Erro ao conferir lista de check-in:", erroBusca.message);
    return;
  }
  if (existente && existente.length > 0) return;

  const { error } = await supabase.from("checkins").insert({
    nome_completo: p.nome_completo,
    email: p.email,
    telefone: p.telefone,
    cpf,
    sexo,
    pelotao: p.pelotao,
    data_do_evento: evento.data_evento,
    nome_do_evento: evento.titulo ?? "",
    evento_id: evento.id,
    data_hora_checkin: p.criado_em,
    validacao_do_checkin: false,
  });
  if (error) console.error("[love-run] Erro ao espelhar no check-in:", error.message);
}
