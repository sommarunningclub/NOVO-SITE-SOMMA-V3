import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { camposComErro, inscricaoSchema } from "@/lib/dexcomplica-love-run/schema";
import { estadoDaInscricao, pelotoesValidos } from "@/lib/dexcomplica-love-run/estado";
import { contarInscritos, getEvento, getParticipacao, inscrever, type Participante } from "@/lib/dexcomplica-love-run/db";
import { caminhoIngresso } from "@/lib/dexcomplica-love-run/ticket";
import { enviarIngresso } from "@/lib/emails/dexcomplica-love-run-ingresso";

export const dynamic = "force-dynamic";

const MENSAGEM_ESTADO = {
  em_breve: "As inscrições ainda não abriram. Fique de olho no @somma.club.",
  esgotado: "As vagas acabaram.",
  encerradas: "As inscrições foram encerradas.",
} as const;

/**
 * Quem já tem inscrição neste evento.
 *
 * Mesmo e-mail da inscrição = é a própria pessoa repetindo o envio (clique
 * duplo, rede que caiu, voltou dias depois): recebe o mesmo ingresso.
 * E-mail diferente: o ingresso NÃO sai nesta resposta (seria entregar o
 * ingresso de um terceiro a quem sabe o CPF dele); vai de novo para o e-mail
 * guardado na inscrição.
 */
async function responderJaInscrito(p: Participante, emailInformado: string, cpf: string) {
  if (p.email && p.email.trim().toLowerCase() === emailInformado) {
    return NextResponse.json({ ok: true, ja_inscrito: true, ingresso_url: caminhoIngresso(p.ticket_token) });
  }
  let reenviado = false;
  const cota = await rateLimit(`love-run:reenvio:${cpf}`, 3, 3600);
  if (p.email && cota.ok) {
    reenviado = (
      await enviarIngresso({
        nome: p.nome_completo,
        email: p.email,
        ticketCode: p.ticket_code,
        ticketToken: p.ticket_token,
        pelotao: p.pelotao,
        reenvio: true,
      })
    ).ok;
  }
  return NextResponse.json({ ok: false, ja_inscrito: true, email_reenviado: reenviado }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`love-run:inscricao:${ip}`, 8, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const corpo = await request.json().catch(() => null);
    const parsed = inscricaoSchema.safeParse(corpo ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: camposComErro(parsed.error.issues) },
        { status: 422 }
      );
    }
    const dados = parsed.data;

    const evento = await getEvento();
    if (!evento) {
      return NextResponse.json({ error: MENSAGEM_ESTADO.em_breve, estado: "em_breve" }, { status: 409 });
    }

    // Antes do estado: quem já está dentro recupera o ingresso mesmo com o evento esgotado.
    const existente = await getParticipacao(evento.id, dados.cpf);
    if (existente) return responderJaInscrito(existente, dados.email, dados.cpf);

    const { estado, pendencias } = estadoDaInscricao(evento, await contarInscritos(evento.id));
    if (estado !== "abertas") {
      if (pendencias.length) console.warn("[love-run] Inscrição recusada, pendente:", pendencias.join(", "));
      return NextResponse.json({ error: MENSAGEM_ESTADO[estado], estado }, { status: 409 });
    }

    if (!pelotoesValidos(evento.pelotoes).includes(dados.pelotao)) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: { pelotao: "Escolha um dos pelotões disponíveis" } },
        { status: 422 }
      );
    }

    const resultado = await inscrever(dados, evento);
    if (!resultado.ok) {
      if (resultado.motivo === "lotado") {
        return NextResponse.json({ error: MENSAGEM_ESTADO.esgotado, estado: "esgotado" }, { status: 409 });
      }
      return NextResponse.json(
        { error: "Não conseguimos salvar sua inscrição agora. Nada foi registrado; tente de novo em instantes." },
        { status: 503 }
      );
    }

    const { participante, jaEstava } = resultado;
    // Dois envios simultâneos do mesmo CPF: o banco devolveu a inscrição que já existia.
    if (jaEstava) return responderJaInscrito(participante, dados.email, dados.cpf);

    // O e-mail é consequência: a vaga já está gravada. Se falhar, a pessoa vê o
    // ingresso na tela e a página não afirma que o e-mail chegou.
    const email = participante.email
      ? await enviarIngresso({
          nome: participante.nome_completo,
          email: participante.email,
          ticketCode: participante.ticket_code,
          ticketToken: participante.ticket_token,
          pelotao: participante.pelotao,
        })
      : { ok: false };

    return NextResponse.json(
      {
        ok: true,
        ja_inscrito: false,
        email_enviado: email.ok,
        ingresso_url: `${caminhoIngresso(participante.ticket_token)}?novo=1${email.ok ? "&email=1" : ""}`,
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error("[love-run] Erro na inscrição:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json(
      { error: "Não conseguimos salvar sua inscrição agora. Tente de novo em instantes." },
      { status: 500 }
    );
  }
}
