import type { Metadata } from "next"
import { PaginaDoProfessor, metadataDoProfessor } from "../_components/PaginaDoProfessor"

export const metadata: Metadata = metadataDoProfessor("Alexandre Alves")

// Link oficial do professor Alexandre Alves: sommaclub.com.br/alexandre
export default function Page() {
  return <PaginaDoProfessor nome="Alexandre Alves" />
}
