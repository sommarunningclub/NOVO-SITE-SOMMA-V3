import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { buscarEvento } from "@/lib/boracomsomma/evento";
import { criarTokenIngresso } from "@/lib/boracomsomma/ingresso";
import { cpfValido, emailValido } from "@/lib/boracomsomma/validacao";

export const dynamic = "force-dynamic";

/**
 * Retirada do ingresso para quem perdeu o link: CPF + e-mail do check-in.
 * Os dois precisam bater; a resposta de erro é a mesma para "não achei" e
 * "e-mail não confere", para não confirmar que um CPF está inscrito.
 */

const NAO_ACHEI = "Não achamos um check-in com esse CPF e esse e-mail. Confira os dados ou faça o check-in.";

export async function POST(request: NextRequest) {
  const limite = await rateLimit(`boracomsomma:ingresso:${clientIp(request)}`, 10, 600);
  if (!limite.ok) {
    return NextResponse.json({ error: "Muitas tentativas seguidas. Espere alguns minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const cpf = typeof body?.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!cpfValido(cpf) || !emailValido(email)) {
    return NextResponse.json({ error: "Confira o CPF e o e-mail." }, { status: 400 });
  }

  const evento = await buscarEvento({ servidor: true });
  const supabase = getServiceSupabase();
  if (!evento.id || !supabase) return NextResponse.json({ error: NAO_ACHEI }, { status: 404 });

  const cpfMascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  const { data, error } = await supabase
    .from("checkins")
    .select("id, email")
    .eq("evento_id", evento.id)
    .or(`cpf.eq.${cpf},cpf.eq.${cpfMascarado}`)
    .order("data_hora_checkin", { ascending: false })
    .limit(5);
  if (error) {
    console.error("[boracomsomma] Falha na retirada do ingresso:", error.message);
    return NextResponse.json({ error: "Não deu para buscar agora. Tente de novo." }, { status: 500 });
  }
  const achado = (data ?? []).find((c) => String(c.email || "").trim().toLowerCase() === email);
  if (!achado) return NextResponse.json({ error: NAO_ACHEI }, { status: 404 });

  return NextResponse.json({ token: criarTokenIngresso(achado.id) });
}
