import Image from "next/image";
import type { ReactNode } from "react";

interface SurveyShellProps {
  rail?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Moldura da pesquisa. Celular: marca, progresso, pergunta, rodapé fixo.
 * Desktop: trilho de etapas à esquerda e a pergunta ocupando a coluna larga,
 * alinhada à esquerda, em vez de uma folha centralizada no meio do vazio.
 *
 * A marca não é link de propósito: um toque errado no topo não pode tirar
 * ninguém da pesquisa.
 */
export function SurveyShell({ rail, header, footer, children }: SurveyShellProps) {
  return (
    <div className="nps-root min-h-[100svh] bg-[#0b0b0c] text-[#f5f5f4] antialiased lg:grid lg:grid-cols-[minmax(300px,25rem)_minmax(0,1fr)]">
      <aside className="hidden bg-white/[0.025] lg:block">
        <div className="sticky top-0 flex h-[100svh] flex-col px-10 py-10 xl:px-14">
          {/* Bloco em volta da marca: solta na coluna flex, a imagem esticaria e ficaria centralizada. */}
          <div>
            <Marca />
          </div>
          <div className="mt-20 flex-1 overflow-y-auto">{rail}</div>
          <p className="max-w-[28ch] text-[13px] leading-relaxed text-white/55">
            Seu progresso fica salvo neste aparelho até o envio.
          </p>
        </div>
      </aside>

      <div className="flex min-h-[100svh] min-w-0 flex-col">
        {/* Fundo sólido: com transparência, o título rolado aparecia por baixo do progresso. */}
        <header className="sticky top-0 z-20 bg-[#0b0b0c] px-5 pt-[env(safe-area-inset-top)] sm:px-8 lg:static lg:bg-transparent lg:px-16 xl:px-24">
          <div className="flex h-14 items-center lg:hidden">
            <Marca />
          </div>
          {header ? <div className="max-w-[760px] pb-3 lg:pb-0 lg:pt-10">{header}</div> : null}
        </header>

        <main className="flex flex-1 flex-col px-5 sm:px-8 lg:px-16 xl:px-24">{children}</main>

        {footer}
      </div>
    </div>
  );
}

function Marca() {
  return (
    <Image src="/logo-somma.svg" alt="SOMMA Club" width={120} height={32} priority className="h-6 w-auto lg:h-7" />
  );
}
