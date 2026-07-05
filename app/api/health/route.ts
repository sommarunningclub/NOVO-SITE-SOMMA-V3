import { NextResponse } from "next/server";
import { sendCadastroSiteWelcomeEmail } from "@/lib/emails/cadastro-site";

export const dynamic = "force-dynamic";

// Diagnóstico temporário. Só booleanos + teste de envio Resend (nunca expõe valores).
export async function GET(request: Request) {
  const has = (v?: string) => Boolean(v && v.length > 0);
  const env = {
    SUPABASE_SERVICE_ROLE_KEY: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ASAAS_API_KEY: has(process.env.ASAAS_API_KEY),
    RESEND_API_KEY: has(process.env.RESEND_API_KEY),
    VIP_EMAIL_FROM: has(process.env.VIP_EMAIL_FROM),
  };

  // Análise estrutural do VIP_EMAIL_FROM — NÃO expõe o valor, só o formato.
  const from = process.env.VIP_EMAIL_FROM || "";
  const fromShape = {
    length: from.length,
    startsWithQuote: /^["']/.test(from),
    endsWithQuote: /["']$/.test(from),
    hasAngleBrackets: from.includes("<") && from.includes(">"),
    hasAt: from.includes("@"),
    hasLeadingOrTrailingSpace: from !== from.trim(),
  };

  // ?email=1 → faz um envio de teste real via Resend (endereço de teste que sempre "entrega").
  const url = new URL(request.url);
  if (url.searchParams.get("email") === "1") {
    const result = await sendCadastroSiteWelcomeEmail({
      nome: "Teste Diagnóstico",
      email: "delivered@resend.dev",
    });
    return NextResponse.json({ env, fromShape, emailTest: result });
  }

  return NextResponse.json({ env, fromShape });
}
