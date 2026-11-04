import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { exigirAcesso } from "@/lib/maratona-rio-2027/auth";

export const dynamic = "force-dynamic";

const STATUS = new Set(["aguardando_pagamento", "pago", "cancelado"]);

/**
 * Muda o status de uma inscrição da Meia: confirmar pagamento, voltar para
 * aguardando ou cancelar (cancelar devolve a vaga ao lote).
 */
export async function PATCH(req: NextRequest) {
  const negado = await exigirAcesso();
  if (negado) return negado;

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  const status = body?.status;
  if (!Number.isSafeInteger(id) || id <= 0 || !STATUS.has(status)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { error, count } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .update(
      {
        status,
        pago_em: status === "pago" ? new Date().toISOString() : null,
        atualizado_em: new Date().toISOString(),
      },
      { count: "exact" }
    )
    .eq("id", id);
  if (error) {
    console.error("[maratona-rio-2027] Falha ao mudar status:", error.message);
    return NextResponse.json({ error: "Não deu certo. Tente de novo." }, { status: 500 });
  }
  if (!count) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
