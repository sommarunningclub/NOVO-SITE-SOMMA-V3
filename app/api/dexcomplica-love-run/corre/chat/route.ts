import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

const codigo = z.string().regex(/^[0-9a-f]{12}$/);
const uuid = z.string().uuid();
const emoji = z.enum(["❤️", "😂", "🔥", "👏", "😮", "😢"]);

const corpoSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("enviar"), grupo: codigo, texto: z.string().trim().min(1).max(500) }),
  z.object({ tipo: z.literal("editar"), mensagem: uuid, texto: z.string().trim().min(1).max(500) }),
  z.object({ tipo: z.literal("apagar"), mensagem: uuid }),
  z.object({ tipo: z.literal("reagir"), mensagem: uuid, emoji }),
]);

/** Lista o bate-papo público de um grupo. Qualquer perfil logado lê. */
export async function GET(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const grupo = request.nextUrl.searchParams.get("grupo") ?? "";
  if (!codigo.safeParse(grupo).success) return NextResponse.json({ ok: false, erro: "nao_encontrado" }, { status: 404 });
  const depois = request.nextUrl.searchParams.get("depois");
  try {
    const r = await rpc<{ ok: boolean }>("dex_corre_chat_listar", {
      ...quem(s),
      p_codigo: grupo,
      p_depois: depois && !Number.isNaN(Date.parse(depois)) ? depois : null,
    });
    return NextResponse.json(r, { status: r.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return falha("chat:listar", e);
  }
}

export async function POST(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const limite = await rateLimit(`corre:chat:${s.participacao}`, 40, 60);
  if (!limite.ok) return NextResponse.json({ ok: false, erro: "limite" }, { status: 429 });

  const parsed = corpoSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, erro: "dados" }, { status: 422 });
  const a = parsed.data;

  try {
    let r: { ok: boolean; erro?: string };
    if (a.tipo === "enviar") {
      r = await rpc("dex_corre_chat_enviar", { ...quem(s), p_codigo: a.grupo, p_texto: a.texto });
    } else if (a.tipo === "editar") {
      r = await rpc("dex_corre_chat_editar", { ...quem(s), p_mensagem: a.mensagem, p_texto: a.texto });
    } else if (a.tipo === "apagar") {
      r = await rpc("dex_corre_chat_apagar", { ...quem(s), p_mensagem: a.mensagem });
    } else {
      r = await rpc("dex_corre_chat_reagir", { ...quem(s), p_mensagem: a.mensagem, p_emoji: a.emoji });
    }
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (e) {
    return falha(`chat:${a.tipo}`, e);
  }
}
