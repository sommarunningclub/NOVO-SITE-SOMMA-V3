import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { EVENT_SLUG, TB } from "@/lib/o-longao/db";
import { generateCrewCode, generateCrewToken } from "@/lib/o-longao/codigo";
import { inscricaoSchema, type Atleta } from "@/lib/o-longao/schema";
import type { Categoria } from "@/lib/o-longao/config";
import { sendOLongaoInscricaoEmail } from "@/lib/emails/o-longao-inscricao";

export const dynamic = "force-dynamic";

/** Tentativas de sortear um `codigo` que não colida com um já existente. */
const MAX_CODE_TRIES = 5;

const CONSENTIMENTOS = ["regulamento", "imagem", "veracidade"] as const;

/** Mostra o suficiente para a pessoa reconhecer o CPF, sem expor o número. */
function mascararCpf(cpf: string): string {
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(9, 11)}`;
}

function logErro(contexto: string, err: unknown): void {
  console.error(`[o-longao] ${contexto}:`, err instanceof Error ? err.message : String(err));
}

/** Titulares e reservas de uma equipe, na ordem em que serão gravados. */
function linhasAtletas(
  equipe: { atletas: Atleta[]; reservas: Atleta[] },
  ids: { team_id: string; crew_id: string; event_id: string }
) {
  const monta = (a: Atleta, tipo: "titular" | "reserva", ordem: number) => ({
    ...ids,
    tipo,
    ordem,
    nome: a.nome,
    cpf: a.cpf,
    nascimento: a.nascimento,
    telefone: a.telefone,
    email: a.email,
    instagram: a.instagram || null,
    camiseta: a.camiseta,
    emergencia_nome: a.emergencia_nome,
    emergencia_telefone: a.emergencia_telefone,
  });

  return [
    ...equipe.atletas.map((a, i) => monta(a, "titular", i + 1)),
    ...equipe.reservas.map((a, i) => monta(a, "reserva", i + 1)),
  ];
}

export async function POST(request: NextRequest) {
  // 1. Freio de rajada: 5 tentativas por IP a cada 10 minutos.
  const ip = clientIp(request);
  const limite = await rateLimit(`lgo:inscricao:${ip}`, 5, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  // 2. Validação: a mesma do cliente, mas esta é a que vale.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = inscricaoSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: first?.message ?? "Dados inválidos.",
        campo: first?.path?.join(".") ?? null,
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 3. Honeypot preenchido é bot. Responde 200 sem gravar: dizer "não" ensinaria
  //    o robô a contornar o campo na próxima.
  if (data.website) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 4. Banco.
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  // 5. A edição existe e está aceitando inscrição?
  const { data: eventoRow, error: erroEvento } = await supabase
    .from(TB.events)
    .select("id, status")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  if (erroEvento) {
    logErro("consulta do evento", erroEvento);
    return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
  }

  const evento = eventoRow as { id: string; status: string } | null;
  if (!evento) {
    // A migration não rodou ou a edição foi removida. Não é erro da pessoa,
    // e o log precisa dizer qual é a edição faltando para não virar caça ao tesouro.
    console.error(`[o-longao] edição "${EVENT_SLUG}" não encontrada em ${TB.events}`);
    return NextResponse.json(
      { error: "As inscrições ainda não foram abertas. Tente novamente em instantes." },
      { status: 503 }
    );
  }
  if (evento.status !== "inscricoes_abertas") {
    return NextResponse.json({ error: "Inscrições encerradas." }, { status: 409 });
  }

  const event_id = evento.id;

  // 6. Uma crew por Instagram por edição. O índice único do banco é a garantia
  //    contra corrida; esta checagem existe pela mensagem clara.
  const { data: crewExistente, error: erroCrewExistente } = await supabase
    .from(TB.crews)
    .select("id")
    .eq("event_id", event_id)
    .eq("instagram", data.crew.instagram)
    .maybeSingle();

  if (erroCrewExistente) {
    logErro("checagem de crew duplicada", erroCrewExistente);
    return NextResponse.json({ error: "Não foi possível concluir a inscrição." }, { status: 500 });
  }
  if (crewExistente) {
    return NextResponse.json(
      { error: "Esta crew já tem inscrição nesta edição.", ja_inscrito: true },
      { status: 409 }
    );
  }

  // 7. Um CPF corre por uma única equipe na edição.
  const equipes: Array<[Categoria, { atletas: Atleta[]; reservas: Atleta[] }]> = [];
  if (data.equipes.masculino) equipes.push(["masculino", data.equipes.masculino]);
  if (data.equipes.feminino) equipes.push(["feminino", data.equipes.feminino]);

  const todosCpfs = equipes.flatMap(([, e]) => [...e.atletas, ...e.reservas].map((a) => a.cpf));

  const conflito409 = (cpfs: string[]) =>
    NextResponse.json(
      {
        error: "Um ou mais atletas já estão inscritos por outra crew.",
        cpfs_conflito: cpfs.map(mascararCpf),
      },
      { status: 409 }
    );

  if (todosCpfs.length > 0) {
    const { data: jaInscritos, error: erroCpfs } = await supabase
      .from(TB.athletes)
      .select("cpf")
      .eq("event_id", event_id)
      .in("cpf", todosCpfs);

    if (erroCpfs) {
      logErro("pré-checagem de CPFs", erroCpfs);
      return NextResponse.json({ error: "Não foi possível concluir a inscrição." }, { status: 500 });
    }

    const conflitos = (jaInscritos as { cpf: string }[] | null) ?? [];
    if (conflitos.length > 0) {
      return conflito409([...new Set(conflitos.map((c) => c.cpf))]);
    }
  }

  // 8. Cria a crew. O código é sorteado; se colidir com um já usado, sorteia de novo.
  const crewBase = {
    event_id,
    nome: data.crew.nome,
    instagram: data.crew.instagram,
    cidade: data.crew.cidade,
    crew_token: generateCrewToken(),
    responsavel_nome: data.responsavel.nome,
    responsavel_cpf: data.responsavel.cpf,
    responsavel_telefone: data.responsavel.telefone,
    responsavel_whatsapp: data.responsavel.whatsapp,
    responsavel_email: data.responsavel.email,
    capitao_nome: data.capitao.nome,
    capitao_telefone: data.capitao.telefone,
    capitao_email: data.capitao.email,
    origem: "lp-o-longao",
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
    utm_term: data.utm_term ?? null,
    utm_content: data.utm_content ?? null,
    referral: data.referral ?? null,
    metadata: { user_agent: userAgent },
  };

  let crew: { id: string; codigo: string; crew_token: string } | null = null;

  for (let tentativa = 0; tentativa < MAX_CODE_TRIES && !crew; tentativa++) {
    const codigo = generateCrewCode();
    const { data: inserida, error } = await supabase
      .from(TB.crews)
      .insert({ ...crewBase, codigo })
      .select("id, codigo, crew_token")
      .single();

    if (!error && inserida) {
      crew = inserida as { id: string; codigo: string; crew_token: string };
      break;
    }

    if (error?.code === "23505") {
      const detalhe = `${error.message} ${error.details ?? ""}`;
      if (detalhe.includes("codigo")) continue; // colisão de código: sorteia outro
      if (detalhe.includes("instagram")) {
        return NextResponse.json(
          { error: "Esta crew já tem inscrição nesta edição.", ja_inscrito: true },
          { status: 409 }
        );
      }
    }

    logErro("insert da crew", error);
    return NextResponse.json({ error: "Não foi possível concluir a inscrição." }, { status: 500 });
  }

  if (!crew) {
    return NextResponse.json(
      { error: "Não foi possível gerar o código da inscrição. Tente novamente." },
      { status: 500 }
    );
  }

  const crewId = crew.id;

  /**
   * Sem transação no PostgREST: o cascade da crew é o nosso rollback.
   *
   * Se o DELETE falhar, sobra uma crew sem atletas segurando o índice único de
   * `(event_id, instagram)`, e a próxima tentativa da mesma crew bate em "já
   * tem inscrição" sem que ninguém entenda por quê. O log precisa carregar
   * código e instagram para o operador achar e apagar a órfã pelo painel.
   */
  const desfazer = async () => {
    const { error } = await supabase.from(TB.crews).delete().eq("id", crewId);
    if (error) {
      console.error(
        `[o-longao] ROLLBACK FALHOU: crew órfã id=${crewId} codigo=${crew.codigo} instagram=@${data.crew.instagram}. ` +
          `Apague pelo painel para liberar a reinscrição. Causa: ${error.message}`
      );
    }
  };

  // 9. Equipes e atletas.
  const categorias: Categoria[] = [];

  for (const [categoria, equipe] of equipes) {
    const { data: timeRow, error: erroTime } = await supabase
      .from(TB.teams)
      .insert({ crew_id: crewId, event_id, categoria })
      .select()
      .single();

    if (erroTime || !timeRow) {
      logErro(`insert da equipe ${categoria}`, erroTime);
      await desfazer();
      return NextResponse.json({ error: "Não foi possível concluir a inscrição." }, { status: 500 });
    }

    const team_id = (timeRow as { id: string }).id;
    const { error: erroAtletas } = await supabase
      .from(TB.athletes)
      .insert(linhasAtletas(equipe, { team_id, crew_id: crewId, event_id }));

    if (erroAtletas) {
      await desfazer();
      // Alguém inscreveu o mesmo CPF entre a nossa checagem e este INSERT: o
      // índice único do banco é a única camada que enxerga todas as transações.
      if (erroAtletas.code === "23505" && `${erroAtletas.message} ${erroAtletas.details ?? ""}`.includes("cpf")) {
        /*
          Perguntamos ao banco QUAIS CPFs conflitam, em vez de devolver os 8 a
          20 da inscrição inteira. Devolver todos manda a pessoa procurar uma
          agulha no palheiro, com 5 tentativas por janela de rate limit.
          Se esta consulta falhar, aí sim não há o que fazer além da lista toda.
        */
        const { data: agora } = await supabase
          .from(TB.athletes)
          .select("cpf")
          .eq("event_id", event_id)
          .in("cpf", todosCpfs);
        const culpados = (agora as { cpf: string }[] | null)?.map((c) => c.cpf) ?? [];
        return conflito409([...new Set(culpados.length > 0 ? culpados : todosCpfs)]);
      }
      logErro(`insert dos atletas (${categoria})`, erroAtletas);
      return NextResponse.json({ error: "Não foi possível concluir a inscrição." }, { status: 500 });
    }

    categorias.push(categoria);
  }

  // 10. Aceites e trilha de auditoria. A inscrição já está de pé: falha aqui vai
  //     para o log, nunca derruba a vaga da crew.
  try {
    const { error: erroConsents } = await supabase.from(TB.consents).insert(
      CONSENTIMENTOS.map((tipo) => ({ crew_id: crewId, tipo, ip, user_agent: userAgent }))
    );
    if (erroConsents) logErro("registro dos aceites", erroConsents);

    const { error: erroAudit } = await supabase.from(TB.auditLogs).insert({
      event_id,
      ator: "sistema",
      acao: "inscricao_criada",
      alvo_tabela: TB.crews,
      alvo_id: crewId,
      payload: { codigo: crew.codigo, categorias },
    });
    if (erroAudit) logErro("registro de auditoria", erroAudit);
  } catch (err) {
    logErro("aceites/auditoria", err);
  }

  // 11. E-mail em fire-and-forget: a resposta não espera a Resend.
  void sendOLongaoInscricaoEmail({
    nome: data.responsavel.nome,
    email: data.responsavel.email,
    crew: data.crew.nome,
    codigo: crew.codigo,
    categorias,
  }).catch((err) => logErro("e-mail de inscrição", err));

  return NextResponse.json({
    ok: true,
    codigo: crew.codigo,
    crew_token: crew.crew_token,
    categorias,
  });
}
