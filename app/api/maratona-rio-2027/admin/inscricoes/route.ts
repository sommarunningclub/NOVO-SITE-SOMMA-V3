import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { exigirAcesso } from "@/lib/maratona-rio-2027/auth";

export const dynamic = "force-dynamic";

const STATUS = new Set(["aguardando_pagamento", "pago", "cancelado"]);

/**
 * Muda uma inscrição da Meia: o status (confirmar pagamento, voltar para
 * aguardando ou cancelar, que devolve a vaga ao lote) e/ou a observação
 * interna da equipe.
 */
export async function PATCH(req: NextRequest) {
  const negado = await exigirAcesso();
  if (negado) return negado;

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  const status = body?.status;
  const observacao = body?.observacao;
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  if (status === undefined && observacao === undefined) {
    return NextResponse.json({ error: "Nada para mudar." }, { status: 400 });
  }
  if (status !== undefined && !STATUS.has(status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  if (observacao !== undefined && (typeof observacao !== "string" || observacao.length > 1000)) {
    return NextResponse.json({ error: "Observação inválida." }, { status: 400 });
  }

  const mudanca: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (status !== undefined) {
    mudanca.status = status;
    mudanca.pago_em = status === "pago" ? new Date().toISOString() : null;
  }
  if (observacao !== undefined) mudanca.observacao = observacao.trim() || null;

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { error, count } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .update(mudanca, { count: "exact" })
    .eq("id", id);
  if (error) {
    console.error("[maratona-rio-2027] Falha ao mudar status:", error.message);
    return NextResponse.json({ error: "Não deu certo. Tente de novo." }, { status: 500 });
  }
  if (!count) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
