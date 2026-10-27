import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { exigirAcesso } from "@/lib/maratona-rio-2027/auth";

export const dynamic = "force-dynamic";

/** Apaga um cadastro (teste, duplicado com CPF errado, pedido da pessoa). */
export async function DELETE(req: NextRequest) {
  const negado = await exigirAcesso();
  if (negado) return negado;

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Cadastro inválido." }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const { error, count } = await supabase
    .from("maratona_rio_2027_intencoes")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) {
    console.error("[maratona-rio-2027] Falha ao apagar cadastro:", error.message);
    return NextResponse.json({ error: "Não deu certo. Tente de novo." }, { status: 500 });
  }
  if (!count) return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
