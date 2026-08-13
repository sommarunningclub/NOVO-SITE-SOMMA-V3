import { authConfigured, getOperatorSession } from "@/lib/desafio-esteiras/auth";
import { Login } from "../_components/Login";
import { CheckinScanner } from "../_components/CheckinScanner";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const session = await getOperatorSession();
  if (!session) return <Login configurado={authConfigured()} />;
  return <CheckinScanner session={session} />;
}
