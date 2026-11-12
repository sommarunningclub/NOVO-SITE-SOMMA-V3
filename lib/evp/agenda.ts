import { NOME_EVENTO, SLUG, URL_LP } from "./config";

/**
 * Links de agenda do Meeting. Só existem quando a data está confirmada no
 * painel: sem `starts_at`, as funções devolvem null e a página esconde o botão.
 * Pode ser importado no cliente.
 */

type Quando = { starts_at: string | null; ends_at: string | null; local_nome: string | null; endereco: string | null };

const DESCRICAO = `Meeting Técnico da Maratona Monumental de Brasília 2026, com o SOMMA Club e a BORA Assessoria. Leve o QR Code do seu ingresso. Detalhes: ${URL_LP}`;

function intervalo(q: Quando): { inicio: string; fim: string } | null {
  if (!q.starts_at) return null;
  const inicio = new Date(q.starts_at);
  if (Number.isNaN(inicio.getTime())) return null;
  // Sem horário de término cadastrado, a agenda reserva duas horas.
  const fim = q.ends_at ? new Date(q.ends_at) : new Date(inicio.getTime() + 2 * 3_600_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

const local = (q: Quando) => [q.local_nome, q.endereco].filter(Boolean).join(", ");

export function linkGoogleAgenda(q: Quando): string | null {
  const i = intervalo(q);
  if (!i) return null;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: NOME_EVENTO,
    dates: `${i.inicio}/${i.fim}`,
    details: DESCRICAO,
    location: local(q),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function arquivoIcs(q: Quando): string | null {
  const i = intervalo(q);
  if (!i) return null;
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SOMMA Club//Meeting Tecnico//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${SLUG}@sommaclub.com.br`,
    `DTSTAMP:${i.inicio}`,
    `DTSTART:${i.inicio}`,
    `DTEND:${i.fim}`,
    `SUMMARY:${esc(NOME_EVENTO)}`,
    `DESCRIPTION:${esc(DESCRICAO)}`,
    `LOCATION:${esc(local(q))}`,
    `URL:${URL_LP}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hoje tem Meeting Técnico da Monumental",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
