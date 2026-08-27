import { authConfigured, envSugerida, getOperatorSession } from "@/lib/o-longao/auth";
import { Login } from "./_components/Login";
import { Painel } from "./_components/Painel";

export const dynamic = "force-dynamic";

export default async function LongaoAdminPage() {
  const session = await getOperatorSession();
  if (!session) return <Login configurado={authConfigured()} envVar={envSugerida()} />;
  return <Painel />;
}
