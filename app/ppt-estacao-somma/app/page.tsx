import type { Metadata, Viewport } from "next";
import { AppEstacao } from "../_app";

/**
 * Experiência da camada digital no telefone de quem assiste à apresentação.
 *
 * Aberta pelo QR code do slide "Camada digital". Não passa pelo código de
 * acesso do deck: é só o protótipo navegável, sem o conteúdo da proposta.
 */

export const metadata: Metadata = {
  title: "Estação SOMMA · app",
  description: "Protótipo navegável da camada digital da Estação SOMMA, powered by Evolve.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0A",
};

export default function AppEstacaoPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0A0A0A] text-[#F5F3EF] antialiased">
      {/* No telefone ocupa a tela inteira; no desktop vira um aparelho centralizado. */}
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col sm:justify-center sm:py-10">
        <AppEstacao cheio />
      </div>
    </main>
  );
}
