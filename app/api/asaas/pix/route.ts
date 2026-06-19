import { type NextRequest, NextResponse } from "next/server"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID é obrigatório" }, { status: 400 })
    }

    // Buscar QR Code Pix
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY || "",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Asaas] Error getting pix qrcode:", data)
      return NextResponse.json(
        { error: data.errors?.[0]?.description || "Erro ao gerar QR Code" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
