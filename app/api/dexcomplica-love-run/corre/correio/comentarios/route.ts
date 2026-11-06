import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SLUG, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

const POR_PAGINA = 30;
const uuid = z.string().uuid();
const novoSchema = z.object({ recado: uuid, texto: z.string().max(400) });

export async function GET(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const q = request.nextUrl.searchParams;
  const recado = uuid.safeParse(q.get("recado"));
  if (!recado.success) return NextResponse.json({ ok: false, erro: "dados" }, { status: 422 });
  try {
    const r = await rpc<{ ok: boolean }>("dex_corre_correio_comentarios_lista", {
      p_slug: SLUG,
      ...quem(s),
      p_recado: recado.data,
      p_limite: POR_PAGINA,
      p_offset: Math.max(0, Math.min(Number(q.get("offset")) || 0, 100000)),
    });
    return NextResponse.json(r, { status: r.ok ? 200 : 404, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return falha("correio:comentarios", e);
  }
}

export async function POST(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const limite = await rateLimit(`corre:comentar:${clientIp(request)}`, 40, 600);
  if (!limite.ok) return NextResponse.json({ ok: false, erro: "limite_comentarios" }, { status: 429 });
  const parsed = novoSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, erro: "comentario_texto" }, { status: 422 });
  try {
    const r = await rpc<{ ok: boolean }>("dex_corre_correio_comentar", {
      p_slug: SLUG,
      ...quem(s),
      p_recado: parsed.data.recado,
      p_texto: parsed.data.texto,
    });
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (e) {
    return falha("correio:comentar", e);
  }
}
