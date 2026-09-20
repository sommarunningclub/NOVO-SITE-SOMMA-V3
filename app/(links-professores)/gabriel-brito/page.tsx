import type { Metadata } from "next"
import { PaginaDoProfessor, metadataDoProfessor } from "../_components/PaginaDoProfessor"

export const metadata: Metadata = metadataDoProfessor("Gabriel Brito")

// Link oficial do professor Gabriel Brito: sommaclub.com.br/gabriel-brito
export default function Page() {
  return <PaginaDoProfessor nome="Gabriel Brito" />
}
