import { authConfigured, getSession } from "@/lib/campanhas/auth";
import { Login } from "../campanhas/_components/Login";
import { PainelDesafioEsteiras } from "./_components/Painel";

export const dynamic = "force-dynamic";

export default async function CampanhasDesafioEsteirasPage() {
  const session = await getSession();
  if (!session) return <Login configurado={authConfigured()} />;
  return <PainelDesafioEsteiras />;
}
