import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_FOTOS, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

/** Mesmo cuidado das fotos de perfil: bucket privado e só com sessão. */
export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  try {
    const caminho = await rpc<string | null>("dex_corre_correio_foto", { ...quem(s), p_recado: id });
    if (!caminho) return new NextResponse(null, { status: 404 });
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("banco indisponível");
    const { data, error } = await supabase.storage.from(BUCKET_FOTOS).download(caminho);
    if (error || !data) return new NextResponse(null, { status: 404 });
    const tipo = caminho.endsWith(".png") ? "image/png" : caminho.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new NextResponse(data, {
      headers: { "Content-Type": tipo, "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    return falha("correio:foto", e);
  }
}
