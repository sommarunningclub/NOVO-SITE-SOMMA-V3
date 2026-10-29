/**
 * Números agregados da página do parceiro: ritmo das inscrições, sexo e
 * pelotões do evento aberto. Só contagens: nenhum dado de pessoa sai daqui.
 *
 * Datas e horas no fuso de Brasília (a lista guarda timestamptz em UTC).
 */
export interface LinhaInscricao {
  data_hora_checkin: string | null;
  sexo: string | null;
  pelotao: string | null;
}

export interface Fatia {
  rotulo: string;
  total: number;
}

export interface ResumoInscricoes {
  /** Um ponto por dia, do primeiro inscrito até o último, dias sem inscrição incluídos. */
  porDia: { dia: string; total: number }[];
  /** Horas do dia (Brasília) da primeira à última com inscrição. */
  porHora: { hora: number; total: number }[];
  diaPico: { dia: string; total: number } | null;
  horaPico: { hora: number; total: number } | null;
  porSexo: Fatia[];
  porPelotao: Fatia[];
}

const FUSO = "America/Sao_Paulo";

function diaBrasilia(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date(iso));
}

function horaBrasilia(iso: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: FUSO, hour: "2-digit", hourCycle: "h23" }).format(new Date(iso)));
}

function proximoDia(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** "masculino"/"M" → Masculino, "feminino"/"F" → Feminino; o resto não foi informado. */
export function rotuloSexo(v: string | null): string {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "masculino" || s === "m") return "Masculino";
  if (s === "feminino" || s === "f") return "Feminino";
  return "Não informado";
}

/** "4km" → "4 km"; vazio vira "Sem pelotão". */
export function rotuloPelotao(v: string | null): string {
  const s = String(v ?? "").trim();
  if (!s) return "Sem pelotão";
  const km = s.match(/^(\d+(?:[.,]\d+)?)\s*km$/i);
  return km ? `${km[1].replace(".", ",")} km` : s;
}

export function resumirInscricoes(linhas: LinhaInscricao[], pelotoesDoEvento: string[] = []): ResumoInscricoes {
  const dias = new Map<string, number>();
  const horas = new Map<number, number>();
  for (const l of linhas) {
    if (!l.data_hora_checkin) continue;
    const dia = diaBrasilia(l.data_hora_checkin);
    const hora = horaBrasilia(l.data_hora_checkin);
    dias.set(dia, (dias.get(dia) ?? 0) + 1);
    horas.set(hora, (horas.get(hora) ?? 0) + 1);
  }

  const porDia: ResumoInscricoes["porDia"] = [];
  const ordenados = [...dias.keys()].sort();
  if (ordenados.length) {
    for (let d = ordenados[0]; d <= ordenados[ordenados.length - 1]; d = proximoDia(d)) {
      porDia.push({ dia: d, total: dias.get(d) ?? 0 });
    }
  }

  const porHora: ResumoInscricoes["porHora"] = [];
  const hs = [...horas.keys()];
  if (hs.length) {
    for (let h = Math.min(...hs); h <= Math.max(...hs); h++) porHora.push({ hora: h, total: horas.get(h) ?? 0 });
  }

  // Em empate, o primeiro (mais cedo) vence: é quando o pico começou.
  const maior = <T extends { total: number }>(xs: T[]) => xs.reduce<T | null>((m, x) => (!m || x.total > m.total ? x : m), null);

  const sexo = new Map<string, number>();
  const pelotao = new Map<string, number>();
  for (const l of linhas) {
    const s = rotuloSexo(l.sexo);
    sexo.set(s, (sexo.get(s) ?? 0) + 1);
    const p = rotuloPelotao(l.pelotao);
    pelotao.set(p, (pelotao.get(p) ?? 0) + 1);
  }

  const ordemSexo = ["Feminino", "Masculino", "Não informado"];
  const porSexo = ordemSexo
    .filter((r) => sexo.has(r))
    .map((r) => ({ rotulo: r, total: sexo.get(r)! }));

  // Pelotões do evento primeiro, na ordem da gestão e com zero se ninguém
  // escolheu; depois os que só existem na lista (edição manual) e por último
  // quem ficou sem pelotão.
  const doEvento = pelotoesDoEvento.map(rotuloPelotao).filter((r, i, a) => r !== "Sem pelotão" && a.indexOf(r) === i);
  const extras = [...pelotao.keys()].filter((r) => !doEvento.includes(r) && r !== "Sem pelotão").sort();
  const porPelotao = [...doEvento, ...extras, ...(pelotao.has("Sem pelotão") ? ["Sem pelotão"] : [])].map((r) => ({
    rotulo: r,
    total: pelotao.get(r) ?? 0,
  }));

  return {
    porDia,
    porHora,
    diaPico: porDia.length ? maior(porDia) : null,
    horaPico: porHora.length ? maior(porHora) : null,
    porSexo,
    porPelotao,
  };
}
