/**
 * Datas do evento, sempre no horário de Brasília, qualquer que seja o fuso de
 * quem abre a página ou do servidor. Pode ser importado no cliente.
 */

const FUSO = "America/Sao_Paulo";

const parte = (opcoes: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes });

export function dataLonga(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const texto = parte({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function dataCurta(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return parte({ day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** 19h30 ou 19h. */
export function hora(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const [h, m] = parte({ hour: "2-digit", minute: "2-digit", hour12: false }).format(d).split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function horario(inicio: string | null | undefined, fim: string | null | undefined): string | null {
  const a = hora(inicio);
  if (!a) return null;
  const b = hora(fim);
  return b ? `${a} às ${b}` : a;
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return parte({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

/** ISO (UTC) para o valor de um <input type="datetime-local"> em Brasília. */
export function paraCampoLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(
    parte({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/** Valor de datetime-local (hora de Brasília, UTC-3 o ano todo) para ISO. */
export function deCampoLocal(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const d = new Date(`${valor}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function linkComoChegar(ev: { lat: number | null; lng: number | null; endereco: string | null; local_nome: string | null }): string | null {
  if (ev.lat !== null && ev.lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`;
  }
  const destino = [ev.local_nome, ev.endereco].filter(Boolean).join(", ");
  return destino ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}` : null;
}
