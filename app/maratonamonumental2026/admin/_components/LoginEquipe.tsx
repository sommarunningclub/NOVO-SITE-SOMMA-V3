"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const TITULO = { admin: "Painel do evento", credenciamento: "Credenciamento" } as const;

export function LoginEquipe({ destino }: { destino: "admin" | "credenciamento" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/evp/equipe/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha }),
      });
      const corpo = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErro(corpo.error ?? "Não foi possível entrar. Tente de novo.");
        return;
      }
      setSenha("");
      router.refresh();
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mt-container flex min-h-dvh items-center justify-center py-12">
      <form onSubmit={entrar} className="mt-cartao w-full max-w-md p-6 sm:p-8" noValidate>
        <p className="mt-rotulo">Meeting Técnico · Acesso da equipe</p>
        <h1 className="mt-titulo mt-3" style={{ fontSize: "clamp(1.9rem, 7vw, 2.75rem)" }}>
          {TITULO[destino]}
        </h1>
        <div className="mt-6 grid gap-4">
          <label className="mt-campo">
            <span className="mt-rotulo">E-mail</span>
            <input
              className="mt-input"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby="login-dica"
            />
            <span id="login-dica" className="mt-2 block text-sm" style={{ color: "var(--mt-cinza)", marginBottom: 0 }}>
              Deixe em branco para usar a senha mestra.
            </span>
          </label>
          <label className="mt-campo">
            <span className="mt-rotulo">Senha</span>
            <input
              className="mt-input"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              aria-invalid={erro ? true : undefined}
            />
          </label>
        </div>
        <p role="alert" aria-live="assertive" className="mt-erro min-h-5">
          {erro}
        </p>
        <button type="submit" className="mt-botao mt-botao--cheio mt-4 w-full" disabled={enviando || !senha}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

export function BotaoSair({ className = "mt-botao mt-botao--linha mt-botao--pequeno" }: { className?: string }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={saindo}
      onClick={async () => {
        setSaindo(true);
        await fetch("/api/evp/equipe/login", { method: "DELETE" }).catch(() => {});
        router.refresh();
        setSaindo(false);
      }}
    >
      {saindo ? "Saindo..." : "Sair"}
    </button>
  );
}
