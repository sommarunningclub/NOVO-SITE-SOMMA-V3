import { NextResponse, type NextRequest } from "next/server";
import { isValidCPF } from "@/lib/cpf";
import { exigir } from "@/lib/evp/auth";
import { SLUG } from "@/lib/evp/config";
import { hmacCpf } from "@/lib/evp/cripto";
import { rpc } from "@/lib/evp/db";
import { normalizarBusca } from "@/lib/evp/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Busca manual do credenciamento: nome (duas letras ou mais), código da
 * inscrição ou CPF inteiro. A resposta não traz e-mail nem telefone, e o CPF
 * aparece só com os dois dígitos finais.
 */
export async function GET(req: NextRequest) {
  const { sessao, negado } = await exigir("operador");
  if (negado) return negado;
  const limite = await rateLimit(`evp:busca:${sessao.id}:${clientIp(req)}`, 120, 600);
  if (!limite.ok) return NextResponse.json({ error: "Muitas buscas seguidas. Aguarde um instante." }, { status: 429 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  const digitos = q.replace(/\D/g, "");
  const porCpf = digitos.length === 11 && isValidCPF(digitos);
  if (!porCpf && q.length < 2) return NextResponse.json({ resultados: [] });

  try {
    const resultados = await rpc("evp_checkin_buscar", {
      p_slug: SLUG,
      p_termo: porCpf ? "" : normalizarBusca(q),
      p_cpf_hmac: porCpf ? hmacCpf(SLUG, digitos) : null,
    });
    return NextResponse.json({ resultados: resultados ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Busca indisponível. Tente de novo." }, { status: 503 });
  }
}
