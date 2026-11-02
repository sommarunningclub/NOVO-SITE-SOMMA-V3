import type { SupabaseClient } from "@supabase/supabase-js";
import { destinoDaTransferencia, parseTransferencias } from "@/lib/dexcomplica-love-run/transferencia";

/**
 * Transferências feitas pela página do evento (Love Run): ficam no histórico
 * da própria inscrição (`evento_participantes.metadata.transferencias`), não
 * na tabela `transferencias` do fluxo do Wings. Aqui viram o mesmo formato da
 * lista do Insider Connect.
 *
 * As primeiras transferências só guardaram os CPFs. Nome e e-mail de quem
 * passou a vaga saem do cadastro de pessoas (`cadastro_site`, pelo CPF); os
 * de quem recebeu, do titular atual quando é a última da lista.
 */
export interface TransferenciaLista {
  id: string;
  evento_id: string;
  inscricao_original_id: string;
  inscricao_nova_id: string;
  cpf_origem: string;
  cpf_destino: string;
  email_origem: string;
  email_destino: string;
  nome_origem: string;
  nome_destino: string;
  origem: "usuario" | "admin";
  admin_user_id: string | null;
  created_at: string;
}

export async function transferenciasDasInscricoes(
  supabase: SupabaseClient,
  eventoId: string
): Promise<TransferenciaLista[]> {
  const { data, error } = await supabase
    .from("evento_participantes")
    .select("id, nome_completo, email, metadata")
    .eq("evento_id", eventoId)
    .not("metadata->transferencias", "is", null);
  if (error || !data?.length) return [];

  const linhas: TransferenciaLista[] = [];
  for (const p of data) {
    const lista = parseTransferencias(p.metadata);
    lista.forEach((t, i) => {
      const destino = destinoDaTransferencia(t, { nome: p.nome_completo, email: p.email }, i === lista.length - 1);
      linhas.push({
        id: `${p.id}:${i}`,
        evento_id: eventoId,
        inscricao_original_id: p.id,
        inscricao_nova_id: p.id,
        cpf_origem: t.cpf_origem,
        cpf_destino: t.cpf_destino,
        email_origem: t.email_origem ?? "",
        email_destino: destino.email ?? "",
        nome_origem: t.nome_origem ?? "",
        nome_destino: destino.nome,
        origem: "usuario",
        admin_user_id: null,
        created_at: t.em,
      });
    });
  }

  const semDados = [...new Set(linhas.flatMap((l) => [!l.nome_origem && l.cpf_origem, !l.nome_destino && l.cpf_destino]).filter(Boolean))] as string[];
  if (semDados.length) {
    const { data: pessoas } = await supabase.from("cadastro_site").select("nome_completo, email, cpf_digits").in("cpf_digits", semDados);
    const porCpf = new Map((pessoas ?? []).map((x) => [String(x.cpf_digits), x]));
    for (const l of linhas) {
      const o = porCpf.get(l.cpf_origem);
      if (!l.nome_origem && o) Object.assign(l, { nome_origem: o.nome_completo ?? "", email_origem: l.email_origem || o.email || "" });
      const d = porCpf.get(l.cpf_destino);
      if (!l.nome_destino && d) Object.assign(l, { nome_destino: d.nome_completo ?? "", email_destino: l.email_destino || d.email || "" });
    }
  }
  return linhas;
}

/** Mesma busca da tabela (nome, CPF ou e-mail de origem ou destino). */
export function bateBusca(t: TransferenciaLista, busca: string): boolean {
  const b = busca.trim().toLowerCase();
  if (!b) return true;
  const digitos = b.replace(/\D/g, "");
  return (
    [t.nome_origem, t.nome_destino, t.email_origem, t.email_destino].some((v) => v.toLowerCase().includes(b)) ||
    (digitos.length > 0 && [t.cpf_origem, t.cpf_destino].some((c) => c.includes(digitos)))
  );
}
