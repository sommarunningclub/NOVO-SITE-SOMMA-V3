import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_FOTOS, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

const schema = z.object({ tipo: z.enum(["apagar", "denunciar", "comentario_apagar", "comentario_denunciar"]), id: z.string().uuid() });

export async function POST(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const parsed = schema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, erro: "dados" }, { status: 422 });
  try {
    if (parsed.data.tipo === "comentario_apagar" || parsed.data.tipo === "comentario_denunciar") {
      const fn = parsed.data.tipo === "comentario_apagar" ? "dex_corre_correio_comentario_apagar" : "dex_corre_correio_comentario_denunciar";
      const r = await rpc<{ ok: boolean }>(fn, { ...quem(s), p_comentario: parsed.data.id });
      return NextResponse.json(r, { status: r.ok ? 200 : 409 });
    }
    if (parsed.data.tipo === "denunciar") {
      const r = await rpc<{ ok: boolean }>("dex_corre_correio_denunciar", { ...quem(s), p_recado: parsed.data.id });
      return NextResponse.json(r, { status: r.ok ? 200 : 409 });
    }
    const r = await rpc<{ ok: boolean; foto?: string | null }>("dex_corre_correio_apagar", { ...quem(s), p_recado: parsed.data.id });
    if (r.ok && r.foto) await getServiceSupabase()?.storage.from(BUCKET_FOTOS).remove([r.foto]);
    return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 409 });
  } catch (e) {
    return falha("correio:acao", e);
  }
}
