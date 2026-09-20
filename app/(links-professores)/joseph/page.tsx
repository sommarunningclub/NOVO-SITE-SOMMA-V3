import type { Metadata } from "next"
import { PaginaDoProfessor, metadataDoProfessor } from "../_components/PaginaDoProfessor"

export const metadata: Metadata = metadataDoProfessor("Joseph Pereira")

// Link oficial do professor Joseph Pereira: sommaclub.com.br/joseph
export default function Page() {
  return <PaginaDoProfessor nome="Joseph Pereira" />
}
