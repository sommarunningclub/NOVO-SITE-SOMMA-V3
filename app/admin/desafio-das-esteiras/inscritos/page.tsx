import { authConfigured, getOperatorSession } from "@/lib/desafio-esteiras/auth";
import { Login } from "../_components/Login";
import { Inscritos } from "../_components/Inscritos";

export const dynamic = "force-dynamic";

export default async function InscritosPage() {
  const session = await getOperatorSession();
  if (!session) return <Login configurado={authConfigured()} />;
  return <Inscritos session={session} />;
}
