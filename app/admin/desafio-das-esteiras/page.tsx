import { authConfigured, getOperatorSession } from "@/lib/desafio-esteiras/auth";
import { Login } from "./_components/Login";
import { Dashboard } from "./_components/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getOperatorSession();
  if (!session) return <Login configurado={authConfigured()} />;
  return <Dashboard session={session} />;
}
