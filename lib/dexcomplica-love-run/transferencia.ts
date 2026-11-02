/**
 * Histórico de transferência na metadata da inscrição.
 *
 * A vaga continua na MESMA linha de `evento_participantes`. Quem saiu só
 * aparece aqui: CPF (e, nas transferências novas, e-mail e nome) de origem
 * e de destino. Serve para a página “ingresso transferido” e para o acesso
 * com os dados de quem já passou a vaga.
 */

export type RegistroTransferencia = {
  em: string;
  cpf_origem: string;
  cpf_destino: string;
  email_origem?: string | null;
  nome_origem?: string | null;
  email_destino?: string | null;
  nome_destino?: string | null;
};

export type ReciboTransferencia = {
  nome: string;
  email: string | null;
  /** Acabou de transferir nesta sessão (copy “concluída”) vs. acesso depois. */
  agora: boolean;
};

function soDigitos(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

export function emailsIguais(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = (a ?? "").trim().toLowerCase();
  const y = (b ?? "").trim().toLowerCase();
  return Boolean(x) && x === y;
}

function texto(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export function parseTransferencias(meta: unknown): RegistroTransferencia[] {
  if (!meta || typeof meta !== "object") return [];
  const bruto = (meta as { transferencias?: unknown }).transferencias;
  if (!Array.isArray(bruto)) return [];
  const out: RegistroTransferencia[] = [];
  for (const item of bruto) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const cpfOrigem = soDigitos(r.cpf_origem);
    const cpfDestino = soDigitos(r.cpf_destino);
    if (cpfOrigem.length !== 11) continue;
    out.push({
      em: typeof r.em === "string" ? r.em : "",
      cpf_origem: cpfOrigem,
      cpf_destino: cpfDestino,
      email_origem: texto(r.email_origem)?.toLowerCase() ?? null,
      nome_origem: texto(r.nome_origem),
      email_destino: texto(r.email_destino)?.toLowerCase() ?? null,
      nome_destino: texto(r.nome_destino),
    });
  }
  return out;
}

export function cpfsAnteriores(meta: unknown): string[] {
  const set = new Set<string>();
  if (meta && typeof meta === "object") {
    const bruto = (meta as { cpfs_anteriores?: unknown }).cpfs_anteriores;
    if (Array.isArray(bruto)) {
      for (const c of bruto) {
        const d = soDigitos(c);
        if (d.length === 11) set.add(d);
      }
    }
  }
  for (const t of parseTransferencias(meta)) set.add(t.cpf_origem);
  return [...set];
}

/** Última vez que este CPF saiu da vaga (pode ter havido outra transferência depois). */
export function transferenciaDestaOrigem(lista: RegistroTransferencia[], cpf: string): RegistroTransferencia | null {
  const d = soDigitos(cpf);
  if (d.length !== 11) return null;
  return [...lista].reverse().find((t) => t.cpf_origem === d) ?? null;
}

export function destinoDaTransferencia(
  registro: RegistroTransferencia,
  titularAtual: { nome: string; email: string | null },
  ehUltimaDaLista: boolean
): { nome: string; email: string | null } {
  return {
    nome: registro.nome_destino || (ehUltimaDaLista ? titularAtual.nome : ""),
    email: registro.email_destino || (ehUltimaDaLista ? titularAtual.email : null),
  };
}
