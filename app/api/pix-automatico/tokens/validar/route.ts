import { type NextRequest, NextResponse } from "next/server"
import { conferirToken, mensagemDoMotivo } from "@/lib/pix-automatico/tokens"

// Conferência do código digitado no checkout. NÃO consome o token: o consumo
// acontece só na hora de criar a autorização, para o cliente não perder o
// código se desistir antes de pagar.
export async function GET(request: NextRequest) {
  const codigo = new URL(request.url).searchParams.get("codigo") ?? ""
  const resultado = await conferirToken(codigo)

  if (!resultado.ok) {
    return NextResponse.json({ valido: false, error: mensagemDoMotivo(resultado.motivo) })
  }

  return NextResponse.json({ valido: true, expiraEm: resultado.expiraEm })
}
