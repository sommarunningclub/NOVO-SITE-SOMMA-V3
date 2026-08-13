import { redirect } from "next/navigation";
import { authConfigured, getOperatorSession } from "@/lib/desafio-esteiras/auth";
import { Login } from "./_components/Login";
import { Dashboard } from "./_components/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getOperatorSession();
  if (!session) return <Login configurado={authConfigured()} />;

  // O painel geral é da organização. A unidade tem a página dela, com os
  // números da própria casa.
  if (session.role === "unidade" && session.unitId) {
    redirect(`/admin/desafio-das-esteiras/inscritos/${session.unitId}`);
  }

  return <Dashboard session={session} />;
}
