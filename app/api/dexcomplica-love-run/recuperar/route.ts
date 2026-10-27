import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { camposComErro, recuperarSchema } from "@/lib/dexcomplica-love-run/schema";
import { getEvento, getParticipacao } from "@/lib/dexcomplica-love-run/db";
import { enviarIngresso } from "@/lib/emails/dexcomplica-love-run-ingresso";

export const dynamic = "force-dynamic";

/**
 * Recuperação do ingresso pelo CPF.
 *
 * O ingresso só vai para o e-mail guardado na inscrição, e a resposta é a
 * mesma (e no mesmo tempo) exista ou não a inscrição: a rota não serve para
 * descobrir quem está inscrito nem entrega ingresso de terceiro na tela.
 */
const TEMPO_MS = 700;
const RESPOSTA = {
  ok: true,
  mensagem:
    "Se houver inscrição com esse CPF, o ingresso foi enviado para o e-mail usado na inscrição. Confira também o spam e a aba Promoções.",
};

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  const responder = async (corpo: object, status = 200) => {
    const resta = TEMPO_MS - (Date.now() - inicio);
    if (resta > 0) await new Promise((r) => setTimeout(r, resta));
    return NextResponse.json(corpo, { status });
  };

  try {
    const limite = await rateLimit(`love-run:recuperar:${clientIp(request)}`, 5, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const parsed = recuperarSchema.safeParse((await request.json().catch(() => null)) ?? {});
    if (!parsed.success) {
      return responder({ error: "Confira o CPF.", campos: camposComErro(parsed.error.issues) }, 422);
    }
    const cpf = parsed.data.cpf;

    const evento = await getEvento();
    const p = evento ? await getParticipacao(evento.id, cpf) : null;
    const cota = await rateLimit(`love-run:reenvio:${cpf}`, 3, 3600);
    if (p?.email && cota.ok) {
      await enviarIngresso({
        nome: p.nome_completo,
        email: p.email,
        ticketCode: p.ticket_code,
        ticketToken: p.ticket_token,
        pelotao: p.pelotao,
        reenvio: true,
      });
    }
    return responder(RESPOSTA);
  } catch (erro) {
    console.error("[love-run] Erro ao recuperar ingresso:", erro instanceof Error ? erro.message : erro);
    return responder({ error: "Não conseguimos processar agora. Tente de novo em instantes." }, 500);
  }
}
