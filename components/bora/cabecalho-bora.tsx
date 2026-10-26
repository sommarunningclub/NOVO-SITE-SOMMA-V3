import Image from "next/image";
import Link from "next/link";

/** Faixa do topo das páginas da BORA: SOMMA Club × BORA. */
export function CabecalhoBora() {
  return (
    <header className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/" aria-label="SOMMA Club">
          <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} className="h-6 w-auto sm:h-7" />
        </Link>
        <span aria-hidden="true" className="font-bora text-lg font-bold text-white/30">
          ×
        </span>
        <Image src="/bora/logo-white.png" alt="BORA" width={640} height={164} className="h-5 w-auto sm:h-6" priority />
      </div>
      <span className="hidden font-bora text-xs font-bold uppercase tracking-[0.2em] text-bora sm:block">
        Assessoria oficial
      </span>
    </header>
  );
}
