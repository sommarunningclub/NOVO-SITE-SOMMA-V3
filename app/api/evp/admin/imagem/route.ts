import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { exigir } from "@/lib/evp/auth";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "evp-midia";
const MAX_BYTES = 4 * 1024 * 1024;

/** Tipo pelo conteúdo do arquivo, não pelo nome nem pelo que o navegador diz. */
function tipoReal(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

/** Sobe uma imagem da página (foto de profissional ou hero) e devolve o endereço público. */
export async function POST(req: NextRequest) {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  try {
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    const uso = form.get("uso") === "hero" ? "hero" : "profissional";
    if (!(arquivo instanceof File)) return NextResponse.json({ error: "Anexe uma imagem." }, { status: 422 });
    if (arquivo.size > MAX_BYTES) return NextResponse.json({ error: "Imagem acima de 4 MB." }, { status: 413 });
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const tipo = tipoReal(bytes);
    if (!tipo) return NextResponse.json({ error: "Use uma imagem JPG, PNG ou WebP." }, { status: 422 });

    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ error: "Armazenamento indisponível." }, { status: 503 });
    const caminho = `${SLUG}/${uso}-${randomBytes(8).toString("hex")}.${tipo.ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(caminho, bytes, { contentType: tipo.mime, upsert: false });
    if (error) {
      console.error("[evp] Upload:", error.message);
      return NextResponse.json({ error: "Não foi possível guardar a imagem." }, { status: 503 });
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
    await rpc("evp_admin_log", {
      p_slug: SLUG, p_staff: sessao.id, p_acao: "imagem_enviada", p_alvo_tipo: "evento", p_alvo_id: null, p_detalhes: { uso },
    });
    return NextResponse.json({ ok: true, url: data.publicUrl });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar a imagem." }, { status: 503 });
  }
}
