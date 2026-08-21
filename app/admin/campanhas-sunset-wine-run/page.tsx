import { authConfigured, getSession } from "@/lib/campanhas/auth";
import { Login } from "../campanhas/_components/Login";
import { PainelSunsetWineRun } from "./_components/Painel";

export const dynamic = "force-dynamic";

export default async function CampanhasSunsetWineRunPage() {
  const session = await getSession();
  if (!session) return <Login configurado={authConfigured()} />;
  return <PainelSunsetWineRun />;
}
