const inteiro = new Intl.NumberFormat("pt-BR");

/** 4860 → "4.860" */
export function fmtInt(n: number): string {
  return inteiro.format(Math.round(n));
}

/** 33.8 → "33,8%" (casas decimais configuráveis) */
export function fmtPct(n: number | null | undefined, casas = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

/** 2.23 → "2,23" */
export function fmtDec(n: number, casas = 1): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** "2026-10-31" → "31/10/2026" */
export function fmtData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** "2026-10-31" → "31/10" */
export function fmtDiaMes(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-03" → "mar" */
export function fmtMes(anoMes: string): string {
  return MESES[Number(anoMes.slice(5, 7)) - 1] ?? anoMes;
}

/** Percentual de a sobre b, uma casa. */
export function pct(a: number, b: number): number {
  return b ? Math.round((a / b) * 1000) / 10 : 0;
}

/**
 * Reparte 100 pontos entre valores pelo maior resto (para waffles de 100):
 * a soma fecha sempre em 100.
 */
export function repartir100(valores: number[]): number[] {
  const total = valores.reduce((s, v) => s + v, 0) || 1;
  const brutos = valores.map((v) => (v / total) * 100);
  const base = brutos.map(Math.floor);
  let faltam = 100 - base.reduce((s, v) => s + v, 0);
  const ordem = brutos.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r);
  for (const { i } of ordem) {
    if (faltam <= 0) break;
    base[i]++;
    faltam--;
  }
  return base;
}
