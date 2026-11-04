import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { exigirAcesso } from "@/lib/maratona-rio-2027/auth";

export const dynamic = "force-dynamic";

/** Muda o número de vagas do lote e/ou abre e fecha as inscrições da Meia. */
export async function PATCH(req: NextRequest) {
  const negado = await exigirAcesso();
  if (negado) return negado;

  const body = await req.json().catch(() => ({}));
  const mudanca: Record<string, unknown> = { atualizado_em: new Date().toISOString() };

  if (body?.limite !== undefined) {
    const limite = Number(body.limite);
    if (!Number.isInteger(limite) || limite < 0 || limite > 1000) {
      return NextResponse.json({ error: "Número de vagas inválido (0 a 1000)." }, { status: 400 });
    }
    mudanca.limite_vagas = limite;
  }
  if (body?.abertas !== undefined) {
    if (typeof body.abertas !== "boolean") return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    mudanca.inscricoes_abertas = body.abertas;
  }
  if (Object.keys(mudanca).length === 1) return NextResponse.json({ error: "Nada para mudar." }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { error } = await supabase.from("maratona_rio_2027_config").upsert({ id: 1, ...mudanca });
  if (error) {
    console.error("[maratona-rio-2027] Falha ao salvar config:", error.message);
    return NextResponse.json(
      { error: "Não deu para salvar. A tabela de configuração já foi criada no banco?" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
