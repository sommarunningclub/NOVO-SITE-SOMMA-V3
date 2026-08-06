import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { partnerSchema } from "@/lib/validation";

// Candidatura de parceria (/seja-parceiro). Grava em duas tabelas do mesmo
// Supabase da GESTÃO (admin.sommaclub.com.br):
//   1. `candidatos_parceiros` — o registro completo da candidatura;
//   2. `crm_leads` — o lead que aparece no Kanban do CRM (coluna "Novo Lead").
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = partnerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    // Honeypot: se preenchido, é bot. Responde 200 silenciosamente sem gravar.
    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    const {
      nome,
      email,
      telefone,
      tipo_documento,
      documento,
      nome_da_empresa,
      instagram,
      descricao,
      razao_social,
      nome_fantasia,
      atividade_principal,
    } = parsed.data;

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Serviço indisponível no momento. Tente novamente em instantes." },
        { status: 503 }
      );
    }

    const documentoDigits = documento.replace(/\D/g, "");

    // Horário de Brasília, no mesmo formato usado pelo restante do site.
    const criadoEm =
      new Date()
        .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
        .replace(" ", "T") + "-03:00";

    const { data, error } = await supabase
      .from("candidatos_parceiros")
      .insert([
        {
          nome,
          email,
          telefone,
          tipo_documento,
          documento: documentoDigits,
          nome_da_empresa,
          razao_social: razao_social || null,
          nome_fantasia: nome_fantasia || null,
          atividade_principal: atividade_principal || null,
          instagram,
          descricao,
          criado_em: criadoEm,
        },
      ])
      .select();

    if (error) {
      console.error("[seja-parceiro] Erro ao inserir em candidatos_parceiros:", error);
      return NextResponse.json(
        { error: "Não foi possível salvar sua candidatura. Tente novamente." },
        { status: 500 }
      );
    }

    // `crm_leads` tem as colunas `company_name` (lida pelo admin) e
    // `nome_da_empresa` (legado). Gravamos nas duas: se só `nome_da_empresa` for
    // preenchida, o lead entra no Kanban com a empresa em branco.
    const { error: crmError } = await supabase.from("crm_leads").insert([
      {
        name: nome,
        email,
        phone: telefone,
        cnpj: tipo_documento === "cnpj" ? documentoDigits : null,
        company_name: nome_da_empresa,
        nome_da_empresa,
        description: descricao,
        stage: "novo_lead",
        position: 0,
        created_by: "website",
        origem: "site",
      },
    ]);

    // Falha no CRM não invalida a candidatura — ela já está em
    // `candidatos_parceiros` e pode ser recuperada de lá.
    if (crmError) {
      console.error(
        "[seja-parceiro] Lead NÃO sincronizado com o CRM (candidatura salva):",
        crmError
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[seja-parceiro] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
