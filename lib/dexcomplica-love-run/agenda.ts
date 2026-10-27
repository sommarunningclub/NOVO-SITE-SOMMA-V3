import { APOIO, CHAMADA, DATA_ISO, EVENTO_NOME, EVENTO_URL, HORARIO, LOCAL_AFTER, LOCAL_CORRE } from "./event.config";

/**
 * "Adicionar à agenda": Google Agenda por link e .ics (Apple, Outlook e o
 * resto) por arquivo.
 *
 * Enquanto o horário não está confirmado o evento é de DIA INTEIRO: a agenda
 * não pode prometer uma hora que a página não promete. Quando
 * `HORARIO.concentracao` for preenchido ("07h00"), vira evento com hora
 * (Brasília, sem horário de verão desde 2019), com 1 h de duração, só para
 * marcar a chegada.
 */

const DIA = DATA_ISO.replace(/-/g, ""); // 20261107

function diaSeguinte(): string {
  const d = new Date(`${DATA_ISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** "07h00" → ["20261107T100000Z", "20261107T110000Z"] (UTC). */
function intervaloComHora(): [string, string] | null {
  const m = HORARIO.concentracao?.match(/^(\d{1,2})h(\d{2})?$/);
  if (!m) return null;
  const inicio = new Date(`${DATA_ISO}T${m[1].padStart(2, "0")}:${m[2] ?? "00"}:00-03:00`);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [f(inicio), f(fim)];
}

function descricao(urlIngresso?: string): string {
  return [
    `${CHAMADA} ${APOIO}`,
    "",
    `Encontro: ${LOCAL_CORRE.nome}.`,
    `Depois do corre: after no ${LOCAL_AFTER.nome} (leve roupa de banho e uma segunda roupa).`,
    HORARIO.concentracao ? "" : "Horário: a confirmar, acompanhe na página do evento.",
    "",
    urlIngresso ? `Seu ingresso (QR Code): ${urlIngresso}` : `Inscrição e ingresso: ${EVENTO_URL}`,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
}

const LOCAL = `${LOCAL_CORRE.nome}, Brasília - DF`;

export function urlGoogleAgenda(urlIngresso?: string): string {
  const hora = intervaloComHora();
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENTO_NOME,
    dates: hora ? `${hora[0]}/${hora[1]}` : `${DIA}/${diaSeguinte()}`,
    details: descricao(urlIngresso),
    location: LOCAL,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Dobra em 75 octetos (RFC 5545), sem partir caractere multibyte. */
function dobrar(linha: string): string {
  const partes: string[] = [];
  let atual = "";
  let bytes = 0;
  for (const ch of linha) {
    const n = new TextEncoder().encode(ch).length;
    if (bytes + n > (partes.length ? 74 : 75)) {
      partes.push(atual);
      atual = "";
      bytes = 0;
    }
    atual += ch;
    bytes += n;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

export function textoIcs(urlIngresso?: string): string {
  const hora = intervaloComHora();
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Somma Club//Dexcomplica Love Run//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:dexcomplica-love-run-20261107@sommaclub.com.br",
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    ...(hora ? [`DTSTART:${hora[0]}`, `DTEND:${hora[1]}`] : [`DTSTART;VALUE=DATE:${DIA}`, `DTEND;VALUE=DATE:${diaSeguinte()}`]),
    `SUMMARY:${esc(EVENTO_NOME)}`,
    `LOCATION:${esc(LOCAL)}`,
    `GEO:${LOCAL_CORRE.geo.lat};${LOCAL_CORRE.geo.lng}`,
    `DESCRIPTION:${esc(descricao(urlIngresso))}`,
    `URL:${urlIngresso ?? EVENTO_URL}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc("Amanhã tem Dexcomplica Love Run. Separe o tênis, a roupa de banho e a segunda roupa.")}`,
    // Dia inteiro: 12 h antes da meia-noite = meio-dia da véspera.
    `TRIGGER:${hora ? "-PT14H" : "-PT12H"}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
