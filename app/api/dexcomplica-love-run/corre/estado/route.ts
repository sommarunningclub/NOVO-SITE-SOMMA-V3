import { NextResponse } from "next/server";
import { SLUG, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await lerSessao();
  if (!s) return semSessao();
  try {
    const r = await rpc<{ ok: boolean }>("dex_corre_estado", { p_slug: SLUG, ...quem(s) });
    if (!r.ok) return semSessao();
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return falha("estado", e);
  }
}
