import { type NextRequest, NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"
import { TABELA_TOKENS, VALIDADE_HORAS, gerarCodigo } from "@/lib/pix-automatico/tokens"

// Geração e listagem dos códigos que liberam o Pix Automático.
// Usada pela tela /admin/pix-automatico e disponível para o sistema de gestão
// (v0-sistema-somma-de-gestao-l7) chamar com o mesmo segredo.

// Fail-closed: sem o segredo configurado ninguém gera token. O contrário
// deixaria a geração aberta na internet.
function autorizado(request: NextRequest): boolean {
  const esperado = process.env.PIX_AUTOMATICO_ADMIN_SECRET
  if (!esperado) {
    console.error("[pix-automatico] PIX_AUTOMATICO_ADMIN_SECRET não configurado.")
    return false
  }
  const enviado =
    request.headers.get("x-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  return enviado === esperado
}

export async function POST(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Banco indisponível" }, { status: 500 })
  }

  let observacao: string | null = null
  let criadoPor = "site-admin"
  try {
    const body = await request.json()
    if (typeof body?.observacao === "string") observacao = body.observacao.slice(0, 200) || null
    if (typeof body?.criadoPor === "string" && body.criadoPor.trim()) {
      criadoPor = body.criadoPor.trim().slice(0, 40)
    }
  } catch {
    // corpo vazio é aceito: gera token sem observação
  }

  const expiraEm = new Date(Date.now() + VALIDADE_HORAS * 60 * 60 * 1000).toISOString()

  // O código é aleatório, mas a coluna é UNIQUE: em colisão (improvável), tenta
  // de novo em vez de estourar erro para o atendimento.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo()
    const { data, error } = await supabase
      .from(TABELA_TOKENS)
      .insert({ codigo, expira_em: expiraEm, criado_por: criadoPor, observacao })
      .select("codigo, criado_em, expira_em, observacao")
      .single()

    if (!error && data) {
      console.log("[pix-automatico] Token gerado por", criadoPor)
      return NextResponse.json({ token: data })
    }
    if (error && error.code !== "23505") {
      console.error("[pix-automatico] Erro ao gerar token:", error)
      return NextResponse.json({ error: "Erro ao gerar código" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Não foi possível gerar um código único" }, { status: 500 })
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Banco indisponível" }, { status: 500 })
  }

  const { data, error } = await supabase
    .from(TABELA_TOKENS)
    .select("codigo, criado_em, expira_em, usado_em, usado_por_nome, observacao, criado_por")
    .order("criado_em", { ascending: false })
    .limit(30)

  if (error) {
    console.error("[pix-automatico] Erro ao listar tokens:", error)
    return NextResponse.json({ error: "Erro ao listar códigos" }, { status: 500 })
  }

  return NextResponse.json({ tokens: data ?? [] })
}
