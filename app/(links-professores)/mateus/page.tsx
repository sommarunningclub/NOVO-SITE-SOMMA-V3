import type { Metadata } from "next"
import { PaginaDoProfessor, metadataDoProfessor } from "../_components/PaginaDoProfessor"

export const metadata: Metadata = metadataDoProfessor("Mateus Fonseca")

// Link oficial do professor Mateus Fonseca: sommaclub.com.br/mateus
export default function Page() {
  return <PaginaDoProfessor nome="Mateus Fonseca" />
}
