"use client";

import { useState } from "react";
import Link from "next/link";
import { CAMINHO } from "@/lib/evp/config";
import type { Sessao } from "@/lib/evp/tipos";
import { AbaEquipe } from "./AbaEquipe";
import { AbaEvento } from "./AbaEvento";
import { AbaHistorico } from "./AbaHistorico";
import { AbaPainel } from "./AbaPainel";
import { AbaParticipantes } from "./AbaParticipantes";
import { AbaPercursos } from "./AbaPercursos";
import { BotaoSair } from "./LoginEquipe";

const ABAS = [
  { id: "painel", nome: "Painel" },
  { id: "participantes", nome: "Participantes" },
  { id: "evento", nome: "Evento" },
  { id: "percursos", nome: "Percursos" },
  { id: "equipe", nome: "Equipe" },
  { id: "historico", nome: "Histórico" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

export function Painel({ sessao }: { sessao: Sessao }) {
  const [aba, setAba] = useState<Aba>("painel");

  function teclas(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = ABAS.findIndex((a) => a.id === aba);
    const proxima = ABAS[(i + (e.key === "ArrowRight" ? 1 : ABAS.length - 1)) % ABAS.length];
    setAba(proxima.id);
    document.getElementById(`aba-${proxima.id}`)?.focus();
  }

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b" style={{ borderColor: "var(--mt-linha)" }}>
        <div className="mt-container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="mt-rotulo">Meeting Técnico · Painel</p>
            <p className="truncate text-sm" style={{ color: "var(--mt-cinza)" }}>
              {sessao.nome}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto [&>*]:max-sm:flex-1 [&>*]:max-sm:px-3 [&>*]:max-sm:text-[0.72rem]">
            <Link href={CAMINHO} className="mt-botao mt-botao--linha mt-botao--pequeno" target="_blank">
              Ver página
            </Link>
            <Link href={`${CAMINHO}/credenciamento`} className="mt-botao mt-botao--linha mt-botao--pequeno">
              Credenciamento
            </Link>
            <BotaoSair />
          </div>
        </div>
        <div className="mt-container">
          <div role="tablist" aria-label="Seções do painel" className="mt-rolagem-x -mb-px flex gap-1" onKeyDown={teclas}>
            {ABAS.map((a) => {
              const ativa = a.id === aba;
              return (
                <button
                  key={a.id}
                  id={`aba-${a.id}`}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  aria-controls={`painel-${a.id}`}
                  tabIndex={ativa ? 0 : -1}
                  onClick={() => setAba(a.id)}
                  className="mt-mono shrink-0 border-b-2 px-3 text-xs"
                  style={{
                    minHeight: 48,
                    borderColor: ativa ? "var(--mt-laranja)" : "transparent",
                    color: ativa ? "var(--mt-branco)" : "var(--mt-cinza)",
                  }}
                >
                  {a.nome}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mt-container pt-6" id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {aba === "painel" && <AbaPainel abrirEvento={() => setAba("evento")} />}
        {aba === "participantes" && <AbaParticipantes />}
        {aba === "evento" && <AbaEvento />}
        {aba === "percursos" && <AbaPercursos />}
        {aba === "equipe" && <AbaEquipe sessaoId={sessao.id} />}
        {aba === "historico" && <AbaHistorico />}
      </main>
    </div>
  );
}
