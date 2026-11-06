import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getServiceSupabase } from "@/lib/supabase";
import { FOTO_MAX_BYTES } from "@/lib/vem-correr-comigo/regras";
import { BUCKET_FOTOS, SLUG, falha, lerSessao, quem, rpc, semSessao, tipoDaImagem } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

const POR_PAGINA = 12;

export async function GET(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const offset = Math.max(0, Math.min(Number(request.nextUrl.searchParams.get("offset")) || 0, 100000));
  try {
    const r = await rpc<object>("dex_corre_correio_mural", { p_slug: SLUG, ...quem(s), p_limite: POR_PAGINA, p_offset: offset });
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return falha("correio", e);
  }
}

export async function POST(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const limite = await rateLimit(`corre:correio:${clientIp(request)}`, 20, 600);
  if (!limite.ok) return NextResponse.json({ ok: false, erro: "limite_recados" }, { status: 429 });

  try {
    const form = await request.formData().catch(() => null);
    if (!form) return NextResponse.json({ ok: false, erro: "texto" }, { status: 422 });

    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("banco indisponível");

    let caminho: string | null = null;
    const foto = form.get("foto");
    if (foto instanceof Blob && foto.size > 0) {
      if (foto.size > FOTO_MAX_BYTES) return NextResponse.json({ ok: false, erro: "tamanho" }, { status: 413 });
      const bytes = new Uint8Array(await foto.arrayBuffer());
      const tipo = tipoDaImagem(bytes);
      if (!tipo) return NextResponse.json({ ok: false, erro: "formato" }, { status: 415 });
      caminho = `correio/${s.participacao}/${randomUUID()}.${tipo.ext}`;
      const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, bytes, { contentType: tipo.mime, upsert: false });
      if (error) throw new Error(error.message);
    }

    const r = await rpc<{ ok: boolean; erro?: string; repetido?: boolean; foto_salva?: boolean }>("dex_corre_correio_publicar", {
      p_slug: SLUG,
      ...quem(s),
      p_dados: {
        para: String(form.get("para") ?? ""),
        mensagem: String(form.get("mensagem") ?? ""),
        identificado: form.get("identificado") === "1",
        mostrar_instagram: form.get("mostrar_instagram") === "1",
        mostrar_whatsapp: form.get("mostrar_whatsapp") === "1",
        foto_path: caminho,
      },
    });
    // Recusado, ou repetido sem aproveitar a foto: tira o arquivo órfão do Storage.
    if (caminho && (!r.ok || (r.repetido && !r.foto_salva))) {
      await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
    }
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (e) {
    return falha("correio", e);
  }
}
