import { NextRequest, NextResponse } from "next/server";
import { perfilSchema } from "@/lib/vem-correr-comigo/regras";
import { SLUG, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const parsed = perfilSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: "dados", campo: parsed.error.issues[0]?.path[0], mensagem: parsed.error.issues[0]?.message }, { status: 422 });
  }
  try {
    const r = await rpc<{ ok: boolean; erro?: string }>("dex_corre_salvar_perfil", { p_slug: SLUG, ...quem(s), p_dados: parsed.data });
    return NextResponse.json(r, { status: r.ok ? 200 : r.erro === "sessao" ? 401 : 409 });
  } catch (e) {
    return falha("perfil", e);
  }
}
