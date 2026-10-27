import { textoIcs } from "@/lib/dexcomplica-love-run/agenda";

/**
 * O evento em .ics para Apple Calendar, Outlook e afins. Genérico (sem dado
 * de ninguém): é o link usado na LP e no e-mail. O ingresso gera o próprio
 * .ics no aparelho, com o link pessoal na descrição.
 */
export const revalidate = 3600;

export function GET() {
  return new Response(textoIcs(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dexcomplica-love-run.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
