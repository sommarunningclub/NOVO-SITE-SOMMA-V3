/** Links de agenda do corre. Pode ser importado no cliente. */

type Quando = { data: string; horario: string; local: string };

const DESCRICAO =
  "Corre do SOMMA Club com a BORA Assessoria e o Yann Rodrigues. Ingresso e detalhes: https://sommaclub.com.br/boracomsomma";

/** Brasília é UTC-3 o ano todo: 07:00 local vira 10:00Z. Duas horas de corre. */
function intervalo({ data, horario }: Quando) {
  const [h, m] = horario.split(":").map(Number);
  const [y, mo, d] = data.split("-").map(Number);
  const inicio = new Date(Date.UTC(y, mo - 1, d, h + 3, m));
  const fim = new Date(inicio.getTime() + 2 * 3_600_000);
  const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

export function linkGoogleAgenda(q: Quando) {
  const { inicio, fim } = intervalo(q);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: "BORA com SOMMA",
    dates: `${inicio}/${fim}`,
    details: DESCRICAO,
    location: q.local,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function arquivoIcs(q: Quando) {
  const { inicio, fim } = intervalo(q);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SOMMA Club//BORA com SOMMA//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:boracomsomma-${q.data}@sommaclub.com.br`,
    `DTSTAMP:${inicio}`,
    `DTSTART:${inicio}`,
    `DTEND:${fim}`,
    "SUMMARY:BORA com SOMMA",
    `DESCRIPTION:${esc(DESCRICAO)}`,
    `LOCATION:${esc(q.local)}`,
    "URL:https://sommaclub.com.br/boracomsomma",
    "BEGIN:VALARM",
    "TRIGGER:-PT12H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Amanhã tem BORA com SOMMA",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
