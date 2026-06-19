import { type NextRequest, NextResponse } from "next/server"
import { resolveGroupName } from "@/lib/asaas/groups"

const ASAAS_API_URL = "https://api.asaas.com/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, cpfCnpj, phone, postalCode, addressNumber, professor } = body

    // Vincula o cliente ao grupo do professor escolhido (se reconhecido)
    const groupName = resolveGroupName(professor)

    // Criar cliente no Asaas
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY || "",
      },
      body: JSON.stringify({
        name,
        email,
        cpfCnpj: cpfCnpj.replace(/\D/g, ""),
        phone: phone?.replace(/\D/g, ""),
        postalCode: postalCode?.replace(/\D/g, ""),
        addressNumber,
        ...(groupName && { groupName }),
        notificationDisabled: false,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Asaas] Error creating customer:", data)
      return NextResponse.json(
        { error: data.errors?.[0]?.description || "Erro ao criar cliente" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Asaas] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
