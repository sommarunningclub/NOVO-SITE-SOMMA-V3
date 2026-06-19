import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nome,
      email,
      telefone,
      cpf,
      rua,
      numero,
      bairro,
      cidade,
      cep,
      estado,
      veste,
      professor,
      tipo_plano,
      valor,
      forma_pagamento,
      status_pagamento,
    } = body

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json({ error: "Configuração ausente" }, { status: 500 })
    }

    const today = new Date().toISOString().split("T")[0]
    const diaVencimento = new Date().getDate()

    const { data, error } = await supabase
      .from("gestao-clientes-assessoria")
      .insert({
        nome,
        email,
        telefone: telefone?.replace(/\D/g, "") || null,
        cpf: cpf?.replace(/\D/g, "") || null,
        rua: rua || null,
        numero: numero || null,
        bairro: bairro || null,
        cidade: cidade || null,
        cep: cep?.replace(/\D/g, "") || null,
        estado: estado || null,
        veste: veste || null,
        professor: professor || null,
        tipo_plano,
        valor,
        forma_pagamento: forma_pagamento || "Cartão de Crédito",
        status: status_pagamento || "Pago",
        data_entrada: today,
        dia_vencimento: diaVencimento,
        contrato_assinado: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[Supabase] Erro ao inserir cliente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[Supabase] Cliente inserido:", data?.id)
    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error("[Supabase] Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
