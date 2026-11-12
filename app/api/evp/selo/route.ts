import { NextResponse, type NextRequest } from "next/server";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { fonteDaOrigem, novoSelo } from "@/lib/evp/inscricao";
import { origemSchema } from "@/lib/evp/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Chamada quando a pessoa começa a preencher. Devolve o selo que a inscrição
 * exige e conta o início de formulário no funil do painel.
 */
export async function POST(req: NextRequest) {
  const limite = await rateLimit(`evp:selo:${clientIp(req)}`, 30, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }
  const corpo = await req.json().catch(() => ({}));
  const origem = origemSchema.safeParse(corpo?.origem);
  if (corpo?.contar !== false) {
    try {
      await rpc("evp_registrar_funil", {
        p_slug: SLUG,
        p_origem: fonteDaOrigem(origem.success ? origem.data : null),
        p_tipo: "inicio_form",
      });
    } catch {
      /* segue sem contar */
    }
  }
  return NextResponse.json({ selo: novoSelo() }, { headers: { "Cache-Control": "no-store" } });
}
