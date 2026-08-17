import { authConfigured, getSession } from "@/lib/campanhas/auth";
import { Login } from "./_components/Login";
import { PainelCampanhas } from "./_components/Painel";

export const dynamic = "force-dynamic";

export default async function CampanhasAdminPage() {
  const session = await getSession();
  if (!session) return <Login configurado={authConfigured()} />;
  return <PainelCampanhas />;
}
