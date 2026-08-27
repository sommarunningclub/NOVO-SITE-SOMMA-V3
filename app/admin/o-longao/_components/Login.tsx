"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Login do painel do O LONGÃO. Uma senha só, a da organização: quem entra
 * enxerga tudo. Sem senha configurada no ambiente, o formulário nem abre e a
 * tela diz qual variável falta.
 */
export function Login({ configurado, envVar }: { configurado: boolean; envVar: string }) {
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
      const res = await fetch("/api/o-longao/admin/login", {
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
    <main className="lgo-wrap flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-[400px]">
        <p className="lgo-label mb-5 text-[color:var(--sinal)]">Organização</p>
        <h1 className="lgo-display text-[clamp(2rem,8vw,3rem)]">
          O LONGÃO
          <br />
          PAINEL
        </h1>

        {!configurado ? (
          <div className="mt-9 border border-[color:var(--somma)] bg-[rgba(255,44,4,0.1)] p-5">
            <p className="lgo-label mb-2 text-[color:var(--somma)]">Acesso não configurado</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
              Acesso não configurado. Defina <code className="lgo-mono">{envVar}</code> no ambiente.
            </p>
          </div>
        ) : (
          <form onSubmit={entrar} className="mt-9">
            <div className="lgo-field-wrap">
              <input
                id="lgo-senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder=" "
                className="lgo-field"
                required
              />
              <label htmlFor="lgo-senha" className="lgo-field-label">
                Senha de acesso
              </label>
            </div>

            {erro && (
              <p role="alert" className="lgo-mono mt-3 text-[0.85rem] text-[color:var(--somma)]">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="lgo-btn mt-7 w-full min-h-[48px] disabled:opacity-60"
            >
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
