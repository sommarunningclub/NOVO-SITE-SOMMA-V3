import { NextResponse } from "next/server";
import { renderSommaDayTicketEmail } from "@/lib/emails/somma-day-ticket";

export const dynamic = "force-dynamic";

// Preview do e-mail — só existe fora de produção.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Não disponível", { status: 404 });
  }
  const html = renderSommaDayTicketEmail({
    nome: "Ana Carolina Ribeiro",
    ticketCode: "SD-8F4X29",
    urlTicket: "https://sommaclub.com.br/edicao-especial-set-2026/obrigado/exemplo",
    pelotao: "6km",
    qrSrc: "https://api.qrserver.com/v1/create-qr-code/?size=380x380&data=exemplo",
    logoSrc: "/somma-day/email/logo.png",
  });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
