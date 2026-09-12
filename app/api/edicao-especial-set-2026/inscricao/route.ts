import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { envioSchema, formatarNascimento, inscricaoSchema } from "@/lib/somma-day/schema";
import { getEvento, getPessoaPorCpf, inscrever, type EventoRow } from "@/lib/somma-day/db";
import { urlObrigado } from "@/lib/somma-day/ticket";
import { enviarSommaDayTicket } from "@/lib/emails/somma-day-ticket";

export const dynamic = "force-dynamic";

/**
 * Quem decide se a inscrição está aberta é o BANCO, não esta rota nem o config:
 * a gestão abre e fecha o check-in em `public.eventos` e o site obedece sem
 * deploy (mesma regra de `/api/checkin`).
 */
function aceitandoInscricao(evento: EventoRow): boolean {
  if (evento.evento_encerrado === true) return false;
  return evento.checkin_status === "aberto";
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`somma-day:inscricao:${ip}`, 8, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const corpo = await request.json().catch(() => null);
    if (!corpo) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });

    const envio = envioSchema.safeParse(corpo);
    if (!envio.success) {
      const campos: Record<string, string> = {};
      for (const issue of envio.error.issues) {
        const campo = String(issue.path[0] ?? "form");
        if (!campos[campo]) campos[campo] = issue.message;
      }
      return NextResponse.json({ error: "Confira os campos destacados.", campos }, { status: 422 });
    }

    const evento = await getEvento();
    if (!evento) {
      return NextResponse.json(
        { error: "As inscrições ainda não abriram. Fique de olho no @somma.club." },
        { status: 409 }
      );
    }
    if (!aceitandoInscricao(evento)) {
      return NextResponse.json({ error: "As inscrições não estão abertas." }, { status: 403 });
    }

    // O cadastro existente completa o que o formulário não perguntou — e é o
    // conjunto MESCLADO que passa pela validação. Validar só o que veio da tela
    // deixaria entrar cadastro antigo com buraco.
    const pessoa = await getPessoaPorCpf(envio.data.cpf);
    const completo = {
      cpf: envio.data.cpf,
      pelotao: envio.data.pelotao,
      nome: envio.data.nome?.trim() || pessoa?.nome_completo || "",
      email: envio.data.email?.trim() || pessoa?.email || "",
      telefone: envio.data.telefone?.trim() || pessoa?.whatsapp || "",
      nascimento: envio.data.nascimento?.trim() || formatarNascimento(pessoa?.data_nascimento ?? ""),
      parceiro: envio.data.parceiro ?? null,
      utm: envio.data.utm,
    };

    const parsed = inscricaoSchema.safeParse(completo);
    if (!parsed.success) {
      const campos: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const campo = String(issue.path[0] ?? "form");
        if (!campos[campo]) campos[campo] = issue.message;
      }
      return NextResponse.json(
        { error: "Falta completar seu cadastro.", campos },
        { status: 422 }
      );
    }

    const resultado = await inscrever(parsed.data, evento);
    if (!resultado.ok) {
      if (resultado.motivo === "lotado") {
        return NextResponse.json(
          { error: "As vagas desta edição acabaram.", lotado: true },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Não conseguimos salvar sua inscrição. Tente de novo em instantes." },
        { status: 500 }
      );
    }

    const { participante, jaEstava } = resultado;

    // O e-mail é consequência da inscrição, não condição dela: a vaga já está
    // gravada aqui. Se a Resend falhar, a pessoa continua inscrita e vê o
    // ticket na tela — o erro fica no log, não na cara de quem se inscreveu.
    if (participante.email) {
      const envio = await enviarSommaDayTicket({
        nome: participante.nome_completo,
        email: participante.email,
        ticketCode: participante.ticket_code,
        ticketToken: participante.ticket_token,
        pelotao: participante.pelotao,
        reenvio: jaEstava,
      });
      if (!envio.ok) console.error("[somma-day] Ticket não enviado por e-mail:", envio.error);
    }

    // Resposta mínima: nada de devolver CPF, e-mail e telefone pela rede.
    return NextResponse.json(
      {
        ok: true,
        ja_inscrito: jaEstava,
        ticket_code: participante.ticket_code,
        obrigado_url: `/edicao-especial-set-2026/obrigado/${participante.ticket_token}`,
        credencial_url: urlObrigado(participante.ticket_token),
        pelotao: participante.pelotao,
      },
      { status: jaEstava ? 200 : 201 }
    );
  } catch (erro) {
    console.error("[somma-day] Erro na inscrição:", erro);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
