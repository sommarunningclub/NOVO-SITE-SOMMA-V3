"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Uma senha só: quem entra aqui dispara para a base inteira. */
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
      const res = await fetch("/api/campanhas/login", {
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
        <p className="dst-label mb-5 text-[color:var(--somma)]">Operação</p>
        <h1 className="dst-display text-[clamp(2rem,8vw,3.2rem)]">
          RÉGUA DE
          <br />
          CAMPANHAS
        </h1>

        {!configurado ? (
          <div className="mt-9 border border-[color:var(--evolve)] bg-[rgba(224,38,27,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Acesso não configurado</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
              Defina <code className="dst-mono">CAMPANHAS_ADMIN_PASSWORD</code> no ambiente.
            </p>
          </div>
        ) : (
          <form onSubmit={entrar} className="mt-9">
            <label className="dst-label block text-[color:rgba(242,240,236,0.45)]" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-2 w-full border border-[color:var(--line)] bg-transparent px-4 py-3 text-[1rem] text-[color:var(--paper)] outline-none focus:border-[color:var(--somma)]"
            />
            {erro && <p className="mt-3 text-[0.85rem] text-[color:var(--evolve)]">{erro}</p>}
            <button
              type="submit"
              disabled={enviando || !senha}
              className="dst-label mt-5 w-full bg-[color:var(--somma)] px-4 py-3.5 text-[color:var(--ink)] disabled:opacity-40"
            >
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
