import type { Metadata } from "next";
import { EVENT_PATH, SITE_URL } from "@/lib/desafio-esteiras/event.config";

export const metadata: Metadata = {
  title: "Inscrição | Desafio das Esteiras — Evolve + SOMMA Club",
  description:
    "Escolha sua unidade Evolve, preencha seus dados e garanta seu ticket para o Desafio das Esteiras, dia 19 de agosto às 19h.",
  alternates: { canonical: `${SITE_URL}${EVENT_PATH}/inscricao` },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
