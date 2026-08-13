import { redirect } from "next/navigation";
import { authConfigured, getOperatorSession } from "@/lib/desafio-esteiras/auth";
import { Login } from "../_components/Login";
import { Inscritos } from "../_components/Inscritos";

export const dynamic = "force-dynamic";

export default async function InscritosPage() {
  const session = await getOperatorSession();
  if (!session) return <Login configurado={authConfigured()} />;

  // A tela geral tem ações que este papel não pode executar. Em vez de mostrar
  // botões que a API vai recusar, mandamos para a página da unidade.
  if (session.role === "unidade" && session.unitId) {
    redirect(`/admin/desafio-das-esteiras/inscritos/${session.unitId}`);
  }

  return <Inscritos session={session} />;
}
