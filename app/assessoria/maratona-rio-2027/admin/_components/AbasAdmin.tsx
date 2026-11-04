"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export type Aba = "intencao" | "inscricoes";

/**
 * Topo do painel da Maratona do Rio 2027 com as duas abas: intenção (quem
 * quer ir e qual distância) e inscrições da Meia (vagas, Pix, comprovantes).
 * A aba fica na URL (?aba=inscricoes) para dar para mandar o link direto.
 */
export function AbasAdmin({
  abaInicial,
  intencao,
  inscricoes,
  totais,
}: {
  abaInicial: Aba;
  intencao: ReactNode;
  inscricoes: ReactNode;
  totais: { intencao: number; inscricoes: number; conferir: number };
}) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>(abaInicial);

  function trocar(nova: Aba) {
    setAba(nova);
    const url = new URL(window.location.href);
    if (nova === "intencao") url.searchParams.delete("aba");
    else url.searchParams.set("aba", nova);
    window.history.replaceState(null, "", url);
  }

  async function sair() {
    await fetch("/api/maratona-rio-2027/admin/login", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  const abas: { id: Aba; nome: string; n: number; alerta?: number }[] = [
    { id: "intencao", nome: "Intenção", n: totais.intencao },
    { id: "inscricoes", nome: "Inscrições da Meia", n: totais.inscricoes, alerta: totais.conferir },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Painel da assessoria</p>
          <h1 className="mt-2 font-bora text-4xl font-black uppercase italic leading-none sm:text-5xl">
            Maratona do Rio 2027
          </h1>
        </div>
        <button
          type="button"
          onClick={sair}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-white/40 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </header>

      <div role="tablist" aria-label="Seções do painel" className="mt-6 flex gap-1 border-b border-white/10">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => trocar(a.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              aba === a.id ? "border-bora text-white" : "border-transparent text-white/50 hover:text-white"
            )}
          >
            {a.nome}
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">{a.n}</span>
            {Boolean(a.alerta) && (
              <span className="rounded-full bg-bora px-2 py-0.5 text-xs font-bold text-black" title="Comprovantes para conferir">
                {a.alerta} p/ conferir
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-6">
        <div hidden={aba !== "intencao"}>{intencao}</div>
        <div hidden={aba !== "inscricoes"}>{inscricoes}</div>
      </div>
    </div>
  );
}
