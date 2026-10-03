import { NextResponse, type NextRequest } from "next/server";
import { searchCatalog } from "@/lib/shopify";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Busca enquanto digita (overlay da loja). Passa pelo servidor para o token da
 * Storefront não ir ao navegador. Nunca usa cache e só devolve o que a tela
 * mostra.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ products: [], collections: [], suggestions: [] });

  const limit = await rateLimit(`loja:busca:${clientIp(request)}`, 60, 60);
  if (!limit.ok) {
    return NextResponse.json({ error: "Muitas buscas. Tente de novo em instantes." }, { status: 429 });
  }

  try {
    const results = await searchCatalog(q);
    return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Busca indisponível agora." }, { status: 503 });
  }
}
