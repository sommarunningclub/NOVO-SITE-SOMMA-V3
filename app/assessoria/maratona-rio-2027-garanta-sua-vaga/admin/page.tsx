import { redirect } from "next/navigation";

/** A gestão das inscrições virou uma aba do painel da Maratona do Rio 2027. */
export default function AdminInscricoesPage() {
  redirect("/assessoria/maratona-rio-2027/admin?aba=inscricoes");
}
