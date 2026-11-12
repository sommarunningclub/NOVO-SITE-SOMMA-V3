import type { Metadata, Viewport } from "next";
import { lerSessao } from "@/lib/evp/auth";
import { LoginEquipe } from "../admin/_components/LoginEquipe";
import { Credenciamento } from "./_components/Credenciamento";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Credenciamento | Meeting Técnico",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#080808", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Área da equipe. Operador e admin entram; sem sessão, só o login aparece. */
export default async function Pagina() {
  const sessao = await lerSessao();
  if (!sessao) return <LoginEquipe destino="credenciamento" />;
  return <Credenciamento sessao={sessao} />;
}
