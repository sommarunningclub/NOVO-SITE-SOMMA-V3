import type { Metadata } from "next";
import { EVENT_PATH, SITE_URL } from "@/lib/desafio-esteiras/event.config";
import { MeuCadastro } from "./MeuCadastro";

export const metadata: Metadata = {
  title: "Alterar meus dados | Desafio das Esteiras",
  description:
    "Atualize seus dados, sua unidade, sua categoria e sua foto de perfil no Desafio das Esteiras.",
  alternates: { canonical: `${SITE_URL}${EVENT_PATH}/meu-cadastro` },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="min-h-[100svh]">
      <MeuCadastro />
    </main>
  );
}
