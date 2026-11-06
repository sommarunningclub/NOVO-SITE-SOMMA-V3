import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SLUG, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

const codigo = z.string().regex(/^[0-9a-f]{12}$/);
const uuid = z.string().uuid();

const acaoSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("interesse"), perfil: codigo.optional(), grupo: codigo.optional() }),
  z.object({ tipo: z.literal("responder"), convite: uuid, aceitar: z.boolean() }),
  z.object({ tipo: z.literal("cancelar"), convite: uuid }),
  z.object({ tipo: z.literal("sair_do_grupo") }),
  z.object({ tipo: z.literal("ler_notificacoes"), ids: z.array(uuid).max(50).optional() }),
]);

/** A identidade vem só da sessão: o corpo diz o que fazer, nunca quem está fazendo. */
export async function POST(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const limite = await rateLimit(`corre:acao:${s.participacao}`, 60, 60);
  if (!limite.ok) return NextResponse.json({ ok: false, erro: "limite" }, { status: 429 });

  const parsed = acaoSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, erro: "dados" }, { status: 422 });
  const a = parsed.data;

  try {
    let r: { ok: boolean; erro?: string };
    if (a.tipo === "interesse") {
      if (!a.perfil === !a.grupo) return NextResponse.json({ ok: false, erro: "dados" }, { status: 422 });
      r = await rpc("dex_corre_interesse", { p_slug: SLUG, ...quem(s), p_alvo_perfil: a.perfil ?? null, p_alvo_grupo: a.grupo ?? null });
    } else if (a.tipo === "responder") {
      r = await rpc("dex_corre_responder_convite", { p_slug: SLUG, ...quem(s), p_convite: a.convite, p_aceitar: a.aceitar });
    } else if (a.tipo === "cancelar") {
      r = await rpc("dex_corre_cancelar_convite", { p_slug: SLUG, ...quem(s), p_convite: a.convite });
    } else if (a.tipo === "sair_do_grupo") {
      r = await rpc("dex_corre_sair_do_grupo", { p_slug: SLUG, ...quem(s) });
    } else {
      r = await rpc("dex_corre_ler_notificacoes", { ...quem(s), p_ids: a.ids ?? null });
    }
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (e) {
    return falha(`acao:${a.tipo}`, e);
  }
}
