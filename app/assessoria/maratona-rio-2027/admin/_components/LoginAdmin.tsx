"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export function LoginAdmin() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/maratona-rio-2027/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error || "Não deu certo. Tente de novo.");
        setEnviando(false);
        return;
      }
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bora text-black">
          <Lock className="h-5 w-5" />
        </span>
        <p className="mt-6 font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Painel da assessoria</p>
        <h1 className="mt-2 font-bora text-3xl font-black uppercase italic leading-none">Maratona do Rio 2027</h1>
        <label className="mt-8 block text-sm font-medium text-white/80">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            autoComplete="current-password"
            inputMode="numeric"
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white outline-none focus:border-bora"
          />
        </label>
        {erro && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando || !senha}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-bora px-6 py-4 font-bora font-bold uppercase text-black transition-colors hover:bg-white disabled:opacity-50"
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
        </button>
      </form>
    </div>
  );
}
