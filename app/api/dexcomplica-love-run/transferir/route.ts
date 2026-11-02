import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { camposComErro, transferenciaSchema } from "@/lib/dexcomplica-love-run/schema";
import { getEvento, transferirIngresso, type MotivoTransferencia } from "@/lib/dexcomplica-love-run/db";
import { lerTokenPerfil } from "@/lib/dexcomplica-love-run/perfil";
import { enviarIngresso } from "@/lib/emails/dexcomplica-love-run-ingresso";

export const dynamic = "force-dynamic";

const MENSAGEM: Record<MotivoTransferencia, { error: string; status: number; campo?: string }> = {
  sem_banco: { error: "Serviço indisponível. Tente de novo em instantes.", status: 503 },
  nao_encontrada: { error: "Sua sessão expirou. Informe CPF e e-mail de novo.", status: 401 },
  presente: { error: "Este ingresso já foi usado no check-in e não pode ser transferido.", status: 409 },
  cancelado: { error: "Esta inscrição está cancelada.", status: 409 },
  mesmo_cpf: { error: "Este CPF já é o titular do ingresso.", status: 409 },
  destino_inscrito: { error: "Essa pessoa já tem inscrição no Dexcomplica Love Run.", status: 409 },
  prazo: { error: "O prazo para transferir encerrou (até 06h30 do dia do evento).", status: 409 },
  pelotao: { error: "Escolha um dos pelotões disponíveis.", status: 422, campo: "pelotao" },
  erro: { error: "Não foi possível transferir. Tente novamente.", status: 500 },
};

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`love-run:transferir:${ip}`, 5, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    let body: { token?: unknown; novo?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    const id = lerTokenPerfil(typeof body.token === "string" ? body.token : null);
    if (!id) {
      return NextResponse.json(
        { error: "Sua sessão expirou. Informe CPF e e-mail de novo." },
        { status: 401 }
      );
    }

    const cota = await rateLimit(`love-run:transferir:id:${id}`, 3, 3600);
    if (!cota.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas nesta inscrição. Aguarde um pouco." },
        { status: 429, headers: { "Retry-After": String(cota.retryAfterSeconds) } }
      );
    }

    const parsed = transferenciaSchema.safeParse(body.novo ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: camposComErro(parsed.error.issues) },
        { status: 422 }
      );
    }

    const evento = await getEvento();
    if (!evento) {
      return NextResponse.json({ error: "Evento indisponível." }, { status: 503 });
    }

    const resultado = await transferirIngresso(id, parsed.data, evento);
    if (!resultado.ok) {
      const msg = MENSAGEM[resultado.motivo];
      return NextResponse.json(
        msg.campo ? { error: msg.error, campos: { [msg.campo]: msg.error } } : { error: msg.error },
        { status: msg.status }
      );
    }

    const { participante, anterior } = resultado;
    if (participante.email) {
      void enviarIngresso({
        nome: participante.nome_completo,
        email: participante.email,
        ticketCode: participante.ticket_code,
        ticketToken: participante.ticket_token,
        pelotao: participante.pelotao,
        transferidoDe: anterior.nome,
      }).catch((err) => {
        console.error("[love-run] e-mail de transferência falhou:", err);
      });
    }

    return NextResponse.json({
      ok: true,
      novo_titular: participante.nome_completo,
      email: participante.email,
      ticket_code: participante.ticket_code,
    });
  } catch (erro) {
    console.error("[love-run] Erro ao transferir:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Não foi possível transferir. Tente novamente." }, { status: 500 });
  }
}
