import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ContratoAssessoria } from "@/components/contrato-assessoria";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Contrato de Prestação de Serviços | Assessoria Somma Club",
  description:
    "Contrato de Prestação de Serviços da Assessoria Somma Club — planos, pagamento, fidelidade, cancelamento, responsabilidade, uso de imagem e LGPD.",
  robots: { index: true, follow: true },
};

export default function ContratoPage() {
  return (
    <>
      <header className="border-b border-black/5">
        <div className="container-somma flex h-16 items-center justify-between md:h-20">
          <Link href="/" aria-label="Voltar para a home">
            <Image src="/logo-somma-dark.svg" alt="SOMMA Club" width={120} height={32} className="h-7 w-auto md:h-8" />
          </Link>
          <Link href="/assessoria" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Assessoria
          </Link>
        </div>
      </header>

      <main className="container-somma max-w-3xl py-14 md:py-20">
        <ContratoAssessoria />
      </main>
      <Footer />
    </>
  );
}
