"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EVENT } from "@/lib/desafio-esteiras/event.config";

/**
 * Login da operação. Uma senha por papel (admin geral ou operador de unidade) —
 * quem digitou define o que enxerga. Sem lista de usuários para manter,
 * que é o que a operação de um dia de evento precisa.
 */
export function Login({ configurado }: { configurado: boolean }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/desafio-esteiras/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível entrar.");
        setEnviando(false);
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
      setEnviando(false);
    }
  }

  return (
    <main className="dst-wrap flex min-h-[100svh] items-center justify-center py-12">
      <div className="w-full max-w-[400px]">
        <p className="dst-label mb-5 text-[color:var(--somma)]">Operação do evento</p>
        <h1 className="dst-display text-[clamp(2rem,8vw,3.2rem)]">
          DESAFIO
          <br />
          DAS ESTEIRAS
        </h1>
        <p className="dst-label mt-4 text-[color:rgba(242,240,236,0.45)]">
          {EVENT.dataExtenso} · {EVENT.horaExtenso}
        </p>

        {!configurado ? (
          <div className="mt-9 border border-[color:var(--evolve)] bg-[rgba(224,38,27,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Acesso não configurado</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
              Defina <code className="dst-mono">DESAFIO_ESTEIRAS_ADMIN_PASSWORD</code> (e as senhas
              por unidade) nas variáveis de ambiente para liberar a operação.
            </p>
          </div>
        ) : (
          <form onSubmit={entrar} className="mt-9">
            <div className="dst-field-wrap">
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder=" "
                className="dst-field"
                required
              />
              <label htmlFor="senha" className="dst-field-label">
                Senha de acesso
              </label>
            </div>

            {erro && (
              <p role="alert" className="dst-label mt-3 text-[color:var(--evolve)]">
                {erro}
              </p>
            )}

            <button type="submit" disabled={enviando} className="dst-btn mt-7 w-full disabled:opacity-60">
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
