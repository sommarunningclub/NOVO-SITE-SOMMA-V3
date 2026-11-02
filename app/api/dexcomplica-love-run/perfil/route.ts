import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { camposComErro, perfilAcessoSchema } from "@/lib/dexcomplica-love-run/schema";
import { getEvento, getParticipacao, getTransferenciaPorCpfOrigem } from "@/lib/dexcomplica-love-run/db";
import { criarTokenPerfil } from "@/lib/dexcomplica-love-run/perfil";
import { caminhoIngresso } from "@/lib/dexcomplica-love-run/ticket";
import { prazoTransferenciaPassou } from "@/lib/dexcomplica-love-run/event.config";
import { emailsIguais } from "@/lib/dexcomplica-love-run/transferencia";

export const dynamic = "force-dynamic";

const TEMPO_MS = 700;
const NAO_ENCONTROU = "Não encontramos inscrição com esse CPF e e-mail.";

/**
 * Abre o perfil do inscrito. CPF + e-mail têm que bater com a inscrição;
 * a resposta (e o tempo) é a mesma se o CPF não existe ou o e-mail é outro,
 * para a rota não servir de oráculo.
 */
export async function POST(request: NextRequest) {
  const inicio = Date.now();
  const responder = async (corpo: object, status = 200) => {
    const resta = TEMPO_MS - (Date.now() - inicio);
    if (resta > 0) await new Promise((r) => setTimeout(r, resta));
    return NextResponse.json(corpo, { status });
  };

  try {
    const limite = await rateLimit(`love-run:perfil:${clientIp(request)}`, 8, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const parsed = perfilAcessoSchema.safeParse((await request.json().catch(() => null)) ?? {});
    if (!parsed.success) {
      return responder({ error: "Confira CPF e e-mail.", campos: camposComErro(parsed.error.issues) }, 422);
    }

    const evento = await getEvento();
    const p = evento ? await getParticipacao(evento.id, parsed.data.cpf) : null;
    const emailGuardado = (p?.email ?? "").trim().toLowerCase();
    if (p && emailGuardado !== parsed.data.email) {
      return responder({ error: NAO_ENCONTROU }, 404);
    }
    if (!p) {
      const saida = evento ? await getTransferenciaPorCpfOrigem(evento.id, parsed.data.cpf) : null;
      if (!saida || !emailsIguais(saida.emailOrigem, parsed.data.email)) {
        return responder({ error: NAO_ENCONTROU }, 404);
      }
      return responder({
        ok: true,
        transferido: true,
        para: { nome: saida.paraNome, email: saida.paraEmail },
      });
    }

    const presente = p.status === "presente";
    const prazo = prazoTransferenciaPassou();

    return responder({
      ok: true,
      token: criarTokenPerfil(p.id),
      cadastro: {
        nome: p.nome_completo,
        pelotao: p.pelotao,
        ticket_code: p.ticket_code,
        ingresso_url: caminhoIngresso(p.ticket_token),
        pode_transferir: !presente && !prazo,
        motivo_bloqueio: presente ? "presente" : prazo ? "prazo" : null,
      },
    });
  } catch (erro) {
    console.error("[love-run] Erro ao abrir perfil:", erro instanceof Error ? erro.message : erro);
    return responder({ error: "Não conseguimos processar agora. Tente de novo em instantes." }, 500);
  }
}
