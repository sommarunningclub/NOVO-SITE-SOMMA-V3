import type { Metadata } from "next";
import Link from "next/link";
import { EVENT_PATH, EVENT_URL, EVENTO, FORMATO } from "@/lib/o-longao/config";
import { Wizard } from "./Wizard";

const TITLE = "Inscreva sua crew | O Longão";
const DESCRIPTION = `Inscrição das crews para O Longão: ${FORMATO.titulares} atletas, uma esteira Star Trac e a seletiva que decide quem vai às 24 horas. Evolve + Somma Club, ${EVENTO.cidade}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${EVENT_URL}/inscricao` },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${EVENT_URL}/inscricao`,
    siteName: "SOMMA Club",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

/**
 * A rota da inscrição tem cabeçalho próprio: sem menu e sem âncoras.
 * Quem chegou aqui veio preencher, e cada link a mais é uma chance de sair
 * no meio. A única saída é a volta explícita para a página do evento.
 */
export default function InscricaoPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:var(--noite)]/90 backdrop-blur">
        <div className="lgo-wrap flex min-h-[60px] items-center justify-between gap-4">
          <Link
            href={EVENT_PATH}
            className="lgo-label flex min-h-[44px] items-center gap-2 text-[color:rgba(242,240,236,0.6)]"
          >
            <span aria-hidden>←</span> O LONGÃO
          </Link>
          <p className="lgo-label text-[color:var(--sinal)]">INSCRIÇÃO DA CREW</p>
        </div>
      </header>

      <main>
        <Wizard />
      </main>
    </>
  );
}
