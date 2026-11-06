import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getServiceSupabase } from "@/lib/supabase";
import { FOTO_MAX_BYTES } from "@/lib/vem-correr-comigo/regras";
import { BUCKET_FOTOS, falha, lerSessao, quem, rpc, semSessao, tipoDaImagem } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const limite = await rateLimit(`corre:foto:${clientIp(request)}`, 12, 600);
  if (!limite.ok) return NextResponse.json({ ok: false, erro: "limite" }, { status: 429 });

  try {
    const form = await request.formData().catch(() => null);
    const arquivo = form?.get("foto");
    if (!(arquivo instanceof Blob)) return NextResponse.json({ ok: false, erro: "arquivo" }, { status: 422 });
    if (arquivo.size === 0 || arquivo.size > FOTO_MAX_BYTES) return NextResponse.json({ ok: false, erro: "tamanho" }, { status: 413 });

    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const tipo = tipoDaImagem(bytes);
    if (!tipo) return NextResponse.json({ ok: false, erro: "formato" }, { status: 415 });

    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("banco indisponível");
    const caminho = `${s.participacao}/${randomUUID()}.${tipo.ext}`;
    const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, bytes, { contentType: tipo.mime, upsert: false });
    if (error) throw new Error(error.message);

    const r = await rpc<{ ok: boolean; anterior?: string | null }>("dex_corre_definir_foto", { ...quem(s), p_path: caminho });
    if (!r.ok) {
      await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
      return NextResponse.json(r, { status: 409 });
    }
    if (r.anterior) await supabase.storage.from(BUCKET_FOTOS).remove([r.anterior]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return falha("foto", e);
  }
}
