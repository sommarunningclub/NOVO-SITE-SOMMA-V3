import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_FOTOS, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

/**
 * A foto só sai para quem tem sessão. O bucket é privado e a URL é sempre esta,
 * então não existe link permanente que funcione fora da comunidade.
 */
export async function GET(_: NextRequest, ctx: { params: Promise<{ codigo: string }> }) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const { codigo } = await ctx.params;
  try {
    const caminho = await rpc<string | null>("dex_corre_foto_de", { ...quem(s), p_codigo: codigo });
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
    return falha("foto", e);
  }
}
