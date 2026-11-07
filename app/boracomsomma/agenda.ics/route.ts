import { arquivoIcs } from "@/lib/boracomsomma/agenda";
import { buscarEvento } from "@/lib/boracomsomma/evento";

export const revalidate = 60;

/** Convite de agenda (.ics) do corre, com lembrete na véspera. */
export async function GET() {
  const ev = await buscarEvento();
  return new Response(arquivoIcs({ data: ev.data, horario: ev.horario, local: ev.local }), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bora-com-somma.ics"',
    },
  });
}
