import { NextRequest, NextResponse } from "next/server";
import { falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

/** Perfil ou grupo de um link compartilhado. Sem sessão, nada. */
export async function GET(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const q = request.nextUrl.searchParams;
  const codigo = q.get("codigo") ?? "";
  if (!/^[0-9a-f]{12}$/.test(codigo)) return NextResponse.json({ ok: false, erro: "nao_encontrado" }, { status: 404 });
  try {
    const fn = q.get("tipo") === "grupo" ? "dex_corre_ver_grupo" : "dex_corre_ver_perfil";
    const r = await rpc<{ ok: boolean }>(fn, { ...quem(s), p_codigo: codigo });
    return NextResponse.json(r, { status: r.ok ? 200 : 404, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return falha("ver", e);
  }
}
