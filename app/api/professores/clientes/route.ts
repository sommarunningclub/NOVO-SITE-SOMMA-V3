import { type NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Espelha v0-sistema-somma-de-gestao-l7/app/api/professores/clientes/route.ts:
// vincula o aluno pagante ao professor em `professor_clients` (base do repasse R$50/aluno).
//
// PENDÊNCIA DE VALIDAÇÃO: o checkout do NOVO seleciona o professor por NOME
// (tabela professores_curriculo_assessoria), enquanto professor_clients.professor_id
// referencia a tabela `professors`. Aqui resolvemos professor_id por nome (ilike).
// Se os nomes não baterem entre as tabelas, o vínculo é ignorado (não bloqueia o checkout).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      professor_id,
      professor_nome,
      asaas_customer_id,
      customer_name,
      customer_email,
      customer_cpf_cnpj,
      tag,
    } = body as Record<string, string | undefined>;

    if (!customer_name) {
      return NextResponse.json({ error: "customer_name é obrigatório" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, linked: false, reason: "supabase-off" });
    }

    // Resolve professor_id (direto ou por nome em `professors`)
    let profId = professor_id ?? null;
    if (!profId && professor_nome) {
      const { data: prof } = await supabase
        .from("professors")
        .select("id")
        .ilike("name", professor_nome)
        .limit(1)
        .maybeSingle();
      profId = prof?.id ?? null;
    }
    if (!profId) {
      // Sem professor mapeável: não cria vínculo, mas não falha o checkout.
      return NextResponse.json({ success: true, linked: false, reason: "professor-not-found" });
    }

    // Reativação se já existir vínculo (professor_id, asaas_customer_id)
    if (asaas_customer_id) {
      const { data: existing } = await supabase
        .from("professor_clients")
        .select("id, status")
        .eq("professor_id", profId)
        .eq("asaas_customer_id", asaas_customer_id)
        .maybeSingle();

      if (existing) {
        if (existing.status === "active") {
          return NextResponse.json({ success: true, linked: true, reactivated: false });
        }
        await supabase
          .from("professor_clients")
          .update({
            status: "active",
            customer_name,
            customer_email: customer_email ?? "",
            customer_cpf_cnpj: customer_cpf_cnpj ?? null,
            tag: tag ?? "alunoprofessor",
            linked_at: new Date().toISOString(),
            unlinked_at: null,
          })
          .eq("id", existing.id);
        return NextResponse.json({ success: true, linked: true, reactivated: true });
      }
    }

    const { error } = await supabase.from("professor_clients").insert({
      professor_id: profId,
      asaas_customer_id: asaas_customer_id ?? null,
      customer_name,
      customer_email: customer_email ?? "",
      customer_cpf_cnpj: customer_cpf_cnpj ?? null,
      status: "active",
      tag: tag ?? "alunoprofessor",
      linked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[professores/clientes] Erro ao vincular:", error);
      return NextResponse.json({ success: false, error: "Erro ao vincular" }, { status: 400 });
    }
    return NextResponse.json({ success: true, linked: true });
  } catch (err) {
    console.error("[professores/clientes] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
