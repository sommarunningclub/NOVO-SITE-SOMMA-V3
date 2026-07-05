import { NextRequest, NextResponse } from "next/server";
import { getEmailFrom, getResendClient, isResendConfigured } from "@/lib/resend";

export const dynamic = "force-dynamic";

/** GET — verifica se o Resend está configurado (sem enviar e-mail). */
export async function GET() {
  return NextResponse.json({
    configured: isResendConfigured(),
    from: getEmailFrom() ?? null,
  });
}

/** POST — envia e-mail de teste (somente em desenvolvimento). */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Indisponível em produção." }, { status: 403 });
  }

  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    return NextResponse.json(
      { error: "RESEND_API_KEY ou VIP_EMAIL_FROM não configurados." },
      { status: 500 }
    );
  }

  let to = "contato@sommaclub.com.br";
  try {
    const body = await request.json();
    if (typeof body.to === "string" && body.to.includes("@")) {
      to = body.to;
    }
  } catch {
    // body opcional
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Teste Resend — Somma Club",
    html: "<p>Integração Resend funcionando corretamente.</p>",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: data?.id, to });
}
