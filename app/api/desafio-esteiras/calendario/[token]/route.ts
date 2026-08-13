import { NextResponse } from "next/server";
import { getTicketByToken } from "@/lib/desafio-esteiras/db";
import { EVENT, EVENT_PATH, SITE_URL, getUnit } from "@/lib/desafio-esteiras/event.config";

export const dynamic = "force-dynamic";

/** Data ISO → formato do iCalendar em UTC (20260819T220000Z). */
function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545: escapa vírgula, ponto-e-vírgula, barra e quebra de linha. */
function escape(texto: string): string {
  return texto.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/**
 * Arquivo .ics do participante. Servido por rota (e não gerado por Blob no
 * cliente) porque o Safari do iOS abre `text/calendar` direto no app Calendário
 * — o download de blob, não.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ticket = await getTicketByToken(token);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado." }, { status: 404 });
  }

  const unit = getUnit(ticket.unit_id);
  const url = `${SITE_URL}${EVENT_PATH}/confirmado/${token}`;

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SOMMA Club//Desafio das Esteiras//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ticket.ticket_code}@sommaclub.com.br`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(EVENT.inicioISO)}`,
    `DTEND:${icsDate(EVENT.fimISO)}`,
    `SUMMARY:${escape(`${EVENT.nome} na ${unit?.nome ?? "Evolve"}`)}`,
    `DESCRIPTION:${escape(
      `Seu ticket: ${ticket.ticket_code}\nApresente o QR Code na entrada.\n${url}`
    )}`,
    `LOCATION:${escape(unit?.endereco ?? "")}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(`${EVENT.nome} hoje às ${EVENT.horaExtenso}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="desafio-das-esteiras-${ticket.ticket_code}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
