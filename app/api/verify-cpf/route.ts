import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Verifica se o CPF existe em `cadastro_site` (benefício Evolve — só membros).
 * Usa service-role (bypassa RLS). Sem interpolação crua do input.
 *
 * A rota é, por natureza, um oráculo de "este CPF é membro?". Não dá para
 * fechá-la sem quebrar o benefício, então o que se pode fazer é encarecer a
 * varredura: cota por IP e tempo de resposta fixo, para achado e não-achado
 * saírem indistinguíveis no relógio.
 */
const ATRASO_MS = 300;

async function responder(inicio: number, corpo: Record<string, unknown>, status = 200) {
  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));
  return NextResponse.json(corpo, { status });
}

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`verify-cpf:${ip}`, 20, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { found: false, error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const { cpf } = await request.json();
    if (!cpf) {
      return responder(inicio, { found: false, error: "CPF não informado" }, 400);
    }

    const cpfDigits = String(cpf).replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return responder(inicio, { found: false, error: "CPF inválido" }, 400);
    }
    const cpfFormatted = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return responder(inicio, { found: false, error: "Erro de configuração" }, 500);
    }

    const { data, error } = await supabase
      .from("cadastro_site")
      .select("cpf")
      .in("cpf", [cpfDigits, cpfFormatted])
      .limit(1);

    if (error) {
      console.error("[verify-cpf] Erro ao buscar CPF:", error);
      return responder(inicio, { found: false, error: "Erro ao validar" }, 500);
    }

    return responder(inicio, { found: Boolean(data && data.length > 0) });
  } catch (error) {
    console.error("[verify-cpf] Erro interno:", error);
    return responder(inicio, { found: false, error: "Erro interno" }, 500);
  }
}
