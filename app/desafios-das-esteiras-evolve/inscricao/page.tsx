import { Suspense } from "react";
import { getEventStats } from "@/lib/desafio-esteiras/db";
import { UNITS } from "@/lib/desafio-esteiras/event.config";
import { RegistrationFlow } from "./RegistrationFlow";

export const dynamic = "force-dynamic";

export default async function InscricaoPage() {
  const stats = await getEventStats();

  const iniciais = {
    total: stats.total,
    unidades: stats.porUnidade.map((u) => {
      const unit = UNITS.find((x) => x.id === u.unitId)!;
      return { id: u.unitId, inscritos: u.inscritos, status: unit.status, capacidade: unit.capacidade };
    }),
    disponivel: stats.disponivel,
  };

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
