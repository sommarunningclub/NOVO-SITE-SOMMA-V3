import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Verifica se o CPF existe em `cadastro_site` (benefício Evolve — só membros).
// Usa service-role (bypassa RLS). Sem interpolação crua do input.
export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json();
    if (!cpf) {
      return NextResponse.json({ found: false, error: "CPF não informado" }, { status: 400 });
    }

    const cpfDigits = String(cpf).replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      return NextResponse.json({ found: false, error: "CPF inválido" }, { status: 400 });
    }
    const cpfFormatted = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ found: false, error: "Erro de configuração" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("cadastro_site")
      .select("cpf")
      .in("cpf", [cpfDigits, cpfFormatted])
      .limit(1);

    if (error) {
      console.error("[verify-cpf] Erro ao buscar CPF:", error);
      return NextResponse.json({ found: false, error: "Erro ao validar" }, { status: 500 });
    }

    return NextResponse.json({ found: Boolean(data && data.length > 0) });
  } catch (error) {
    console.error("[verify-cpf] Erro interno:", error);
    return NextResponse.json({ found: false, error: "Erro interno" }, { status: 500 });
  }
}
