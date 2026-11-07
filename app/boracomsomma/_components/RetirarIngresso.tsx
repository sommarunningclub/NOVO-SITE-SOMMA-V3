"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Ticket } from "lucide-react";
import { cpfValido, emailValido, mascaraCpf } from "@/lib/boracomsomma/validacao";
import { cn } from "@/lib/utils";

export const CHAVE_INGRESSO = "boracomsomma:ingresso";

/** Guarda o token no aparelho, para a LP oferecer "ver meu ingresso" depois. */
export function guardarIngresso(token: string, primeiroNome: string, pelotao: string) {
  try {
    localStorage.setItem(CHAVE_INGRESSO, JSON.stringify({ token, nome: primeiroNome, pelotao }));
  } catch {
    /* sem armazenamento: o link segue valendo */
  }
}

/** "Retirar meu ingresso": CPF + e-mail do check-in levam à página do ingresso. */
export function RetirarIngresso({ abertoDeInicio = false, className }: { abertoDeInicio?: boolean; className?: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(abertoDeInicio);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const digitos = cpf.replace(/\D/g, "");
    if (!cpfValido(digitos) || !emailValido(email)) {
      setErro("Confira o CPF e o e-mail.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch("/api/boracomsomma/ingresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digitos, email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.token) {
        setErro(json.error || "Não deu para buscar agora. Tente de novo.");
        return;
      }
      router.push(`/boracomsomma/obrigado?t=${encodeURIComponent(json.token)}`);
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={cn("inline-flex items-center gap-2 text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline", className)}
      >
        <Ticket className="h-4 w-4 text-bora" /> Já fez check-in? Retirar meu ingresso
      </button>
    );
  }

  const campo =
    "w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder:text-white/35 outline-none focus:border-bora";

  return (
    <form onSubmit={enviar} noValidate className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6", className)}>
      <p className="flex items-center gap-2 font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">
        <Ticket className="h-4 w-4" /> Retirar meu ingresso
      </p>
      <p className="mt-2 text-sm text-white/60">Use o CPF e o e-mail que você colocou no check-in.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <input className={campo} placeholder="CPF" inputMode="numeric" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} aria-label="CPF" />
        <input
          className={campo}
          placeholder="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="E-mail"
        />
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-bora px-6 py-3.5 font-bold text-black disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Retirar
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {erro}
        </p>
      )}
    </form>
  );
}
