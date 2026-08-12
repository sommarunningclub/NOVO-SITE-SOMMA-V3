import type { Metadata } from "next";
import { Gate } from "../_gate";
import { temAcesso } from "../auth";
import { UltraPassSim } from "../_ultra-pass-sim";

// Lê cookie, então a rota é sempre renderizada sob demanda.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simulação do Ultra Pass Pocket | Somma Club × Michelob Ultra",
  description: "Demonstração da mecânica do Ultra Pass Pocket proposta para as duas datas.",
  robots: { index: false, follow: false },
};

export default async function UltraPassSimPage() {
  // Mesma trava da proposta: o cookie vale para toda a rota.
  if (!(await temAcesso())) return <Gate />;
  return <UltraPassSim />;
}
