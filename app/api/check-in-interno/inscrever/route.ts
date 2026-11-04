import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { exigirAcesso } from "@/lib/check-in-interno/auth";
import { VAGAS_LINK, capacidadeDoLink, contarUsadasNoLink, situacaoDoLink } from "@/lib/check-in-interno/eventos";
import { camposComErro, cpfSchema, emailSchema, nomeSchema, sexoSchema, telefoneSchema } from "@/lib/dexcomplica-love-run/schema";
import { getParticipacao, inscrever } from "@/lib/dexcomplica-love-run/db";
import { urlIngresso } from "@/lib/dexcomplica-love-run/ticket";
import { enviarIngresso } from "@/lib/emails/dexcomplica-love-run-ingresso";

export const dynamic = "force-dynamic";

/**
 * Inscrição feita pela equipe no /check-in/interno, só no Love Run de sábado.
 *
 * Fura o fechamento público (a LP e o /check-in seguem fechados) e o teto
 * público de vagas, mas tem cota própria: VAGAS_LINK inscrições ativas por
 * aqui. Esgotou, a rota responde 410 e a página trava o formulário.
 *
 * Grava pelo mesmo caminho da LP (`inscrever_no_evento`): ingresso, e-mail e
 * espelho em `checkins`. Sexo é obrigatório.
 */

const corpoSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  cpf: cpfSchema,
  telefone: telefoneSchema,
  sexo: sexoSchema,
  pelotao: z.string().trim().max(40).optional().default(""),
});

function encerrado(usadas: number, motivo: "esgotado" | "passou" | "sem_evento") {
  const error =
    motivo === "esgotado"
      ? `As ${VAGAS_LINK} vagas deste link foram usadas. O link está encerrado.`
      : motivo === "passou"
        ? "O evento já passou. O link está encerrado."
        : "Evento não encontrado.";
  return NextResponse.json({ error, encerrado: true, motivo, usadas, total: VAGAS_LINK }, { status: 410 });
}

export async function POST(req: NextRequest) {
  const negado = await exigirAcesso();
  if (negado) return negado;

  const limite = await rateLimit(`checkin-interno:inscrever:${clientIp(req)}`, 60, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas inscrições seguidas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  try {
    const parsed = corpoSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: camposComErro(parsed.error.issues) },
        { status: 422 }
      );
    }
    const dados = parsed.data;

    const situacao = await situacaoDoLink();
    if (situacao.erro) {
      console.error("[check-in-interno] Erro ao contar vagas:", situacao.erro);
      return NextResponse.json({ error: "Não conseguimos conferir as vagas agora. Tente de novo." }, { status: 503 });
    }
    if (!situacao.linha || !situacao.evento) return encerrado(0, "sem_evento");
    const { linha, evento } = situacao;

    // Quem já está dentro: avisa e mostra o ingresso, mesmo com o link esgotado.
    const existente = await getParticipacao(linha.id, dados.cpf);
    if (existente) {
      return NextResponse.json(
        {
          ok: false,
          ja_inscrito: true,
          error: `${existente.nome_completo} já está inscrito(a) neste evento.`,
          ingresso_url: urlIngresso(existente.ticket_token),
          ticket_code: existente.ticket_code,
        },
        { status: 409 }
      );
    }

    if (situacao.encerrado) return encerrado(situacao.usadas, situacao.motivo as "esgotado" | "passou");

    if (!evento.pelotoes.includes(dados.pelotao)) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: { pelotao: "Escolha um dos pelotões do evento" } },
        { status: 422 }
      );
    }

    const capacidade = await capacidadeDoLink(linha.id);
    const resultado = await inscrever(
      { ...dados, marketing: false, utm: { utm_source: "check-in-interno" } },
      linha,
      { interno: true, capacidade }
    );
    if (!resultado.ok) {
      if (resultado.motivo === "lotado") return encerrado(VAGAS_LINK, "esgotado");
      return NextResponse.json(
        { error: "Não conseguimos salvar a inscrição agora. Nada foi registrado; tente de novo." },
        { status: 503 }
      );
    }
    const p = resultado.participante;
    if (resultado.jaEstava) {
      return NextResponse.json(
        {
          ok: false,
          ja_inscrito: true,
          error: `${p.nome_completo} já está inscrito(a) neste evento.`,
          ingresso_url: urlIngresso(p.ticket_token),
          ticket_code: p.ticket_code,
        },
        { status: 409 }
      );
    }

    const email = p.email
      ? await enviarIngresso({
          nome: p.nome_completo,
          email: p.email,
          ticketCode: p.ticket_code,
          ticketToken: p.ticket_token,
          pelotao: p.pelotao,
        })
      : { ok: false };

    const usadas = await contarUsadasNoLink(linha.id).catch(() => situacao.usadas + 1);

    return NextResponse.json(
      {
        ok: true,
        nome: p.nome_completo,
        evento: evento.titulo,
        pelotao: p.pelotao,
        email_enviado: email.ok,
        ingresso_url: urlIngresso(p.ticket_token),
        ticket_code: p.ticket_code,
        usadas,
        total: VAGAS_LINK,
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error("[check-in-interno] Erro:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Erro interno. Tente de novo em instantes." }, { status: 500 });
  }
}
