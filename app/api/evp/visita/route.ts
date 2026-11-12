import { NextResponse, type NextRequest } from "next/server";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { fonteDaOrigem } from "@/lib/evp/inscricao";
import { origemSchema } from "@/lib/evp/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Conta uma visita por sessão, agrupada por origem. Não guarda nada da pessoa. */
export async function POST(req: NextRequest) {
  const limite = await rateLimit(`evp:visita:${clientIp(req)}`, 30, 600);
  if (!limite.ok) return new NextResponse(null, { status: 204 });
  const corpo = await req.json().catch(() => ({}));
  const origem = origemSchema.safeParse(corpo?.origem);
  try {
    await rpc("evp_registrar_funil", {
      p_slug: SLUG,
      p_origem: fonteDaOrigem(origem.success ? origem.data : null),
      p_tipo: "visita",
    });
  } catch {
    /* contador fora do ar não é problema de quem visita */
  }
  return new NextResponse(null, { status: 204 });
}
