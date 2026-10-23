import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { ASSESSORIA_FORA_DO_AR } from "@/lib/assessoria-status";

/**
 * Tela única de "Assessoria fora do ar": ocupa /assessoria, o /checkout e os
 * links de professor enquanto `ASSESSORIA_VENDAS_ABERTAS` for `false`.
 */
export function AssessoriaForaDoAr() {
  return (
    <main className="relative flex min-h-[100svh] flex-col bg-black text-white">
      <header className="container-somma flex h-16 items-center md:h-20">
        <Link href="/" aria-label="SOMMA Club">
          <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-7 w-auto md:h-8" />
        </Link>
      </header>

      <div className="container-somma flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] md:h-48 md:w-48">
          <Lock className="h-16 w-16 text-primary md:h-24 md:w-24" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h1 className="mt-10 text-4xl font-bold tracking-tight [text-wrap:balance] md:text-6xl">{ASSESSORIA_FORA_DO_AR}</h1>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para o SOMMA Club
        </Link>
      </div>
    </main>
  );
}
