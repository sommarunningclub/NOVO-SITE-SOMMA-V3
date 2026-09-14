import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { envioSchema } from "@/lib/assessoria-nps/schema";
import { prepararRespostas, professorPeloNome } from "@/lib/assessoria-nps/logic";
import { SURVEY_VERSION, type ContextoPesquisa } from "@/lib/assessoria-nps/survey";
import { capitalizarNome, erroNoNome, normalizarParaBusca } from "@/lib/assessoria-nps/nome";
import {
  CONVITE_COOKIE,
  buscarCampanhaPorSlug,
  buscarConvite,
  identificarAlunoPorNome,
  inserirResposta,
  type AlunoIdentificado,
} from "@/lib/assessoria-nps/db";

export const dynamic = "force-dynamic";

/** 41 perguntas com as abertas cheias cabem com folga em 64 KB. */
const LIMITE_BYTES = 64 * 1024;
/** Mais que isso não é tempo de preenchimento, é rascunho esquecido: não distorce a média. */
const DURACAO_MAX_MS = 60 * 24 * 60 * 60 * 1000;

function responder(status: number, corpo: Record<string, unknown>) {
  return NextResponse.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/** Só a categoria do aparelho. O user agent em si não é guardado. */
function tipoDeAparelho(request: NextRequest): "mobile" | "tablet" | "desktop" | null {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua) return null;
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (request.headers.get("sec-ch-ua-mobile") === "?1" || /Mobi|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

function slug(v: string | undefined): string | null {
  if (!v) return null;
  const s = v
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return s || null;
}

function utm(v: string | undefined): string | null {
  const s = v?.trim().slice(0, 160);
  return s ? s : null;
}

/** A chave veio no JSON bruto? (o zod não diferencia chave ausente de valor nulo) */
function campoEnviado(corpo: unknown, campo: string): boolean {
  const answers = (corpo as { answers?: unknown } | null)?.answers;
  return typeof answers === "object" && answers !== null && campo in answers;
}

export async function POST(request: NextRequest) {
  // 1. Freio de rajada. Folgado de propósito: alunos respondendo juntos no
  //    domingo podem sair pelo mesmo IP da operadora.
  const limite = await rateLimit(`nps-assessoria:envio:${clientIp(request)}`, 20, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds), "Cache-Control": "no-store" } }
    );
  }

  // 2. Corpo: tamanho, JSON e forma. A validação do navegador não vale aqui.
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > LIMITE_BYTES) return responder(413, { error: "Respostas grandes demais para enviar." });

  let corpo: unknown;
  try {
    const bruto = await request.text();
    if (bruto.length > LIMITE_BYTES) return responder(413, { error: "Respostas grandes demais para enviar." });
    corpo = JSON.parse(bruto);
  } catch {
    return responder(400, { error: "Não conseguimos ler o envio. Tente de novo." });
  }

  const parsed = envioSchema.safeParse(corpo);
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    const campo = primeiro?.path?.[0] === "answers" ? primeiro.path[1] : primeiro?.path?.[0];
    return responder(400, {
      error: "Alguma resposta chegou num formato inesperado. Confira e tente de novo.",
      campo: typeof campo === "string" ? campo : null,
    });
  }
  const envio = parsed.data;

  // Honeypot: responde sucesso sem gravar. Recusar ensinaria o robô.
  if (envio.website) return responder(201, { ok: true });

  // 3. Versão do questionário: bundle antigo aberto numa aba não grava
  //    resposta de pergunta que mudou.
  if (envio.survey_version !== SURVEY_VERSION) {
    return responder(409, {
      error: "A pesquisa foi atualizada. Recarregue a página para continuar.",
      code: "version_mismatch",
    });
  }

  // 4. Identificação.
  const erroNome = erroNoNome(envio.first_name, "first_name");
  if (erroNome) return responder(400, { error: erroNome, campo: "first_name" });
  const erroSobrenome = erroNoNome(envio.last_name, "last_name");
  if (erroSobrenome) return responder(400, { error: erroSobrenome, campo: "last_name" });
  const firstName = capitalizarNome(envio.first_name);
  const lastName = capitalizarNome(envio.last_name);

  // 5. Banco. A rodada é a do envio (o slug que a página recebeu), e ela
  //    precisa estar no ar agora: fechar a janela no painel fecha o envio.
  const sb = getServiceSupabase();
  if (!sb) return responder(503, { error: "A pesquisa está indisponível agora. Tente de novo em alguns minutos." });

  const busca = await buscarCampanhaPorSlug(sb, envio.campaign);
  if (busca.status === "indisponivel") {
    return responder(503, { error: "Não conseguimos registrar agora. Suas respostas continuam salvas neste aparelho." });
  }
  if (busca.status === "agendada") {
    return responder(410, { error: "Esta pesquisa ainda não abriu.", code: "closed" });
  }
  if (busca.status !== "ok") {
    return responder(410, { error: "Esta rodada da pesquisa foi encerrada.", code: "closed" });
  }
  const campanha = busca.campanha;
  if (campanha.survey_version !== SURVEY_VERSION) {
    console.error("[assessoria-nps] rodada com survey_version diferente do código:", campanha.slug);
    return responder(503, { error: "A pesquisa está em manutenção. Tente de novo em alguns minutos." });
  }

  // 6. Quem respondeu: link pessoal da rodada (cookie) > nome inequívoco > só o nome.
  let identificacao: {
    identification_method: "invite" | "name_match" | "self_declared";
    invite_id: string | null;
    aluno: AlunoIdentificado | null;
  } = { identification_method: "self_declared", invite_id: null, aluno: null };

  const convite =
    envio.use_invite === false ? null : await buscarConvite(sb, request.cookies.get(CONVITE_COOKIE)?.value);

  if (convite && convite.campaign_id === campanha.id) {
    identificacao = {
      identification_method: "invite",
      invite_id: convite.id,
      aluno: {
        student_asaas_id: convite.student_asaas_id,
        professor_id: convite.professor_id,
        professor_name: convite.professor_name,
      },
    };
  } else {
    const aluno = await identificarAlunoPorNome(sb, `${firstName} ${lastName}`);
    if (aluno) identificacao = { identification_method: "name_match", invite_id: null, aluno };
  }

  // 7. Regras condicionais: obrigatória quando exibida, escondida vira NULL.
  //    O professor do link pessoal decide se "Quem é o seu professor?" aparece,
  //    com a mesma regra que a página usou ao abrir.
  const contexto: ContextoPesquisa = {
    professorDoConvite:
      identificacao.identification_method === "invite" ? professorPeloNome(identificacao.aluno?.professor_name) : null,
  };
  const preparo = prepararRespostas(envio.answers, contexto);
  if (!preparo.ok) {
    // O campo nem veio: aba aberta antes de a pergunta existir, ou convite que
    // sumiu no meio do caminho. Recarregar mostra a pergunta e mantém o rascunho.
    if (preparo.erro.field === "declared_professor" && !campoEnviado(corpo, "declared_professor")) {
      return responder(409, {
        error: "A pesquisa foi atualizada. Recarregue a página para continuar.",
        code: "version_mismatch",
      });
    }
    return responder(400, { error: preparo.erro.message, campo: preparo.erro.field });
  }

  // 8. Tempo de preenchimento ancorado no relógio do servidor: relógio errado
  //    no celular não produz started_at no futuro nem no ano 2000.
  const submittedAt = new Date();
  const duracao = Math.min(envio.elapsed_ms, DURACAO_MAX_MS);
  const startedAt = new Date(submittedAt.getTime() - duracao);

  const origem = envio.attribution ?? {};
  const conviteUsado = identificacao.identification_method === "invite";
  const linha = {
    campaign_id: campanha.id,
    survey_version: SURVEY_VERSION,
    client_submission_id: envio.submission_id,

    first_name: firstName,
    last_name: lastName,
    full_name_normalized: normalizarParaBusca(`${firstName} ${lastName}`) || `${firstName} ${lastName}`.toLowerCase(),
    identification_method: identificacao.identification_method,
    invite_id: identificacao.invite_id,
    student_asaas_id: identificacao.aluno?.student_asaas_id ?? null,
    professor_id: identificacao.aluno?.professor_id ?? null,
    professor_name: identificacao.aluno?.professor_name ?? null,

    ...preparo.respostas,

    source: conviteUsado ? "invite" : slug(origem.source) ?? slug(origem.utm_source) ?? "direct",
    utm_source: utm(origem.utm_source),
    utm_medium: utm(origem.utm_medium),
    utm_campaign: utm(origem.utm_campaign),
    device_type: tipoDeAparelho(request),

    started_at: startedAt.toISOString(),
    submitted_at: submittedAt.toISOString(),
  };

  const resultado = await inserirResposta(sb, linha);
  switch (resultado.status) {
    case "criada":
      return responder(201, { ok: true });
    case "repetida":
      return responder(200, { ok: true, duplicate: true });
    case "convite_ja_usado":
      return responder(409, {
        error: "Recebemos uma resposta sua nesta rodada. Obrigado!",
        code: "already_answered",
      });
    default:
      return responder(500, {
        error: "Não conseguimos registrar agora. Suas respostas continuam salvas neste aparelho.",
      });
  }
}
