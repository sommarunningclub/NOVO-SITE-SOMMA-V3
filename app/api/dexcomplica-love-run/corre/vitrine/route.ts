import { NextRequest, NextResponse } from "next/server";
import { SLUG, falha, lerSessao, quem, rpc, semSessao } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

const POR_PAGINA = 12;

export async function GET(request: NextRequest) {
  const s = await lerSessao();
  if (!s) return semSessao();
  const q = request.nextUrl.searchParams;
  const tamanho = q.get("tamanho");
  try {
    const r = await rpc<object>("dex_corre_vitrine", {
      p_slug: SLUG,
      ...quem(s),
      p_filtros: {
        pelotao: (q.get("pelotao") ?? "").slice(0, 20),
        tamanho: tamanho && ["2", "3", "4"].includes(tamanho) ? tamanho : "",
        com_vagas: q.get("com_vagas") === "1",
        busca: (q.get("busca") ?? "").slice(0, 60),
      },
      p_limite: POR_PAGINA,
      p_offset: Math.max(0, Math.min(Number(q.get("offset")) || 0, 100000)),
    });
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return falha("vitrine", e);
  }
}
