import { Suspense } from "react";
import { getStatsIniciais } from "@/lib/desafio-esteiras/db";
import { RegistrationFlow } from "./RegistrationFlow";

export const dynamic = "force-dynamic";

export default async function InscricaoPage() {
  const iniciais = await getStatsIniciais();

  return (
    <main className="min-h-[100svh]">
      <Suspense fallback={<Carregando />}>
        <RegistrationFlow iniciais={iniciais} />
      </Suspense>
    </main>
  );
}

function Carregando() {
  return (
    <div className="dst-wrap flex min-h-[70svh] items-center justify-center">
      <span className="dst-label text-[color:rgba(242,240,236,0.4)]">Carregando inscrição…</span>
    </div>
  );
}
