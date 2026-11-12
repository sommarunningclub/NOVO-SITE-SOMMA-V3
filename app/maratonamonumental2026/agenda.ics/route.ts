import { arquivoIcs } from "@/lib/evp/agenda";
import { lerEventoPublico } from "@/lib/evp/db";

export const dynamic = "force-dynamic";

/** Convite de agenda. Só existe com a data confirmada no painel. */
export async function GET() {
  const evento = await lerEventoPublico();
  const ics = evento ? arquivoIcs(evento) : null;
  if (!ics) return new Response("A data do Meeting ainda não foi confirmada.", { status: 404 });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="meeting-tecnico-monumental.ics"',
      "Cache-Control": "no-store",
    },
  });
}
